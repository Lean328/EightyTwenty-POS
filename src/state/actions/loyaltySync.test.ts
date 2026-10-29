import { describe, expect, it, vi } from 'vitest';
import type { PosStore } from '../store';
import { refreshCustomerLoyalty } from './loyaltySync';

vi.mock('../../services/http/staffSession', () => ({
  getStaffToken: () => 'staff-token',
}));

function setup() {
  let notify = () => {};
  const unsubscribe = vi.fn();
  const getBalance = vi.fn().mockResolvedValue({ id: 'customer-1', stamps: 7, rewards: 0 });
  const setState = vi.fn();
  const outbox = {
    pending: [] as unknown[],
    rejected: [] as unknown[],
    subscribe: vi.fn((listener: () => void) => {
      notify = listener;
      return unsubscribe;
    }),
  };
  const state = {
    online: true,
    cafe: 'braddon',
    staffId: 'staff-1',
    customers: [{ id: 'customer-1', stamps: 2, rewards: 0 }],
  };
  const store = {
    backend: { kind: 'http', loyalty: { getBalance } },
    state,
    outbox,
    setState,
  } as unknown as PosStore;

  return { store, state, outbox, getBalance, setState, unsubscribe, notify: () => notify() };
}

describe('refreshCustomerLoyalty', () => {
  it('updates the customer after a successful read', async () => {
    const ctx = setup();

    expect(await refreshCustomerLoyalty(ctx.store, 'customer-1')).toBe(true);
    expect(ctx.getBalance).toHaveBeenCalledWith('customer-1', { staffToken: 'staff-token' });
    expect(ctx.setState).toHaveBeenCalledOnce();

    const update = ctx.setState.mock.calls[0][0];
    expect(update(ctx.state).customers[0]).toEqual({ id: 'customer-1', stamps: 7, rewards: 0 });
    expect(ctx.unsubscribe).toHaveBeenCalledOnce();
  });

  it('does not refresh while commands are pending or rejected', async () => {
    const ctx = setup();
    ctx.outbox.pending.push({});

    expect(await refreshCustomerLoyalty(ctx.store, 'customer-1')).toBe(false);
    expect(ctx.getBalance).not.toHaveBeenCalled();

    ctx.outbox.pending.length = 0;
    ctx.outbox.rejected.push({});

    expect(await refreshCustomerLoyalty(ctx.store, 'customer-1')).toBe(false);
    expect(ctx.getBalance).not.toHaveBeenCalled();
  });

  it('discards the response if the outbox changed during the request', async () => {
    const ctx = setup();
    let resolve!: (value: { id: string; stamps: number; rewards: number }) => void;
    ctx.getBalance.mockReturnValue(new Promise((done) => { resolve = done; }));

    const pending = refreshCustomerLoyalty(ctx.store, 'customer-1');
    ctx.notify();
    resolve({ id: 'customer-1', stamps: 7, rewards: 0 });

    expect(await pending).toBe(false);
    expect(ctx.setState).not.toHaveBeenCalled();
    expect(ctx.unsubscribe).toHaveBeenCalledOnce();
  });
});
