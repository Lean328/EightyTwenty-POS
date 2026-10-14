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

export async function signIn(
  baseUrl: string,
  email: string,
  password: string,
): Promise<void> {
  clearLocalSession();

  const client = createHttpClient({
    baseUrl,
    timeoutMs: 15_000,
    terminalId: 'POS-LOGIN',
  });

  const result = await client.post<TokenPair>(
    '/api/v1/auth/login',
    {
      email: email.trim(),
      password,
    },
  );

  if (
    typeof result?.access !== 'string' ||
    typeof result?.refresh !== 'string' ||
    !result.access ||
    !result.refresh
  ) {
    throw new Error('The server returned an invalid login response.');
  }

  tokens = result;
}