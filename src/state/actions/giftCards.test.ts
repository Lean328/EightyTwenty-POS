import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend } from '../../dev/localBackend';
import type { Order, OrderAdjustment, Payment } from '../../domain/types';
import { paidC } from '../../domain/ledger';
import { buildPayDialog, buildOrderActionDialog } from '../../features/dialogs/money-dialogs.view';
import { dispatchCommand } from '../../services/commands';
import { ApiError } from '../../services/http/httpClient';
import { setStaffToken } from '../../services/http/staffSession';
import { Outbox } from '../../services/outbox';
import { simulatedDevices } from '../../dev/simulatedDevices';
import { createTestStore, testConfig } from '../../test/createTestStore';
import { PosStore } from '../store';
import type { DialogOf } from '../types';
import { checkCustomerGiftCard, reviewRejectedGiftRequest } from './giftCards';
import { takePayment, chargeCard } from './payments';
import { applyOrderAction, openOrderAct } from './orders';

const cleanup: Array<() => void> = [];
afterEach(() => {
  cleanup.splice(0).forEach((stop) => stop());
  setStaffToken(null);
  vi.restoreAllMocks();
});
const dialog = (store: PosStore) => store.state.dlg as DialogOf<'pay'>;
const view = (store: PosStore) => buildPayDialog(store, dialog(store));

async function setup(balance = 5000) {
  const local = createLocalBackend();
  const orders = new Map<string, Order>();
  const captured = new Set<string>();
  const refunds = new Set<string>();
  const requests: { ref: string; key?: string }[] = [];
  const api = {
    balance,
    debitCount: 0,
    creditCount: 0,
    timeoutAfterDebit: false,
    timeoutAfterCredit: false,
    hold: null as Promise<void> | null,
  };
  const getBalance = vi.fn(async (customerId: string) => ({ id: 'card-id', customerId, last4: '4471', balance: api.balance }));
  const record = vi.fn(async (id: string, payment: Payment, opts?: { idempotencyKey?: string }) => {
    requests.push({ ref: payment.ref, key: opts?.idempotencyKey });
    if (api.hold) await api.hold;
    const order = orders.get(id)!;
    if (captured.has(payment.ref)) return structuredClone(order);
    if (payment.method === 'gift') {
      if (payment.giftCardId !== 'card-id' || payment.amount > api.balance)
        throw new ApiError('conflict', 'Insufficient gift balance.', 409);
      api.balance -= payment.amount;
      api.debitCount++;
    }
    captured.add(payment.ref);
    order.payments = [...(order.payments || []), structuredClone(payment)];
    order.methods = [...new Set([...order.methods, payment.method])];
    order.paid = paidC(order) >= Math.round(order.total * 100);
    if (api.timeoutAfterDebit) {
      api.timeoutAfterDebit = false;
      throw new ApiError('timeout', 'Response lost after server commit.');
    }
    return structuredClone(order);
  });
  const adjust = vi.fn(
    async (id: string, change: { adjustment: OrderAdjustment; status: Order['status']; lines: Order['lines']; total: number }) => {
      const order = orders.get(id)!;
      if (!refunds.has(change.adjustment.key)) {
        refunds.add(change.adjustment.key);
        api.balance += change.adjustment.alloc.filter((a) => a.method === 'gift').reduce((n, a) => n + a.amount, 0);
        api.creditCount++;
        order.refunds = [...(order.refunds || []), structuredClone(change.adjustment)];
        order.status = change.status;
        order.lines = structuredClone(change.lines);
        order.total = change.total;
        if (api.timeoutAfterCredit) {
          api.timeoutAfterCredit = false;
          throw new ApiError('timeout', 'Refund confirmation lost.');
        }
      }
      return structuredClone(order);
    },
  );
  const backend = {
    ...local,
    kind: 'http' as const,
    loadSnapshot: async () => ({ ...(await local.loadSnapshot()), orders: [...orders.values()] }),
    giftCards: { ...local.giftCards, getBalance, adjustBalance: vi.fn() },
    orders: {
      ...local.orders,
      listChanged: vi.fn(async () => ({ orders: structuredClone([...orders.values()]), cursor: 'cursor' })),
      create: vi.fn(async (order: Order) => {
        orders.set(order.id, structuredClone(order));
      }),
      adjust,
    },
    payments: { record },
  };
  const ctx = await createTestStore({ backend });
  setStaffToken('staff-token');
  ctx.store.setState({
    online: true,
    customerId: 'c3',
    orders: [],
    lines: [{ key: 'L1', itemId: 'turmeric', name: 'Coffee', price: 12, qty: 1, sel: {}, adjust: [], note: '' }],
    dlg: { kind: 'pay', key: 'GIFT-REF', method: 'gift', mode: 'full' },
  });
  cleanup.push(() => {
    ctx.store.stopPersisting();
    ctx.outbox.setOnline(false);
  });
  return { ...ctx, api, backend, getBalance, record, adjust, orders, requests };
}

async function checked(ctx: Awaited<ReturnType<typeof setup>>) {
  await checkCustomerGiftCard(ctx.store);
  expect(dialog(ctx.store).gift).toMatchObject({ id: 'card-id', balance: ctx.api.balance / 100 });
}

describe('live gift card payments', () => {
  it('looks up the selected customer with PIN credentials and converts cents only for display', async () => {
    const ctx = await setup(1234);
    await checked(ctx);
    expect(ctx.getBalance).toHaveBeenCalledWith('c3', { staffToken: 'staff-token' });
    expect(view(ctx.store).giftLine).toContain('$12.34');
    expect(view(ctx.store).methods.find((m) => m.id === 'gift')?.disabled).toBe(false);
  });

  it('keeps the order unpaid until the server confirms the gift debit', async () => {
    const ctx = await setup();
    await checked(ctx);
    let release!: () => void;
    ctx.api.hold = new Promise((done) => {
      release = done;
    });
    view(ctx.store).confirm();
    expect(ctx.store.state.dlg?.kind).toBe('pay');
    expect(ctx.store.state.orders[0].paid).toBe(false);
    expect(ctx.store.state.orders[0].payments).toEqual([]);
    expect(dialog(ctx.store).status).toBe('processing');
    await vi.waitFor(() => expect(ctx.record).toHaveBeenCalledTimes(1));
    view(ctx.store).confirm();
    expect(ctx.record).toHaveBeenCalledTimes(1);
    release();
    await ctx.outbox.flush();
    expect(ctx.store.state.dlg?.kind).toBe('receipt');
    expect(ctx.store.state.orders[0].paid).toBe(true);
    expect(ctx.api.balance).toBe(3800);
    expect(ctx.api.debitCount).toBe(1);
    expect(ctx.record.mock.calls[0][1]).toMatchObject({ giftCardId: 'card-id', giftLast4: '4471', amount: 1200, tip: 0, surcharge: 0 });
    expect(ctx.sent.some((c) => c.type === 'giftcard.adjust')).toBe(false);
  });

  it('uses a partial gift balance and leaves the rest open for another tender', async () => {
    const ctx = await setup(500);
    await checked(ctx);
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    expect(ctx.api.balance).toBe(0);
    expect(ctx.store.state.orders[0].paid).toBe(false);
    expect(paidC(ctx.store.state.orders[0])).toBe(500);
    expect(ctx.store.state.dlg?.kind).toBe('pay');
    expect(view(ctx.store).remainingS).toBe('$7.00');
    takePayment(ctx.store, { method: 'cash', amount: 700, tip: 0, surcharge: 0, ref: dialog(ctx.store).key });
    await ctx.outbox.flush();
    expect(ctx.store.state.orders[0].paid).toBe(true);
    expect(ctx.api.debitCount).toBe(1);
  });

  it('retries a lost confirmation with the original ref and queue key without a second debit', async () => {
    const ctx = await setup();
    await checked(ctx);
    ctx.api.timeoutAfterDebit = true;
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    expect(ctx.store.state.orders[0].paid).toBe(false);
    expect(ctx.outbox.pending.some((e) => e.command.type === 'payment.record')).toBe(true);
    expect(ctx.api.balance).toBe(3800);
    const device = vi.spyOn(ctx.store.devices, 'chargeCard');
    await chargeCard(ctx.store, { method: 'card', amount: 1200, tip: 0, surcharge: 0, ref: 'ANOTHER-REF' });
    expect(device).not.toHaveBeenCalled();
    await ctx.outbox.flush();
    expect(ctx.api.debitCount).toBe(1);
    expect(ctx.requests[1]).toEqual(ctx.requests[0]);
    expect(ctx.store.state.orders[0].paid).toBe(true);
    expect(ctx.store.state.dlg?.kind).toBe('receipt');
  });

  it('retains an uncertain payment across reload and confirms it without a second debit', async () => {
    const ctx = await setup();
    await checked(ctx);
    ctx.api.timeoutAfterDebit = true;
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    const key = ctx.requests[0];
    ctx.outbox.setOnline(false);
    ctx.store.flushPersistence();
    ctx.store.stopPersisting();
    const outbox = new Outbox((command, key) => dispatchCommand(ctx.backend, command, { idempotencyKey: key }));
    const store = new PosStore({ backend: ctx.backend, outbox, devices: simulatedDevices, config: testConfig });
    await store.load();
    store.setState({ staffId: 's1' });
    cleanup.push(() => {
      store.stopPersisting();
      outbox.setOnline(false);
    });
    await outbox.flush();
    expect(ctx.requests[1]).toEqual(key);
    expect(ctx.api.debitCount).toBe(1);
    expect(store.state.orders[0].paid).toBe(true);
    expect(outbox.pending).toHaveLength(0);
  });

  it('keeps a rejected gift debit unpaid and blocks another tender until reviewed', async () => {
    const ctx = await setup();
    await checked(ctx);
    ctx.api.balance = 0;
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    expect(ctx.outbox.rejected).toHaveLength(1);
    expect(ctx.store.state.orders[0].paid).toBe(false);
    expect(ctx.api.debitCount).toBe(0);
    expect(dialog(ctx.store).err).toContain('manager review');
    const count = ctx.sent.length;
    takePayment(ctx.store, { method: 'cash', amount: 1200, tip: 0, surcharge: 0, ref: 'OTHER' });
    expect(ctx.sent).toHaveLength(count);
    expect(view(ctx.store).confirmDisabled).toBe(true);
  });

  it('lets a manager resolve a rejected debit only after checking the actual server order', async () => {
    const ctx = await setup();
    await checked(ctx);
    ctx.api.balance = 0;
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    const entry = ctx.outbox.rejected[0];
    expect(await reviewRejectedGiftRequest(ctx.store, entry.id)).toBe(true);
    expect(ctx.outbox.rejected).toHaveLength(0);
    expect(ctx.store.state.orders[0].paid).toBe(false);
    expect(ctx.api.debitCount).toBe(0);
  });

  it('can finish an approved review after the cashier token is restored', async () => {
    const ctx = await setup();
    await checked(ctx);
    ctx.api.balance = 0;
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    setStaffToken('manager-approval-token');
    const review = reviewRejectedGiftRequest(ctx.store, ctx.outbox.rejected[0].id);
    setStaffToken('staff-token');
    expect(await review).toBe(true);
    expect(ctx.outbox.rejected).toHaveLength(0);
  });

  it('retains the rejected evidence if the server order cannot be read', async () => {
    const ctx = await setup();
    await checked(ctx);
    ctx.api.balance = 0;
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    ctx.backend.orders.listChanged.mockRejectedValueOnce(new Error('offline'));
    expect(await reviewRejectedGiftRequest(ctx.store, ctx.outbox.rejected[0].id)).toBe(false);
    expect(ctx.outbox.rejected).toHaveLength(1);
  });

  it('does not queue a gift debit if durable storage fails', async () => {
    const ctx = await setup();
    await checked(ctx);
    const originalKey = dialog(ctx.store).key;
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    view(ctx.store).confirm();
    write.mockRestore();
    expect(ctx.record).not.toHaveBeenCalled();
    expect(ctx.store.state.orders).toHaveLength(0);
    expect(ctx.outbox.pending).toHaveLength(0);
    expect(dialog(ctx.store).key).toBe(originalKey);
    expect(ctx.api.balance).toBe(5000);
  });

  it('rejects missing customers, offline requests and stale customer lookups', async () => {
    const ctx = await setup();
    ctx.store.setState({ customerId: null });
    await checkCustomerGiftCard(ctx.store);
    expect(ctx.getBalance).not.toHaveBeenCalled();
    ctx.store.setState({ customerId: 'c3', online: false });
    await checkCustomerGiftCard(ctx.store);
    expect(ctx.getBalance).not.toHaveBeenCalled();
    ctx.store.setState({ online: true });
    let release!: (value: { id: string; customerId: string; last4: string; balance: number }) => void;
    ctx.getBalance.mockReturnValueOnce(
      new Promise((done) => {
        release = done;
      }),
    );
    const read = checkCustomerGiftCard(ctx.store);
    ctx.store.setState({ customerId: 'c4' });
    release({ id: 'card-id', customerId: 'c3', last4: '4471', balance: 5000 });
    await read;
    expect(dialog(ctx.store).gift).toBeNull();
    expect(dialog(ctx.store).giftChecking).toBe(false);
  });

  it('does not credit twice when the refund response is lost after commit', async () => {
    const ctx = await setup();
    await checked(ctx);
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    const id = ctx.store.state.orders[0].id;
    ctx.api.timeoutAfterCredit = true;
    openOrderAct(ctx.store, id, 'refund');
    applyOrderAction(ctx.store, id, { mode: 'refund', amountC: 500, sel: {}, reason: 'Return', key: 'REFUND-TIMEOUT' }, null);
    await ctx.outbox.flush();
    expect(ctx.api.balance).toBe(4300);
    expect(ctx.store.state.orders[0].refunds).toBeUndefined();
    expect(ctx.outbox.pending.some((e) => e.command.type === 'order.adjust')).toBe(true);
    await ctx.outbox.flush();
    expect(ctx.api.balance).toBe(4300);
    expect(ctx.api.creditCount).toBe(1);
    expect(ctx.store.state.orders[0].refunds).toHaveLength(1);
  });

  it('returns partial and remaining refunds through the original payment allocation only', async () => {
    const ctx = await setup();
    await checked(ctx);
    view(ctx.store).confirm();
    await ctx.outbox.flush();
    const id = ctx.store.state.orders[0].id;
    openOrderAct(ctx.store, id, 'refund');
    applyOrderAction(ctx.store, id, { mode: 'refund', amountC: 500, sel: {}, reason: 'Part return', key: 'REFUND-1' }, null);
    expect(ctx.store.state.orders[0].refunds).toBeUndefined();
    expect(buildOrderActionDialog(ctx.store, ctx.store.state.dlg as DialogOf<'ordact'>)?.confirmBusy).toBe(true);
    await ctx.outbox.flush();
    expect(ctx.api.balance).toBe(4300);
    expect(ctx.store.state.orders[0].refunds?.[0].alloc).toEqual([{ method: 'gift', amount: 500, ref: 'GIFT-REF', giftLast4: '4471' }]);
    openOrderAct(ctx.store, id, 'refund');
    applyOrderAction(ctx.store, id, { mode: 'refund', amountC: 700, sel: {}, reason: 'Rest return', key: 'REFUND-2' }, null);
    await ctx.outbox.flush();
    expect(ctx.api.balance).toBe(5000);
    expect(ctx.api.creditCount).toBe(2);
    expect(ctx.backend.giftCards.adjustBalance).not.toHaveBeenCalled();
    expect(ctx.sent.some((c) => c.type === 'giftcard.adjust')).toBe(false);
    expect(ctx.store.state.orders[0].status).toBe('refunded');
  });
});
