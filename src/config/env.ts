// Runtime configuration, read once from Vite environment variables (see .env.example).
// Only VITE_* variables reach the browser bundle, so nothing secret may ever be configured here:
// authentication is per staff member (PIN verified by the backend), not by a shared key.

export type DataProviderKind = 'local' | 'http';

export interface AppConfig {
  /** 'local' = development data in this browser only. 'http' = the EightyTwenty backend. */
  dataProvider: DataProviderKind;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  /** Identifies this till to the backend (order numbering, audit, device pairing). */
  terminalId: string;
  /** Simulation controls (mock website/app intake, connection loss, simulated card terminal/printers). */
  devTools: boolean;
  /** Problems that stop the app from starting safely. */
  errors: string[];
}

const TERMINAL_KEY = 'pos-terminal-id';

// One hosted build serves every till, so each device keeps its own ID: open the till once with
// ?terminal=BRADDON-TILL-1 and the device remembers it. Without one, VITE_TERMINAL_ID is used.
function deviceTerminalId(fallback: string): string {
  try {
    const url = new URL(window.location.href);
    const fromUrl = (url.searchParams.get('terminal') || '').trim().toUpperCase();
    if (/^[A-Z0-9-]{3,40}$/.test(fromUrl)) {
      localStorage.setItem(TERMINAL_KEY, fromUrl);
      url.searchParams.delete('terminal');
      window.history.replaceState(null, '', url.toString());
    }
    return localStorage.getItem(TERMINAL_KEY) || fallback;
  } catch {
    return fallback;
  }
}

function readConfig(): AppConfig {
  const env = import.meta.env;
  const errors: string[] = [];
  const raw = (env.VITE_DATA_PROVIDER || (env.DEV ? 'local' : '')).trim();
  const dataProvider: DataProviderKind = raw === 'http' ? 'http' : 'local';
  if (raw && raw !== 'http' && raw !== 'local') errors.push(`VITE_DATA_PROVIDER must be "local" or "http" (got "${raw}").`);
  if (!raw) errors.push('VITE_DATA_PROVIDER is not set. Production builds must choose a data provider explicitly.');

  const apiBaseUrl = (env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (dataProvider === 'http') {
    if (!apiBaseUrl) errors.push('VITE_API_BASE_URL is required when VITE_DATA_PROVIDER=http.');
    else if (!/^https:\/\//.test(apiBaseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(apiBaseUrl))
      errors.push('VITE_API_BASE_URL must use https:// (plain http is only allowed for localhost).');
  }
  // Local development data in a production bundle must be an explicit decision, never a default.
  if (dataProvider === 'local' && env.PROD && env.VITE_ALLOW_LOCAL_DATA_IN_PRODUCTION !== 'true')
    errors.push(
      'This production build is configured with local development data. Set VITE_DATA_PROVIDER=http, or set VITE_ALLOW_LOCAL_DATA_IN_PRODUCTION=true for a demo deployment.',
    );

  const timeout = Number(env.VITE_API_TIMEOUT_MS || 15000);
  return {
    dataProvider,
    apiBaseUrl,
    apiTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 15000,
    terminalId: deviceTerminalId((env.VITE_TERMINAL_ID || 'TILL-1').trim()),
    devTools: dataProvider === 'local' && (env.DEV || env.VITE_ENABLE_DEV_TOOLS === 'true'),
    errors,
  };
}

export const config: AppConfig = readConfig();
