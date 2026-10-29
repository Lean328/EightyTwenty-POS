import { describe, expect, it, vi } from 'vitest';
import type { PosStore } from '../../state/store';
import { buildSyncDialog } from './money-dialogs.view';

describe('sync order retry', () => {
  it('requires approval before placing the rejected order back in the queue', () => {
    const retry = vi.fn().mockReturnValue(true);
    let approved: (() => void) | undefined;
    const approve = vi.fn((_permission: string, _title: string, _body: string, next: () => void) => { approved = next; });
    const setState = vi.fn();
    const store = {
      state: { devices: {}, online: true, queue: [], conflicts: [], syncLog: [] },
      config: { devTools: false },
      devices: { simulated: false },
      outbox: { rejected: [{ id: 'CMD-1', command: { type: 'order.create', order: { id: 'ORDER-1' } } }], retryRejectedOrder: retry },
      approve, setState, say: vi.fn(),
    } as unknown as PosStore;

    const entry = buildSyncDialog(store).rejected[0];
    expect(entry.canRetry).toBe(true);
    entry.retry();
    expect(approve).toHaveBeenCalledWith('orders.refund', expect.any(String), expect.any(String), expect.any(Function));
    expect(retry).not.toHaveBeenCalled();
    approved?.();
    expect(retry).toHaveBeenCalledWith('CMD-1');
  });
});
