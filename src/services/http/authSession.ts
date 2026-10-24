import { createHttpClient } from './httpClient';

interface TokenPair {
  access: string;
  refresh: string;
}

let tokens: TokenPair | null = null;

export function getAccessToken(): string | null {
  return tokens?.access ?? null;
}

export function clearLocalSession(): void {
  tokens = null;
}

export async function signIn(baseUrl: string, email: string, password: string): Promise<void> {
  clearLocalSession();

  const client = createHttpClient({
    baseUrl,
    timeoutMs: 15_000,
    terminalId: 'POS-LOGIN',
  });

  const result = await client.post<TokenPair>('/api/v1/auth/login', {
    email: email.trim(),
    password,
  });

  if (typeof result?.access !== 'string' || typeof result?.refresh !== 'string' || !result.access || !result.refresh) {
    throw new Error('The server returned an invalid login response.');
  }

  tokens = result;
}

/** A POS PIN session has no refresh token: expiry requires the staff PIN again. */
export function setPinAccessToken(access: string): void {
  tokens = { access, refresh: '' };
}

// Refresh tokens rotate, so concurrent requests must share one refresh operation.
let refreshing: Promise<string | null> | null = null;

export async function refreshSession(baseUrl: string, failedAccess: string | null): Promise<string | null> {
  if (!tokens) return null;
  if (tokens.access !== failedAccess) return tokens.access;
  if (refreshing) return refreshing;
  if (!tokens.refresh) return null;

  const original = tokens;
  const operation = (async () => {
    const client = createHttpClient({ baseUrl, timeoutMs: 15000, terminalId: 'POS-LOGIN' });
    const result = await client.post<TokenPair>('/api/v1/auth/refresh', { refresh: original.refresh });

    if (tokens !== original) return tokens?.access ?? null;
    if (!result?.access || !result?.refresh) {
      throw new Error('The server returned an invalid refresh response.');
    }

    tokens = result;
    return result.access;
  })();

  refreshing = operation;
  try {
    return await operation;
  } finally {
    if (refreshing === operation) refreshing = null;
  }
}
