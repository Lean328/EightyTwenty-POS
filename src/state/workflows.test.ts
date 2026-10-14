// Critical till workflows, exercised through the same view-model actions the screens call.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChangeEvent } from 'react';
import { buildOrderActionDialog, buildPayDialog, buildShiftDialog } from '../features/dialogs/money-dialogs.view';
import { buildDiscountDialog, buildPinDialog } from '../features/dialogs/till-dialogs.view';
import { buildFormView } from '../features/ops/forms.view';
import { buildTillView } from '../features/till/till.view';
import { lineShareC, paidC, refundedC } from '../domain/ledger';
import { createTestStore } from '../test/createTestStore';
import { isLocked } from './actions/auth';
import { effective } from './actions/catalog';
import { openOrderAct } from './actions/orders';
import { openShift } from './actions/shifts';
import { runSync, setOnline } from './actions/sync';
import { quickAdd, sendKitchen } from './actions/till';
import type { PosStore } from './store';
import type { DialogOf } from './types';

const ev = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>;
const add = (store: PosStore, id: string, n = 1) => {
  for (let i = 0; i < n; i++) quickAdd(store, effective(store, store.state.catalog.menuById[id]));
};
const payDlg = (store: PosStore) => store.state.dlg as DialogOf<'pay'>;
const pay = (store: PosStore) => buildPayDialog(store, payDlg(store));
const pressPin = async (store: PosStore, pin: string) => {
  for (const k of pin) {
    const d = store.state.dlg as DialogOf<'pin'>;
    await buildPinDialog(store, d)
      .keys.find((x) => x.label === k)!
      .pick();
    await new Promise((r) => setTimeout(r, 0));
  }
};
const lastOrder = (store: PosStore) => store.state.orders[0];

afterEach(() => vi.useRealTimers());

describe('checkout', () => {
  it('takes a cash sale: order, payment, change, drawer, loyalty-free receipt and backend commands', async () => {
    const { store, outbox, types } = await createTestStore();
    openShift(store, 20000);
    add(store, 'turmeric', 2); // 2 × $5.50
    expect(store.state.lines[0].qty).toBe(2);
    buildTillView(store).openPay();
    pay(store)
      .methods.find((m) => m.id === 'cash')!
      .pick();
    pay(store).setTender(ev('20'));
    expect(pay(store).changeS).toBe('$9.00');
    pay(store).confirm();
    const o = lastOrder(store);
    expect(o).toMatchObject({ total: 11, paid: true, status: 'new', channel: 'pos' });
    expect(o.payments![0]).toMatchObject({ method: 'cash', amount: 1100, cashPaid: 1100, change: 900, rounding: 0 });
    expect(store.state.dlg).toMatchObject({ kind: 'receipt', orderId: o.id });
    expect(store.state.lines).toEqual([]);
    expect(store.state.shift!.cashSales).toBe(1100);
    await outbox.flush();
    expect(types()).toEqual(expect.arrayContaining(['shift.open', 'order.create', 'payment.record', 'transaction.record']));
  });

  it('rounds cash to 5c and refuses short tender', async () => {
    const { store } = await createTestStore();
    openShift(store, 0);
    add(store, 'original-coffee-8'); // Babychino $2.50
    store.setState({ discount: { kind: 'amt', value: 0.03, label: '3c off' } }); // $2.47 → $2.45 cash
    buildTillView(store).openPay();
    pay(store)
      .methods.find((m) => m.id === 'cash')!
      .pick();
    expect(pay(store).cashDueS).toBe('$2.45');
    pay(store).setTender(ev('2'));
    pay(store).confirm();
    expect(payDlg(store).err).toBe('Tendered $2.00 is less than $2.45.');
    expect(store.state.orders.filter((o) => o.total === 2.47)).toHaveLength(0);
  });

  it('ignores a second tap on the same payment (no duplicate order or tender)', async () => {
    const { store } = await createTestStore();
    openShift(store, 0);
    add(store, 'icedlatte');
    buildTillView(store).openPay();
    pay(store)
      .methods.find((m) => m.id === 'cash')!
      .pick();
    pay(store).setTender(ev('10'));
    const before = store.state.orders.length;
    const stale = pay(store);
    stale.confirm();
    stale.confirm();
    expect(store.state.orders.length).toBe(before + 1);
    expect(lastOrder(store).payments).toHaveLength(1);
    expect(store.state.dlg?.kind).toBe('receipt');
  });

  it('charges a card through the (simulated) terminal with surcharge, and handles a decline', async () => {
    vi.useFakeTimers();
    const { store } = await createTestStore();
    add(store, 'turmeric', 2);
    buildTillView(store).openPay();
    expect(payDlg(store).method).toBe('card');
    pay(store).declineNext();
    pay(store).confirm();
    expect(payDlg(store).status).toBe('processing');
    pay(store).confirm(); // second tap while processing does nothing
    await vi.advanceTimersByTimeAsync(1200);
    expect(payDlg(store)).toMatchObject({ status: 'failed', err: expect.stringContaining('declined') });
    pay(store).confirm();
    await vi.advanceTimersByTimeAsync(1200);
    const o = lastOrder(store);
    expect(o.paid).toBe(true);
    expect(o.payments![0]).toMatchObject({ method: 'card', amount: 1100, surcharge: 32 });
  });

  it('fails a card payment cleanly when the terminal is offline (no order created)', async () => {
    vi.useFakeTimers();
    const { store } = await createTestStore();
    store.setState({ devices: { ...store.state.devices, terminal: 'offline' } });
    add(store, 'icedlatte');
    const before = store.state.orders.length;
    buildTillView(store).openPay();
    pay(store).confirm();
    await vi.advanceTimersByTimeAsync(1200);
    expect(payDlg(store)).toMatchObject({ status: 'failed', err: expect.stringContaining('no charge was made') });
    expect(store.state.orders.length).toBe(before);
  });

  it('splits a bill into equal shares; the order is paid on the last share', async () => {
    const { store } = await createTestStore();
    openShift(store, 0);
    add(store, 'turmeric', 2);
    buildTillView(store).openPay();
    pay(store)
      .methods.find((m) => m.id === 'cash')!
      .pick();
    pay(store)
      .modes.find((m) => m.id === 'equal')!
      .pick();
    expect(pay(store).thisS).toBe('$5.50');
    pay(store).setTender(ev('5.50'));
    pay(store).confirm();
    const id = lastOrder(store).id;
    expect(lastOrder(store).paid).toBe(false);
    expect(payDlg(store)).toMatchObject({ kind: 'pay', forOrderId: id, count: 1 });
    pay(store)
      .methods.find((m) => m.id === 'cash')!
      .pick();
    pay(store).setTender(ev('5.50'));
    pay(store).confirm();
    expect(store.state.orders.find((o) => o.id === id)).toMatchObject({ paid: true });
    expect(paidC(store.state.orders.find((o) => o.id === id)!)).toBe(1100);
  });

  it('completes a fully comped order with a zero tender', async () => {
    const { store } = await createTestStore();
    add(store, 'turmeric');
    store.setState({ discount: { kind: 'pct', value: 100, label: 'Comp 100%' } });
    buildTillView(store).openPay();
    pay(store).confirm();
    expect(lastOrder(store)).toMatchObject({ total: 0, paid: true });
    expect(store.state.dlg?.kind).toBe('receipt');
  });
});

describe('loyalty and gift cards', () => {
  it('stamps coffees for an attached customer and redeems a free coffee', async () => {
    const { store } = await createTestStore();
    openShift(store, 0);
    store.setState({ customerId: 'c3' }); // Aisha, 2 stamps
    add(store, 'turmeric', 2);
    buildTillView(store).openPay();
    pay(store)
      .methods.find((m) => m.id === 'cash')!
      .pick();
    pay(store).setTender(ev('20'));
    pay(store).confirm();
    expect(store.state.customers.find((c) => c.id === 'c3')!.stamps).toBe(4);
    expect(store.state.dlg).toMatchObject({ kind: 'receipt', loyalty: 'Aisha earned 2 stamps · 5 to go' });

    store.setState({ dlg: null, customerId: 'c2' }); // Marcus, 1 reward ready
    add(store, 'turmeric');
    store.setState({ dlg: { kind: 'discount', tab: 'reward' } });
    buildDiscountDialog(store, store.state.dlg as DialogOf<'discount'>).applyReward();
    expect(store.state.discount).toMatchObject({ kind: 'reward', value: 5.5 });
    buildTillView(store).openPay();
    pay(store).confirm();
    const marcus = store.state.customers.find((c) => c.id === 'c2')!;
    expect(marcus.rewards).toBe(0);
    expect(lastOrder(store).payments![0].method).toBe('reward');
  });

  it('applies a gift card from Discounts as the first payment and restores it on refund', async () => {
    const { store } = await createTestStore();
    openShift(store, 0);
    add(store, 'turmeric', 2); // $11
    store.setState({ dlg: { kind: 'discount', tab: 'gift', code: '8020' } });
    buildDiscountDialog(store, store.state.dlg as DialogOf<'discount'>).applyGift();
    expect(store.state.gift).toEqual({ last4: '8020', amount: 11 });
    buildTillView(store).openPay();
    pay(store).confirm(); // the gift card covers the whole bill, so this closes the order with nothing more to take
    const card = () => store.state.giftcards.find((g) => g.code.endsWith('8020'))!;
    const o = store.state.orders.find((x) => x.payments?.some((p) => p.method === 'gift'));
    expect(card().balance).toBe(31.5);
    expect(o).toMatchObject({ paid: true, total: 11 });
    openOrderAct(store, o!.id, 'refund');
    const d = store.state.dlg as DialogOf<'ordact'>;
    store.setState({ dlg: { ...d, by: 'amount', amount: '11', reason: 'Quality issue' } });
    buildOrderActionDialog(store, store.state.dlg as DialogOf<'ordact'>)!.confirm();
    expect(card().balance).toBe(42.5);
    expect(store.state.orders.find((x) => x.id === o!.id)!.status).toBe('refunded');
  });
});

describe('refunds, voids and cancellations', () => {
  it('needs a manager PIN for a cashier refund and records the approver', async () => {
    const { store } = await createTestStore({ staffId: 's3' }); // Priya, cashier
    expect(store.can('orders.refund')).toBe(false);
    const o = store.state.orders.find((x) => x.id === '#8020-4465')!; // paid card, $5.50
    openOrderAct(store, o.id, 'refund');
    const d = store.state.dlg as DialogOf<'ordact'>;
    store.setState({ dlg: { ...d, sel: { [o.lines[0].key]: 1 }, reason: 'Wrong item made' } });
    const vm = buildOrderActionDialog(store, store.state.dlg as DialogOf<'ordact'>)!;
    expect(vm.permNote).toBe('Needs a manager PIN.');
    vm.confirm();
    expect(store.state.dlg).toMatchObject({ kind: 'pin', title: 'Manager approval' });
    await pressPin(store, '1111'); // the cashier's own PIN is refused
    expect(store.state.dlg).toMatchObject({ kind: 'pin', err: 'Priya Sood is a Cashier — not permitted' });
    await pressPin(store, '1357'); // Tom, manager
    const after = store.state.orders.find((x) => x.id === o.id)!;
    expect(after.status).toBe('refunded');
    expect(after.refunds![0]).toMatchObject({ amount: 550, approver: 'Tom Ellery', by: 'Priya Sood' });
    expect(store.state.audit[0]).toMatchObject({ action: 'Order refunded', approver: 'Tom Ellery' });
  });

  it('refunds part of an order and keeps it open for further refunds', async () => {
    const { store } = await createTestStore();
    const o = store.state.orders.find((x) => x.id === '#8020-4463')!; // 2 flat whites + kids meal, cash
    openOrderAct(store, o.id, 'refund');
    const d = store.state.dlg as DialogOf<'ordact'>;
    store.setState({ dlg: { ...d, sel: { [o.lines[0].key]: 1 }, reason: 'Quality issue' } });
    buildOrderActionDialog(store, store.state.dlg as DialogOf<'ordact'>)!.confirm();
    const after = store.state.orders.find((x) => x.id === o.id)!;
    const unit = lineShareC(o, o.lines[0].key, 1);
    expect(after.status).toBe('completed');
    expect(refundedC(after)).toBe(unit);
    // The same action key cannot be applied twice.
    buildOrderActionDialog(store, { ...d, sel: { [o.lines[0].key]: 1 }, reason: 'Quality issue' })!.confirm();
    expect(refundedC(store.state.orders.find((x) => x.id === o.id)!)).toBe(unit);
  });

  it('voids items on an open tab (bill reduced, nothing refunded) and cancels an unpaid order', async () => {
    const { store } = await createTestStore();
    add(store, 'turmeric', 2);
    add(store, 'icedlatte');
    sendKitchen(store);
    const o = lastOrder(store);
    expect(o).toMatchObject({ status: 'preparing', paid: false, total: 17 });
    openOrderAct(store, o.id, 'void');
    const d = store.state.dlg as DialogOf<'ordact'>;
    store.setState({ dlg: { ...d, sel: { [o.lines[1].key]: 1 }, reason: 'Entered by mistake' } });
    buildOrderActionDialog(store, store.state.dlg as DialogOf<'ordact'>)!.confirm();
    const voided = store.state.orders.find((x) => x.id === o.id)!;
    expect(voided.total).toBe(11);
    expect(voided.lines).toHaveLength(1);
    expect(voided.refunds![0].amount).toBe(0);

    const fresh = store.state.orders.find((x) => x.id === '#8020-4471')!; // new app order
    store.setState({
      orders: store.state.orders.map((x) => (x.id === fresh.id ? { ...x, accepted: true, paid: false, payments: [] } : x)),
    });
    openOrderAct(store, fresh.id, 'cancel');
    const c = store.state.dlg as DialogOf<'ordact'>;
    store.setState({ dlg: { ...c, reason: 'Customer cancelled' } });
    buildOrderActionDialog(store, store.state.dlg as DialogOf<'ordact'>)!.confirm();
    expect(store.state.orders.find((x) => x.id === fresh.id)!.status).toBe('cancelled');
  });
});

describe('till operations', () => {
  it('sends a cart to the kitchen once, even on a double tap', async () => {
    const { store } = await createTestStore();
    add(store, 'icedlatte');
    const before = store.state.orders.length;
    sendKitchen(store);
    sendKitchen(store);
    expect(store.state.orders.length).toBe(before + 1);
    expect(store.state.toast).toBe('Add items first');
  });

  it('queues offline sales and syncs them, flagging items sold out while offline', async () => {
    const { store, outbox } = await createTestStore();
    setOnline(store, false);
    add(store, 'icedlatte');
    sendKitchen(store);
    const o = lastOrder(store);
    expect(o.queued).toBe(true);
    expect(store.state.queue).toEqual([expect.objectContaining({ orderId: o.id, label: `${o.id} · sent to kitchen offline` })]);
    store.setState({ soldOut: [...store.state.soldOut, 'icedlatte'] });
    store.setState({ online: true });
    await runSync(store);
    expect(outbox.pending).toHaveLength(0);
    expect(store.state.queue).toEqual([]);
    expect(store.state.orders.find((x) => x.id === o.id)!.queued).toBe(false);
    expect(store.state.conflicts[0].msg).toContain('marked sold out while offline');
  });

  it('closes a shift with a variance over $5 only with a note and approval', async () => {
    const { store } = await createTestStore();
    openShift(store, 20000);
    store.setState({ dlg: { kind: 'shift', mode: 'close', counted: '190' } });
    const vm = () => {
      const v = buildShiftDialog(store, store.state.dlg as DialogOf<'shift'>)!;
      if (!v.isManage) throw new Error('expected the manage view');
      return v;
    };
    expect(vm().varianceS).toBe('−$10.00');
    vm().confirmClose();
    expect((store.state.dlg as DialogOf<'shift'>).err).toBe('Add a note explaining the variance.');
    store.setState({ dlg: { ...(store.state.dlg as DialogOf<'shift'>), note: 'Float miscounted' } });
    vm().confirmClose(); // admin can approve their own variance
    expect(store.state.shift).toBeNull();
    expect(store.state.shifts[0]).toMatchObject({ expected: 20000, counted: 19000, variance: -1000, note: 'Float miscounted' });
  });

  it('locks sections by role', async () => {
    const { store } = await createTestStore({ staffId: 's3' });
    expect(isLocked(store, 'reports')).toBe(true);
    expect(isLocked(store, 'customers')).toBe(false);
    store.setState({ staffId: 's2' });
    expect(isLocked(store, 'reports')).toBe(false);
    expect(isLocked(store, 'settings')).toBe(false); // settings.view
    expect(store.can('settings')).toBe(false);
  });
});

describe('back-office forms', () => {
  it('validates and creates a catering enquiry with a quote', async () => {
    const { store, outbox, types } = await createTestStore();
    store.setOps({
      form: {
        kind: 'cat',
        v: {
          packageId: 'Lunch',
          guests: 8,
          date: '2026-12-01',
          time: '12:00',
          fulfil: 'delivery',
          name: 'Acme',
          address: '1 St',
          status: 'enquiry',
        },
      },
    });
    buildFormView(store, store.state.ops.form!).submit();
    expect(store.state.ops.form!.err).toBe('Catering is for 10 guests or more.');
    store.setOps({ form: { ...store.state.ops.form!, v: { ...store.state.ops.form!.v, guests: 24 } } });
    buildFormView(store, store.state.ops.form!).submit();
    expect(store.state.catering.at(-1)).toMatchObject({ name: 'Acme', quote: 726, status: 'enquiry' });
    await outbox.flush();
    expect(types()).toContain('catering.upsert');
  });

  it('issues a gift card through the gift card service', async () => {
    const { store } = await createTestStore();
    store.setOps({ form: { kind: 'gift', v: { amount: '5', customerId: '', note: '' } } });
    await buildFormView(store, store.state.ops.form!).submit();
    expect(store.state.ops.form!.err).toBe('Amount must be between $10 and $500.');
    store.setOps({ form: { kind: 'gift', v: { amount: '75', customerId: 'c1', note: '' } } });
    await buildFormView(store, store.state.ops.form!).submit();
    expect(store.state.giftcards[0]).toMatchObject({ issued: 75, balance: 75, customerId: 'c1' });
    expect(store.state.giftcards[0].code).toMatch(/^6011 2000 \d{4} \d{4}$/);
  });

  it('adds a team member who can then sign in, and refuses a PIN already in use', async () => {
    const { store } = await createTestStore();
    store.setOps({ form: { kind: 'staff', v: { name: 'Sam Lee', role: 'cashier', cafe: 'phillip', pin: '1111', shift: '' } } });
    await buildFormView(store, store.state.ops.form!).submit();
    expect(store.state.ops.form!.err).toBe('That PIN is already in use.');
    store.setOps({ form: { ...store.state.ops.form!, busy: false, v: { ...store.state.ops.form!.v, pin: '4321' } } });
    await buildFormView(store, store.state.ops.form!).submit();
    const sam = store.state.staff.find((x) => x.name === 'Sam Lee')!;
    expect(sam).toMatchObject({ initials: 'SL', role: 'cashier' });
    await expect(store.backend.staffAuth.verifyPin('4321')).resolves.toMatchObject({ staff: { id: sam.id } });
  });
});
