import { describe, expect, it, vi } from 'vitest';
import { createHttpBackend } from './httpBackend';
import type { HttpClient } from './httpClient';

describe('loyalty balance API', () => {
  it('reads the balance for the requested customer', async () => {
    const balance = { id: 'customer 1', stamps: 7, rewards: 0 };
    const get = vi.fn().mockResolvedValue(balance);
    const http = { get, post: vi.fn(), put: vi.fn() } as unknown as HttpClient;
    const backend = createHttpBackend(http);

    const result = await backend.loyalty.getBalance!('customer 1');

    expect(result).toEqual(balance);
    expect(get).toHaveBeenCalledWith('/api/v1/pos/customers/customer%201/loyalty', undefined);
  });
});
