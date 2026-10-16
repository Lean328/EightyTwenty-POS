// Taking payment: building the order from the cart, recording tenders idempotently, card terminal round-trips.
import { fmtC, fromC, orderPayments, paidC, toC } from '../../domain/ledger';
import { addStamps, stampsFor } from '../../domain/loyalty';
import { totals, type Totals } from '../../domain/pricing';
import type { Customer, GiftCard, Order, OrderLine, Payment } from '../../domain/types';
import { nowHM, stamp, uid } from '../../lib/ids';
import type { PosStore } from '../store';
import type { PayDialog } from '../types';
import { kickDrawer, note, printDocket, printReceipt } from './orders';

export function cartTotals(store: PosStore, lines: OrderLine[] = store.state.lines, method: 'card' | null = null): Totals {
  const s = store.state;
  return totals(lines, { discount: s.discount, gift: s.gift ? s.gift.amount : 0, type: s.type, method });
}

const redeemGift = (cards: GiftCard[], last4: string, amountC: number, orderId: string): GiftCard[] =>
  cards.map((g) =>
    g.code.endsWith(last4)
      ? {
          ...g,
          balance: fromC(toC(g.balance) - amountC),
          history: [...g.history, { d: 'Today', what: `Redeemed · ${orderId}`, amt: -fromC(amountC) }],
        }
      : g,
  );

/** Turn the current cart into an open order (not yet sent anywhere). A gift card applied in Discounts is taken as the first payment. */
export function cartToOrder(store: PosStore): { o: Order; giftcards: GiftCard[] } {
  const s = store.state,
    t = cartTotals(store, s.lines, null),
    who = store.staff().name;
  const o: Order = {
    id: store.nextOrderNo(),
    channel: 'pos',
    type: s.type,
    status: 'new',
    accepted: true,
    cafe: s.cafe,
    time: nowHM(),
    placedAt: new Date().toISOString(),
    table: s.table || undefined,
    tables: s.table ? [s.table] : [],
    customerId: s.customerId || undefined,
    lines: s.lines,
    total: t.total,
    paid: false,
    methods: [],
    payments: [],
    note: s.note,
    discounts: s.discount ? [{ label: s.discount.label, amount: t.disc }] : [],
    rewardUsed: !!(s.discount && s.discount.kind === 'reward'),
    staff: who,
    queued: !s.online,
    history: [{ at: stamp(), what: `Created on till by ${who}` }],
  };
  let giftcards = s.giftcards;
  if (s.gift && t.gift > 0) {
    const amt = toC(t.gift);
    o.payments!.push({ method: 'gift', amount: amt, tip: 0, surcharge: 0, ref: uid('G'), giftLast4: s.gift.last4, at: stamp(), by: who });
    o.methods.push('gift');
    giftcards = redeemGift(giftcards, s.gift.last4, amt, o.id);
    const card = giftcards.find((g) => g.code.endsWith(s.gift!.last4));
    if (card) store.send({ type: 'giftcard.adjust', code: card.code, amount: -fromC(amt), reason: `Redeemed · ${o.id}` });
  }
  if (s.discount) store.logAudit('Discount applied', `${s.discount.label} on ${o.id}`, { amount: -toC(t.disc) });
  return { o, giftcards };
}

/** Award stamps once per order (and spend a reward if one was redeemed). Returns updated customers and a receipt message. */
export function awardLoyalty(store: PosStore, o: Order, customers: Customer[]): [Customer[], string] {
  if (!o.customerId || o.stamped) return [customers, ''];
  const c = customers.find((x) => x.id === o.customerId);
  if (!c) return [customers, ''];
  const per = store.state.loy.per;
  let n = stampsFor(o.lines, store.state.catalog.menuById),
    cc = c;
  if (o.rewardUsed) {
    cc = { ...cc, rewards: Math.max(0, cc.rewards - 1) };
    n = Math.max(0, n - 1);
  }
  if (n && store.state.toggles.autoStamp) cc = addStamps(cc, n, per);
  else n = 0;
  if (cc !== c) store.send({ type: 'loyalty.balance', customerId: c.id, stamps: cc.stamps, rewards: cc.rewards, reason: `Order ${o.id}` });
  const msg = n
    ? `${c.name.split(' ')[0]} earned ${n} stamp${n > 1 ? 's' : ''} · ${cc.rewards ? cc.rewards + ' free coffee ready' : per - cc.stamps + ' to go'}`
    : '';
  return [customers.map((x) => (x.id === c.id ? cc : x)), msg];
}

export type Tender = Omit<Payment, 'at' | 'by'>;

/**
 * Record one tender against the order in the payment dialog (creating the order from the cart first if needed).
 * Idempotent: the tender's ref is the dialog's key, so a double tap or a retried terminal response is ignored.
 */
export function takePayment(store: PosStore, tender: Tender): void {
  const s = store.state,
    d = s.dlg;
  if (!d || d.kind !== 'pay' || d.key !== tender.ref) return store.say('Payment already recorded');
  let orders = s.orders,
    giftcards = s.giftcards,
    id = d.forOrderId,
    patch = {},
    created: Order | null = null;
  if (id && (orders.find((o) => o.id === id)?.payments || []).some((p) => p.ref === tender.ref))
    return store.say('Payment already recorded');
  if (!id) {
    if (!s.lines.length) return;
    const r = cartToOrder(store);
    created = r.o;
    id = r.o.id;
    giftcards = r.giftcards;
    orders = [r.o, ...orders];
    patch = { lines: [], discount: null, gift: null, note: '', table: '', customerId: null, cartOpen: false };
    store.send({ type: 'order.create', order: r.o });
  }
  const orderId = id;
  const pay: Payment = { ...tender, at: stamp(), by: store.staff().name };
  if (tender.method === 'gift' && tender.giftLast4) {
    giftcards = redeemGift(giftcards, tender.giftLast4, tender.amount, orderId);
    const card = giftcards.find((g) => g.code.endsWith(tender.giftLast4!));
    if (card) store.send({ type: 'giftcard.adjust', code: card.code, amount: -fromC(tender.amount), reason: `Redeemed · ${orderId}` });
  }
  let shift = s.shift;
  if (tender.method === 'cash' && shift)
    shift = { ...shift, cashSales: shift.cashSales + (tender.cashPaid != null ? tender.cashPaid : tender.amount) };
  orders = orders.map((o) =>
    o.id === orderId
      ? {
          ...o,
          payments: [...orderPayments(o), pay],
          methods: [...new Set([...(o.methods || []), tender.method])],
          history: note(o, `${fmtC(tender.amount)} ${tender.method}${tender.tip ? ' + ' + fmtC(tender.tip) + ' tip' : ''} · ${pay.by}`),
        }
      : o,
  );
  const o = orders.find((x) => x.id === orderId)!;
  const done = paidC(o) >= toC(o.total);
  let customers = s.customers,
    loyalty = '';
  if (done) {
    [customers, loyalty] = awardLoyalty(store, o, customers);
    orders = orders.map((x) => (x.id === orderId ? { ...x, paid: true, stamped: true } : x));
  }
  store.send({ type: 'payment.record', orderId, payment: pay }, s.online ? undefined : `${orderId} · cash ${fmtC(tender.amount)}`);
  store.send({
    type: 'transaction.record',
    record: {
      kind: 'payment',
      orderId,
      cafeId: o.cafe,
      terminalId: store.config.terminalId,
      amountC: tender.amount + (tender.tip || 0) + (tender.surcharge || 0),
      gstC: Math.round((tender.amount + (tender.surcharge || 0)) / 11),
      at: new Date().toISOString(),
      staff: pay.by || '',
      reference: tender.ref,
    },
  });
  const next: PayDialog = {
    ...d,
    forOrderId: orderId,
    key: uid('P'),
    status: 'idle',
    err: '',
    tender: '',
    amount: '',
    sel: {},
    giftCode: '',
    gift: null,
    count: (d.count || 0) + 1,
  };
  store.setState({ ...patch, orders, giftcards, shift, customers, dlg: done ? { kind: 'receipt', orderId, loyalty } : next });
  if (tender.method === 'cash' && store.state.toggles.openDrawer) kickDrawer(store);
  if (created) setTimeout(() => printDocket(store, orderId), 0);
  if (done && store.state.toggles.receipt) setTimeout(() => printReceipt(store, orderId, false), 0);
}

/** Card / wallet through the terminal. Guarded so a second tap while processing does nothing. */
export async function chargeCard(store: PosStore, tender: Tender): Promise<void> {
  const d = store.state.dlg;
  if (!d || d.kind !== 'pay' || d.status === 'processing') return;
  store.setState({ dlg: { ...d, status: 'processing', err: '' } });
  const fail = (err: string, extra: Partial<PayDialog> = {}) => {
    const cur = store.state.dlg;
    if (cur && cur.kind === 'pay' && cur.key === d.key) store.setState({ dlg: { ...cur, status: 'failed', err, ...extra } });
  };
  let result;
  try {
    result = await store.devices.chargeCard(
      {
        method: tender.method === 'wallet' ? 'wallet' : 'card',
        amountC: tender.amount,
        tipC: tender.tip,
        surchargeC: tender.surcharge,
        reference: tender.ref,
      },
      store.state.devices,
    );
  } catch {
    return fail('The card terminal did not respond — no charge was confirmed. Check the terminal before retrying.');
  }
  const s = store.state;
  const cur = s.dlg;
  if (!cur || cur.kind !== 'pay' || cur.key !== d.key) return;
  if (!s.online) return fail('Connection lost before approval — no charge was made. Take cash or retry when back online.');
  if (result.status !== 'approved') return fail(result.message);
  if (store.devices.simulated && cur.declineNext)
    return fail('Card declined by issuer — no charge was made. Ask for another card or method.', { declineNext: false });
  takePayment(store, tender);
}
