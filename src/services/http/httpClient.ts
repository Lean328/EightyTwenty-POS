// Authentication: JWT access token sent in the Authorization header.
// Cookies are not sent.
import type { RequestOptions } from '../contracts';

export type ApiErrorKind =
  'offline' | 'timeout' | 'network' | 'unauthorized' | 'forbidden' | 'conflict' | 'validation' | 'server' | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
  }

  /** Safe to send again with the same idempotency key. */
  get retryable(): boolean {
    return this.kind === 'offline' || this.kind === 'timeout' || this.kind === 'network' || this.kind === 'server';
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  terminalId: string;
  fetchImpl?: typeof fetch;
  isOnline?: () => boolean;
  getAccessToken?: () => string | null;
  getDeviceCredential?: () => string | null;
}

export interface HttpClient {
  get<T>(path: string, opts?: RequestOptions): Promise<T>;
  post<T = void>(path: string, body: unknown, opts?: RequestOptions): Promise<T>;
  put<T = void>(path: string, body: unknown, opts?: RequestOptions): Promise<T>;
}

function classify(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function createHttpClient(o: HttpClientOptions): HttpClient {
  const doFetch = o.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const isOnline = o.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  async function request<T>(method: string, path: string, body: unknown, opts: RequestOptions = {}): Promise<T> {
    if (!isOnline()) throw new ApiError('offline', 'This till is offline.');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort('timeout'), o.timeoutMs);
    const onAbort = () => ctrl.abort(opts.signal?.reason);
    opts.signal?.addEventListener('abort', onAbort, { once: true });
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Terminal-Id': o.terminalId,
    };
    const token = o.getAccessToken?.();

    const deviceCredential = o.getDeviceCredential?.();
    if (deviceCredential) headers['X-Pos-Device'] = deviceCredential;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    if (opts.staffToken) headers['X-Pos-Staff'] = opts.staffToken;
    let res: Response;
    try {
      res = await doFetch(o.baseUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'omit',
        signal: ctrl.signal,
      });
    } catch (e) {
      if (ctrl.signal.aborted && ctrl.signal.reason === 'timeout') throw new ApiError('timeout', 'The server took too long to respond.');
      if (opts.signal?.aborted) throw e;
      throw new ApiError(isOnline() ? 'network' : 'offline', 'Could not reach the EightyTwenty server.');
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onAbort);
    }
    if (!res.ok) {
      let message = `Request failed (${res.status}).`,
        code: string | null = null;
      try {
        const err = (await res.json()) as {
          message?: string;
          code?: string;
          error?: {
            message?: string;
            code?: string;
          };
        };

        message = err.error?.message || err.message || message;
        code = err.error?.code || err.code || code;
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(classify(res.status), message, res.status, code);
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    get: (path, opts) => request('GET', path, undefined, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
  };
}
