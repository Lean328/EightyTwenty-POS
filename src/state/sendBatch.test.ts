import { describe, expect, it, vi } from 'vitest';
import { PosStore } from './store';

vi.mock('../services/http/staffSession', () => ({ getStaffToken: () => 'session-token' }));

describe('sendBatch', () => {
  it('attaches the staff session to each HTTP command before persisting the batch', () => {
    const enqueueBatch = vi.fn();
    const store = { backend: { kind: 'http' }, outbox: { enqueueBatch } } as unknown as PosStore;
    PosStore.prototype.sendBatch.call(store, [
      { command: { type: 'order.accept', orderId: 'ORDER-1' } },
      { command: { type: 'order.status', orderId: 'ORDER-1', status: 'ready', note: '' }, label: 'Order' },
    ]);
    expect(enqueueBatch).toHaveBeenCalledWith([
      { command: { type: 'order.accept', orderId: 'ORDER-1', staffToken: 'session-token' }, label: undefined },
      { command: { type: 'order.status', orderId: 'ORDER-1', status: 'ready', note: '', staffToken: 'session-token' }, label: 'Order' },
    ]);
  });
});
