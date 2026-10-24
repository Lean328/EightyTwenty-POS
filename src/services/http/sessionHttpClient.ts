import type { RequestOptions } from '../contracts';
import { getAccessToken, refreshSession } from './authSession';
import { ApiError, type HttpClient } from './httpClient';

/** Retry an expired access token once, preserving the request body and idempotency key. */
export function withSessionRefresh(client: HttpClient, baseUrl: string): HttpClient {
  async function run<T>(send: () => Promise<T>, opts?: RequestOptions): Promise<T> {
    const previousAccess = getAccessToken();

    try {
      return await send();
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== 'unauthorized' || opts?.signal?.aborted) {
        throw error;
      }

      const access = await refreshSession(baseUrl, previousAccess);
      if (!access) throw error;
      if (opts?.signal?.aborted) throw opts.signal.reason;

      return send();
    }
  }

  return {
    get: <T>(path: string, opts?: RequestOptions) => run(() => client.get<T>(path, opts), opts),
    post: <T = void>(path: string, body: unknown, opts?: RequestOptions) => run(() => client.post<T>(path, body, opts), opts),
    put: <T = void>(path: string, body: unknown, opts?: RequestOptions) => run(() => client.put<T>(path, body, opts), opts),
  };
}
