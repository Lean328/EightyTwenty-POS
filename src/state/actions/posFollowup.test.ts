import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend } from '../../dev/localBackend';
import { buildLoyalty } from '../../features/ops/guests.view';
import { buildDiscountDialog } from '../../features/dialogs/till-dialogs.view';
import { buildPayDialog } from '../../features/dialogs/money-dialogs.view';
import { buildTillView } from '../../features/till/till.view';
import { setStaffToken } from '../../services/http/staffSession';
import { createTestStore } from '../../test/createTestStore';
import { cartToOrder, cartTotals, takePayment } from './payments';
import { quickAdd, sendKitchen } from './till';
import type { DialogOf } from '../types';

afterEach(() => setStaffToken(null));

async function liveStore() {
  const local = createLocalBackend();
  const getBalance = vi.fn().mockResolvedValue({ id: 'c3', stamps: 5, rewards: 2 });
  const ctx = await createTestStore({
    backend: {
      ...local,
      kind: 'http',
      loyalty: { ...local.loyalty, getBalance },
    },
  });
  setStaffToken('staff-token');
  ctx.store.setState({ online: true, customerId: 'c3' });
  return { ...ctx, getBalance };
}

function balance(ctx: Awaited<ReturnType<typeof liveStore>>, stamps: number, rewards: number) {
  ctx.store.setState((state) => ({
    customers: state.customers.map((c) => (c.id === 'c3' ? { ...c, stamps, rewards } : c)),
  }));
}

describe('POS follow-up integration', () => {
  it('shows multiple rewards and redeems just one without resetting progress', async () => {
    const ctx = await liveStore();
    ctx.outbox.setOnline(false);
    balance(ctx, 4, 3);
    const row = buildLoyalty(ctx.store).loyRows.find((r) => r.id === 'c3')!;
    expect(row.meta).toContain('3 reward');
    row.redeem();
    expect(ctx.store.state.customers.find((c) => c.id === 'c3')).toMatchObject({
      stamps: 4,
      rewards: 2,
    });
    expect(ctx.outbox.pending.at(-1)?.command).toMatchObject({
      type: 'loyalty.action',
      action: 'redeem',
    });
  });

  it('adds stamps while a reward is waiting and rolls over without losing rewards', async () => {
    const ctx = await liveStore();
    ctx.outbox.setOnline(false);
    balance(ctx, 8, 2);
    buildLoyalty(ctx.store)
      .loyRows.find((r) => r.id === 'c3')!
      .stamp();
    expect(ctx.store.state.customers.find((c) => c.id === 'c3')).toMatchObject({
      stamps: 0,
      rewards: 3,
    });
    expect(ctx.outbox.pending.at(-1)?.command).toMatchObject({
      type: 'loyalty.action',
      action: 'stamp',
    });
  });

  it('marks live orders for server loyalty and keeps the PIN staff name', async () => {
    const ctx = await liveStore();
    quickAdd(ctx.store, ctx.store.state.catalog.menuById.turmeric);
    const { o } = cartToOrder(ctx.store);
    expect(o.serverLoyalty).toBe(true);
    expect(o.staff).toBe(ctx.store.staff().name);
    expect(o.id).toMatch(/^TES-[A-Z0-9]{12}$/);
    expect(o.id).toHaveLength(16);
  });

  it('keeps the short order ID on the queued create and payment, without a legacy loyalty write', async () => {
    const ctx = await liveStore();
    ctx.outbox.setOnline(false);
    quickAdd(ctx.store, ctx.store.state.catalog.menuById.turmeric);
    buildTillView(ctx.store).openPay();
    const d = ctx.store.state.dlg as DialogOf<'pay'>;
    takePayment(ctx.store, {
      ref: d.key,
      method: 'card',
      amount: Math.round(cartTotals(ctx.store).total * 100),
      tip: 0,
      surcharge: 0,
    });
    const commands = ctx.outbox.pending.map((entry) => entry.command);
    const create = commands.find((command) => command.type === 'order.create');
    const payment = commands.find((command) => command.type === 'payment.record');
    expect(create?.type === 'order.create' && create.order.serverLoyalty).toBe(true);
    expect(payment?.type === 'payment.record' && payment.orderId).toBe(create?.type === 'order.create' && create.order.id);
    expect(commands.some((command) => command.type === 'loyalty.balance')).toBe(false);
  });

  it('refreshes the server balance after the outbox drains', async () => {
    const ctx = await liveStore();
    balance(ctx, 4, 3);
    buildLoyalty(ctx.store)
      .loyRows.find((r) => r.id === 'c3')!
      .redeem();
    await ctx.outbox.flush();
    await vi.waitFor(() => expect(ctx.store.state.customers.find((c) => c.id === 'c3')).toMatchObject({ stamps: 5, rewards: 2 }));
    expect(ctx.getBalance).toHaveBeenCalledWith('c3', {
      staffToken: 'staff-token',
    });
  });

  it('discards a stale balance and refreshes again when another action finishes during the read', async () => {
    const ctx = await liveStore();
    balance(ctx, 4, 3);
    let resolve!: (value: { id: string; stamps: number; rewards: number }) => void;
    ctx.getBalance.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    buildLoyalty(ctx.store)
      .loyRows.find((r) => r.id === 'c3')!
      .redeem();
    await ctx.outbox.flush();
    await vi.waitFor(() => expect(ctx.getBalance).toHaveBeenCalledTimes(1));
    buildLoyalty(ctx.store)
      .loyRows.find((r) => r.id === 'c3')!
      .stamp();
    await ctx.outbox.flush();
    resolve({ id: 'c3', stamps: 1, rewards: 0 });
    await vi.waitFor(() => expect(ctx.getBalance).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(ctx.store.state.customers.find((c) => c.id === 'c3')).toMatchObject({ stamps: 5, rewards: 2 }));
  });

  it('blocks live gift redemption before creating an order or recording payment', async () => {
    const ctx = await liveStore();
    quickAdd(ctx.store, ctx.store.state.catalog.menuById.turmeric);
    buildTillView(ctx.store).openPay();
    const d = ctx.store.state.dlg as DialogOf<'pay'>;
    const before = ctx.store.state.orders.length;
    takePayment(ctx.store, {
      ref: d.key,
      method: 'gift',
      amount: 500,
      tip: 0,
      surcharge: 0,
      giftLast4: '1234',
    });
    expect(ctx.store.state.orders).toHaveLength(before);
    expect(ctx.sent.some((command) => command.type === 'payment.record')).toBe(false);
    expect(buildPayDialog(ctx.store, d).methods.find((method) => method.id === 'gift')?.disabled).toBe(true);
  });

  it('blocks a stale gift card in discounts and a kitchen submission without losing the cart', async () => {
    const ctx = await liveStore();
    quickAdd(ctx.store, ctx.store.state.catalog.menuById.turmeric);
    ctx.store.setState({
      gift: { last4: '1234', amount: 5 },
      dlg: { kind: 'discount', tab: 'gift', code: '1234' },
    });
    const dialog = buildDiscountDialog(ctx.store, ctx.store.state.dlg as DialogOf<'discount'>);
    // A persisted gift selection cannot bypass the live payment guard through "Send to kitchen".
    expect(dialog.isGift).toBe(true);
    const before = ctx.store.state.orders.length;
    sendKitchen(ctx.store);
    expect(ctx.store.state.orders).toHaveLength(before);
    expect(ctx.store.state.lines.length).toBeGreaterThan(0);
  });
});
