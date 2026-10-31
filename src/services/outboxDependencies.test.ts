import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PosCommand } from './commands';
import { ApiError } from './http/httpClient';
import { Outbox } from './outbox';

describe('outbox dependencies', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not send payment when creating its order was rejected', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new ApiError('conflict', 'Order rejected', 409));
    const outbox = new Outbox(transport);
    outbox.setOnline(false);

    const create = { type: 'order.create', order: { id: 'ORDER-1' } } as PosCommand;
    const payment = { type: 'payment.record', orderId: 'ORDER-1', payment: {} } as PosCommand;

    outbox.enqueue(create);
    outbox.enqueue(payment);
    outbox.setOnline(true);
    await outbox.flush();

    expect(outbox.rejected).toHaveLength(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(outbox.pending.map((entry) => entry.command.type)).toContain('payment.record');
  });

  it('keeps a dependent payment blocked after reload', async () => {
    const firstTransport = vi.fn().mockRejectedValueOnce(new ApiError('conflict', 'Order rejected', 409));
    const outbox = new Outbox(firstTransport);
    outbox.setOnline(false);

    const create = { type: 'order.create', order: { id: 'ORDER-2' } } as PosCommand;
    const payment = { type: 'payment.record', orderId: 'ORDER-2', payment: {} } as PosCommand;

    outbox.enqueue(create);
    outbox.enqueue(payment);
    outbox.setOnline(true);
    await outbox.flush();

    expect(outbox.pending[0].blockedBy).toBeTruthy();

    const reloadedTransport = vi.fn();
    const reloaded = new Outbox(reloadedTransport);
    await reloaded.flush();

    expect(reloadedTransport).not.toHaveBeenCalled();
    expect(reloaded.pending).toHaveLength(1);
    expect(reloaded.pending[0].blockedBy).toBeTruthy();
    expect(reloaded.rejected).toHaveLength(1);
  });

  it('retries the rejected order with the original key and releases its payment only after success', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new ApiError('conflict', 'Order rejected', 409)).mockResolvedValue(undefined);
    const outbox = new Outbox(transport);
    outbox.setOnline(false);
    const create = outbox.enqueue({ type: 'order.create', order: { id: 'ORDER-3' } } as PosCommand);
    outbox.enqueue({ type: 'payment.record', orderId: 'ORDER-3', payment: {} } as PosCommand);
    outbox.setOnline(true);
    await outbox.flush();
    expect(outbox.pending[0].blockedBy).toBe(create.id);
    expect(outbox.retryRejectedOrder(create.id)).toBe(true);
    await outbox.flush();
    expect(transport.mock.calls[1][1]).toBe(create.id);
    expect(transport.mock.calls[2][0].type).toBe('payment.record');
    expect(outbox.pending).toHaveLength(0);
    expect(outbox.rejected).toHaveLength(0);
  });

  it('keeps the payment blocked if the retried order is rejected again', async () => {
    const transport = vi.fn().mockRejectedValue(new ApiError('conflict', 'Order rejected', 409));
    const outbox = new Outbox(transport);
    outbox.setOnline(false);
    const create = outbox.enqueue({ type: 'order.create', order: { id: 'ORDER-4' } } as PosCommand);
    outbox.enqueue({ type: 'payment.record', orderId: 'ORDER-4', payment: {} } as PosCommand);
    outbox.setOnline(true);
    await outbox.flush();
    expect(outbox.retryRejectedOrder(create.id)).toBe(true);
    await outbox.flush();
    expect(transport).toHaveBeenCalledTimes(2);
    expect(outbox.pending[0].blockedBy).toBe(create.id);
    expect(outbox.rejected).toHaveLength(1);
  });


  it('keeps a rejected order and blocks payment when retry cannot be saved', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new ApiError('conflict', 'Rejected', 409));
    const outbox = new Outbox(transport);
    outbox.setOnline(false);

    const order = outbox.enqueue({
      type: 'order.create',
      order: { id: 'ORDER-STORAGE' },
    } as PosCommand);
    outbox.enqueue({
      type: 'payment.record',
      orderId: 'ORDER-STORAGE',
      payment: {},
    } as PosCommand);

    outbox.setOnline(true);
    await outbox.flush();

    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    try {
      expect(outbox.retryRejectedOrder(order.id)).toBe(false);
      expect(outbox.storageError).toBe(true);
      expect(outbox.rejected.map((entry) => entry.id)).toContain(order.id);
      expect(outbox.pending).toHaveLength(1);
      expect(outbox.pending[0].blockedBy).toBe(order.id);
      expect(transport).toHaveBeenCalledTimes(1);
    } finally {
      write.mockRestore();
    }

    const reloaded = new Outbox(vi.fn());
    expect(reloaded.rejected.map((entry) => entry.id)).toContain(order.id);
    expect(reloaded.pending[0].blockedBy).toBe(order.id);
  });

  it('retains every rejected command for review', async () => {
    const transport = vi.fn().mockRejectedValue(new ApiError('conflict', 'Rejected', 409));
    const outbox = new Outbox(transport);
    outbox.setOnline(false);
    for (let index = 0; index < 101; index++) {
      outbox.enqueue({ type: 'order.create', order: { id: `ORDER-${index}` } } as PosCommand);
    }
    outbox.setOnline(true);
    await outbox.flush();
    expect(outbox.rejected).toHaveLength(101);
    const reloaded = new Outbox(vi.fn());
    expect(reloaded.rejected).toHaveLength(101);
  });

  it('reports when browser storage cannot save the queue', () => {
    const outbox = new Outbox(vi.fn());
    outbox.setOnline(false);
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    try {
      outbox.enqueue({ type: 'order.create', order: { id: 'ORDER-QUOTA' } } as PosCommand);
      expect(outbox.storageError).toBe(true);
      expect(outbox.pending).toHaveLength(1);
    } finally {
      write.mockRestore();
    }
  });

  it('saves all commands in a batch with stable keys before delivery', async () => {
    const transport = vi.fn().mockResolvedValue(undefined);
    const outbox = new Outbox(transport);
    outbox.setOnline(false);
    const create = { type: 'order.create', order: { id: 'ORDER-BATCH' } } as PosCommand;
    const payment = { type: 'payment.record', orderId: 'ORDER-BATCH', payment: {} } as PosCommand;
    const entries = outbox.enqueueBatch([{ command: create }, { command: payment }]);
    const reloaded = new Outbox(transport);
    expect(reloaded.pending.map((entry) => entry.id)).toEqual(entries.map((entry) => entry.id));
    expect(transport).not.toHaveBeenCalled();
    reloaded.setOnline(true);
    await reloaded.flush();
    expect(transport.mock.calls.map((call) => call[1])).toEqual(entries.map((entry) => entry.id));
  });

  it('rejects the whole batch when storage fails', () => {
    const transport = vi.fn();
    const outbox = new Outbox(transport);
    outbox.setOnline(false);
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    try {
      expect(() => outbox.enqueueBatch([
        { command: { type: 'order.create', order: { id: 'ORDER-FAIL' } } as PosCommand },
        { command: { type: 'payment.record', orderId: 'ORDER-FAIL', payment: {} } as PosCommand },
      ])).toThrow('Changes were not saved');
      expect(outbox.pending).toHaveLength(0);
      expect(outbox.storageError).toBe(true);
      expect(transport).not.toHaveBeenCalled();
    } finally {
      write.mockRestore();
    }
  });

  it.each(['order.create', 'payment.record'])('blocks loyalty after %s is rejected', async (failedType) => {
    const transport = vi.fn(async (command: PosCommand) => {
      if (command.type === failedType) throw new ApiError('conflict', 'Rejected', 409);
    });
    const outbox = new Outbox(transport);
    outbox.setOnline(false);
    outbox.enqueueBatch([
      { command: { type: 'order.create', order: { id: 'ORDER-LOYALTY' } } as PosCommand },
      { command: { type: 'payment.record', orderId: 'ORDER-LOYALTY', payment: {} } as PosCommand },
      { command: { type: 'loyalty.balance', customerId: 'C1', stamps: 3, rewards: 0, reason: 'Order', dependsOnOrderId: 'ORDER-LOYALTY' } },
    ]);
    outbox.setOnline(true);
    await outbox.flush();
    expect(transport.mock.calls.some(([command]) => command.type === 'loyalty.balance')).toBe(false);
    const pending = outbox.pending.find((entry) => entry.command.type === 'loyalty.balance');
    expect(pending?.blockedBy).toBe(outbox.rejected[0].id);
    const reloaded = new Outbox(vi.fn());
    expect(reloaded.pending.find((entry) => entry.command.type === 'loyalty.balance')?.blockedBy).toBe(outbox.rejected[0].id);
  });

  it('does not reject or resend a confirmed request when a delivery observer throws', async () => {
    const transport = vi.fn().mockResolvedValue({ id: 'ORDER-1' });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const outbox = new Outbox(transport);
      outbox.setOnline(false);
      outbox.onDelivered(() => { throw new Error('Observer failed'); });
      outbox.enqueue({ type: 'order.create', order: { id: 'ORDER-1' } } as PosCommand);
      outbox.setOnline(true);
      await outbox.flush();
      expect(outbox.pending).toHaveLength(0);
      expect(outbox.rejected).toHaveLength(0);
      expect(transport).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
    } finally { error.mockRestore(); }
  });

});
