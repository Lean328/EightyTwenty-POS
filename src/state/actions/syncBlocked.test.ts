import { describe, expect, it, vi } from 'vitest';
import type { PosStore } from '../store';
import { runSync } from './sync';

describe('sync with blocked commands', () => {
  it('keeps orders queued and asks for review', async () => {
    const state = {
      online: true,
      soldOut: [],
      conflicts: [],
      queue: [{ id: 'command-1', orderId: 'ORDER-1' }],
      orders: [{ id: 'ORDER-1', lines: [], queued: true }],
      syncLog: [],
    };
    const say = vi.fn();
    const setState = vi.fn((patch: unknown) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      Object.assign(state, next);
    });
    const store = {
      state,
      setState,
      say,
      outbox: {
        setOnline: vi.fn(),
        flush: vi.fn().mockResolvedValue({ sent: 0, waiting: 1, error: null }),
        rejected: [{ id: 'rejected-create' }],
      },
    } as unknown as PosStore;

    await runSync(store);

    expect(state.orders[0].queued).toBe(true);
    expect(say).toHaveBeenCalledWith('Sync needs review — some changes are still waiting or were rejected');
  });
});
