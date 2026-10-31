import { describe, expect, it, vi } from 'vitest';
import type { Order, Payment, OrderAdjustment } from '../../domain/types';
import type { HttpClient } from './httpClient';
import { createHttpBackend } from './httpBackend';

const payment: Payment = { method: 'gift', amount: 1234, tip: 0, surcharge: 0, ref: 'REF-1', giftCardId: 'card-uuid', giftLast4: '4471' };
const order = { id: 'BRA-1', total: 12.34, paid: true, lines: [], payments: [payment], refunds: [] } as unknown as Order;
const options = { staffToken: 'staff-token', idempotencyKey: 'CMD-key' };
function setup() {
  const get = vi.fn(),
    post = vi.fn(),
    put = vi.fn();
  return { get, post, backend: createHttpBackend({ get, post, put } as unknown as HttpClient) };
}

describe('deployed POS gift card contract', () => {
  it('rejects unsupported issuance and standalone balance edits without sending HTTP requests', async () => {
    const ctx = setup();
    await expect(ctx.backend.giftCards.issue({ amount: 50, customerId: 'c1', cafeId: 'braddon', issuedAt: 'POS', note: '' }))
      .rejects.toMatchObject({ kind: 'validation', retryable: false });
    await expect(ctx.backend.giftCards.adjustBalance('4471', 10, 'Top up'))
      .rejects.toMatchObject({ kind: 'validation', retryable: false });
    expect(ctx.post).not.toHaveBeenCalled();
  });

  it('reads the customer gift endpoint with staff auth and retains integer cents', async () => {
    const ctx = setup();
    const balance = { id: 'card-uuid', customerId: 'customer 1', last4: '4471', balance: 1234 };
    ctx.get.mockResolvedValue(balance);
    expect(await ctx.backend.giftCards.getBalance!('customer 1', options)).toEqual(balance);
    expect(ctx.get).toHaveBeenCalledWith('/api/v1/pos/customers/customer%201/gift-card', options);
  });

  it.each([
    undefined,
    { id: 'card-uuid', customerId: 'someone-else', last4: '4471', balance: 1234 },
    { id: 'card-uuid', customerId: 'customer 1', last4: '4471', balance: 12.34 },
  ])('rejects an invalid lookup response', async (response) => {
    const ctx = setup();
    ctx.get.mockResolvedValue(response);
    await expect(ctx.backend.giftCards.getBalance!('customer 1', options)).rejects.toMatchObject({ kind: 'server', retryable: true });
  });

  it('sends giftCardId and the stable tender ref to the existing payment endpoint', async () => {
    const ctx = setup();
    ctx.post.mockResolvedValue(order);
    expect(await ctx.backend.payments.record('BRA-1', payment, options)).toEqual(order);
    expect(ctx.post).toHaveBeenCalledWith('/api/v1/pos/orders/BRA-1/payments', payment, options);
    expect(ctx.post).toHaveBeenCalledTimes(1);
  });

  it('keeps an unverifiable acknowledgment retryable using the same ref', async () => {
    const ctx = setup();
    ctx.post.mockResolvedValue({ ...order, payments: [{ ...payment, ref: 'OTHER' }] });
    await expect(ctx.backend.payments.record('BRA-1', payment, options)).rejects.toMatchObject({ kind: 'server', retryable: true });
  });

  it('sends refund allocations once to adjustments, without a separate gift balance write', async () => {
    const ctx = setup();
    const adjustment = {
      key: 'R1',
      mode: 'refund',
      amount: 1234,
      alloc: [{ method: 'gift', amount: 1234, ref: 'REF-1', giftLast4: '4471' }],
    } as OrderAdjustment;
    const change = { adjustment, lines: [], total: 12.34, status: 'refunded' as const };
    ctx.post.mockResolvedValue({ ...order, refunds: [adjustment] });
    await ctx.backend.orders.adjust('BRA-1', change, options);
    expect(ctx.post).toHaveBeenCalledWith('/api/v1/pos/orders/BRA-1/adjustments', change, options);
    expect(ctx.post).toHaveBeenCalledTimes(1);
  });
});
