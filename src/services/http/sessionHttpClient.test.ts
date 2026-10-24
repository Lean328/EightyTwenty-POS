import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type HttpClient } from './httpClient';
import { withSessionRefresh } from './sessionHttpClient';
import { getAccessToken, refreshSession } from './authSession';

vi.mock('./authSession', () => ({
  getAccessToken: vi.fn(),
  refreshSession: vi.fn(),
}));

describe('HTTP session refresh', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAccessToken).mockReturnValue('expired-access');
    vi.mocked(refreshSession).mockResolvedValue('new-access');
  });

  it('retries the same payment body and idempotency key after a 401', async () => {
    const post = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('unauthorized', 'Expired', 401))
      .mockResolvedValueOnce(undefined);
    const raw = { get: vi.fn(), post, put: vi.fn() } as HttpClient;
    const client = withSessionRefresh(raw, 'https://api.test');
    const body = { method: 'cash', amount: 1000, ref: 'PAY-1' };
    const opts = { idempotencyKey: 'CMD-1' };

    await client.post('/payment', body, opts);

    expect(refreshSession).toHaveBeenCalledWith('https://api.test', 'expired-access');
    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenNthCalledWith(1, '/payment', body, opts);
    expect(post).toHaveBeenNthCalledWith(2, '/payment', body, opts);
  });

  it('does not refresh or retry a validation failure', async () => {
    const error = new ApiError('validation', 'Invalid amount', 422);
    const post = vi.fn().mockRejectedValue(error);
    const raw = { get: vi.fn(), post, put: vi.fn() } as HttpClient;

    await expect(withSessionRefresh(raw, 'https://api.test').post('/payment', {})).rejects.toBe(error);
    expect(refreshSession).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('does not retry indefinitely when the replacement token is rejected', async () => {
    const post = vi.fn().mockRejectedValue(new ApiError('unauthorized', 'Expired', 401));
    const raw = { get: vi.fn(), post, put: vi.fn() } as HttpClient;

    await expect(withSessionRefresh(raw, 'https://api.test').post('/payment', {})).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(post).toHaveBeenCalledTimes(2);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });
});
