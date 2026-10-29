import { describe, expect, it, vi } from 'vitest';
import type { Customer, Order } from '../../domain/types';
import type { PosStore } from '../store';
import { awardLoyalty } from './payments';

describe('server-managed order loyalty', () => {
  it('does not send a legacy balance update for a managed order', () => {
    const send = vi.fn();
    const store = { send } as unknown as PosStore;
    const customer = { id: 'customer-1', stamps: 2, rewards: 0 } as Customer;
    const order = {
      id: 'order-1',
      customerId: customer.id,
      stamped: false,
      serverLoyalty: true,
    } as Order;

    const [customers, message] = awardLoyalty(store, order, [customer]);

    expect(customers).toEqual([customer]);
    expect(message).toBe('');
    expect(send).not.toHaveBeenCalled();
  });
});
