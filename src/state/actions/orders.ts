// Order lifecycle: kitchen flow, accepting online orders, refunds / voids / cancellations, dockets and receipts.
import { allocateRefund, fmtC, fromC, lineShareC, paidC, refundableC, refundedC, toC } from '../../domain/ledger';
import { isEligible, stampsFor } from '../../domain/loyalty';
import { NEXT_STATUS } from '../../domain/policies';
import type { HistoryEntry, Order, OrderActionMode, OrderAdjustment, StaffMember } from '../../domain/types';
import { stamp, uid } from '../../lib/ids';
import type { PosStore } from '../store';

export const note = (o: Order, what: string): HistoryEntry[] => [...(o.history || []), { at: stamp(), what }];

export function setOrder(store: PosStore, id: string, fn: (o: Order) => Order): void {
  store.setState((s) => ({ orders: s.orders.map((o) => (o.id === id ? fn(o) : o)) }));
}

/** Status line shown on order rows, e.g. "preparing · unpaid · queued". */
export function statusLabel(o: Order): string {
  if (o.status === 'new' && o.accepted === false) return 'awaiting acceptance';
  let l: string = o.status;
  if (!o.paid && !['cancelled', 'refunded', 'failed'].includes(o.status)) l += paidC(o) ? ' · part paid' : ' · unpaid';
  if ((o.refunds || []).some((r) => r.mode === 'refund') && o.status !== 'refunded') l += ' · part refunded';
  if (o.queued) l += ' · queued';
  return l;
}

export function advanceOrder(store: PosStore, id: string): void {
  const o = store.state.orders.find((x) => x.id === id);
  if (!o) return;
  const next = NEXT_STATUS[o.status];
  if (!next) return;
  const label = { preparing: 'Preparing', ready: o.type === 'delivery' ? 'Out for delivery' : 'Ready for pickup', completed: 'Completed' }[
    next as 'preparing' | 'ready' | 'completed'
  ];
  const what = `${label}${o.channel !== 'pos' ? ' · customer notified via ' + (o.channel === 'app' ? 'app' : 'email') : ''}`;
  setOrder(store, id, (x) => ({ ...x, status: next, accepted: true, history: note(x, what) }));
  store.send({ type: 'order.status', orderId: id, status: next, note: what });
}

export function acceptOrder(store: PosStore, id: string): void {
  setOrder(store, id, (x) => ({
    ...x,
    accepted: true,
    status: 'preparing',
    history: note(x, `Accepted by ${store.staff().name} · customer notified`),
  }));
  store.send({ type: 'order.accept', orderId: id });
  printDocket(store, id);
  store.logAudit('Online order accepted', id);
}

export function openOrderAct(store: PosStore, id: string, mode: OrderActionMode): void {
  store.setState({ dlg: { kind: 'ordact', orderId: id, mode, sel: {}, by: 'items', amount: '', reason: '', key: uid('R') } });
}

export interface OrderActionRequest {
  mode: OrderActionMode;
  sel: Record<string, number>;
  amountC: number;
  reason: string;
  key: string;
}

/** Apply a cancellation, void or refund. Idempotent on act.key. */
export function applyOrderAction(store: PosStore, id: string, act: OrderActionRequest, approver: StaffMember | null): void {
  const s = store.state,
    o = s.orders.find((x) => x.id === id);
  if (!o) return;
  if ((o.refunds || []).some((r) => r.key === act.key)) return store.say('Already processed');
  const { menuById } = s.catalog;
  let lines = o.lines,
    total = o.total,
    status = o.status,
    refundC = 0;
  const units = act.sel || {};
  if (act.mode === 'cancel') {
    status = 'cancelled';
    refundC = refundableC(o);
  }
  if (act.mode === 'void') {
    const valueC = Object.entries(units).reduce((n, [k, q]) => n + lineShareC(o, k, q), 0);
    lines = o.lines.map((l) => ({ ...l, qty: l.qty - (units[l.key] || 0) })).filter((l) => l.qty > 0);
    total = fromC(toC(o.total) - valueC);
    refundC = Math.max(0, paidC(o) - refundedC(o) - toC(total));
    if (!lines.length) status = 'cancelled';
  }
  if (act.mode === 'refund') refundC = Math.min(act.amountC, refundableC(o));
  const alloc = refundC ? allocateRefund(o, refundC) : [];
  let giftcards = s.giftcards,
    shift = s.shift,
    customers = s.customers;
  alloc
    .filter((a) => a.method === 'gift')
    .forEach((a) => {
      giftcards = giftcards.map((g) =>
        g.code.endsWith(a.giftLast4 || '')
          ? {
              ...g,
              balance: fromC(toC(g.balance) + a.amount),
              history: [...g.history, { d: 'Today', what: `Refund restored · ${id}`, amt: fromC(a.amount) }],
            }
          : g,
      );
      const card = giftcards.find((g) => g.code.endsWith(a.giftLast4 || ''));
      if (card) store.send({ type: 'giftcard.adjust', code: card.code, amount: fromC(a.amount), reason: `Refund restored · ${id}` });
    });
  const cashBack = alloc.filter((a) => a.method === 'cash').reduce((n, a) => n + a.amount, 0);
  if (cashBack && shift) shift = { ...shift, cashRefunds: shift.cashRefunds + cashBack };
  // Reverse stamps for coffee units given back.
  const coffeeUnits =
    act.mode === 'cancel'
      ? stampsFor(o.lines, menuById)
      : Object.entries(units).reduce((n, [k, q]) => {
          const l = o.lines.find((x) => x.key === k);
          return n + (l && isEligible(menuById[l.itemId]) ? q : 0);
        }, 0);
  if (o.customerId && o.stamped && coffeeUnits && !o.serverLoyalty) {
    customers = customers.map((c) => (c.id === o.customerId ? { ...c, stamps: Math.max(0, c.stamps - coffeeUnits) } : c));
    const c = customers.find((x) => x.id === o.customerId);
    if (c) store.send({ type: 'loyalty.balance', customerId: c.id, stamps: c.stamps, rewards: c.rewards, reason: `${act.mode} · ${id}` });
  }
  const rec: OrderAdjustment = {
    ...(s.shift ? { shiftId: s.shift.id } : {}),
    key: act.key,
    mode: act.mode,
    amount: refundC,
    alloc,
    reason: act.reason,
    by: store.staff().name,
    approver: approver ? approver.name : '',
    at: stamp(),
    items: units,
  };
  const after = refundedC(o) + refundC;
  if (act.mode === 'refund' && after >= paidC(o)) status = 'refunded';
  const label = { cancel: 'Order cancelled', void: 'Items voided', refund: after >= paidC(o) ? 'Order refunded' : 'Partial refund' }[
    act.mode
  ];
  const methods = alloc.map((a) => `${fmtC(a.amount)} to ${a.method === 'gift' ? 'gift card ···' + a.giftLast4 : a.method}`).join(', ');
  const o2: Order = {
    ...o,
    lines,
    total,
    status,
    refunds: [...(o.refunds || []), rec],
    history: note(
      o,
      `${label} · ${act.reason}${refundC ? ' · ' + methods : ''} · ${rec.by}${rec.approver ? ' (approved ' + rec.approver + ')' : ''}`,
    ),
  };
  store.setState({ orders: s.orders.map((x) => (x.id === id ? o2 : x)), giftcards, shift, customers, dlg: null });
  store.send({ type: 'order.adjust', orderId: id, adjustment: rec, lines, total, status });
  if (refundC)
    store.send({
      type: 'transaction.record',
      record: {
        kind: act.mode,
        orderId: id,
        cafeId: o.cafe,
        terminalId: store.config.terminalId,
        amountC: -refundC,
        gstC: -Math.round(refundC / 11),
        at: new Date().toISOString(),
        staff: rec.by,
        reference: act.key,
      },
    });
  store.logAudit(label, `${id}${refundC ? ' · ' + methods : ''}`, {
    amount: refundC ? -refundC : null,
    reason: act.reason,
    approver: rec.approver,
  });
  store.say(`${label}${refundC ? ' · ' + fmtC(refundC) + ' returned' : ''}`);
  if (cashBack && store.state.toggles.openDrawer) kickDrawer(store);
}

// ---------- printing & drawer ----------

export function printDocket(store: PosStore, id: string): void {
  if (!store.state.toggles.kitchen) return;
  const o = store.state.orders.find((x) => x.id === id);
  if (!o) return;
  const ok = store.devices.printKitchenDocket(o, store.state.devices);
  setOrder(store, id, (x) => ({ ...x, docket: ok ? 'printed' : 'failed', docketTries: (x.docketTries || 0) + 1 }));
  if (!ok) store.say(`Kitchen docket for ${id} failed — ticket is still on the kitchen screen`);
}

export function printReceipt(store: PosStore, id: string, reprint: boolean): boolean {
  const o = store.state.orders.find((x) => x.id === id);
  if (!o) return false;
  const ok = store.devices.printReceipt(o, store.state.devices);
  if (ok) setOrder(store, id, (x) => ({ ...x, prints: (x.prints || 0) + 1 }));
  const dlg = store.state.dlg;
  if (dlg && dlg.kind === 'receipt') store.setState({ dlg: { ...dlg, printState: ok ? (reprint ? 'reprinted' : 'printed') : 'failed' } });
  if (ok && reprint) store.logAudit('Receipt reprinted', id);
  const sim = store.devices.simulated ? ' (simulated printer)' : '';
  store.say(
    ok
      ? `${reprint ? 'Reprinted' : 'Printed'} receipt ${id}${sim}`
      : store.devices.simulated
        ? 'Receipt printer offline — nothing printed. Retry when it is back.'
        : 'No receipt printer is connected — nothing printed.',
  );
  return ok;
}

export function kickDrawer(store: PosStore): boolean {
  if (!store.devices.openDrawer(store.state.devices)) {
    store.say(
      store.devices.simulated
        ? 'Cash drawer not responding (simulated) — open it manually'
        : 'No cash drawer is connected — open it manually',
    );
    return false;
  }
  return true;
}
