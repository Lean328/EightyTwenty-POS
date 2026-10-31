import type { Order } from '../../domain/types';
import { fmtC } from '../../domain/ledger';
import { uid } from '../../lib/ids';
import { getStaffToken } from '../../services/http/staffSession';
import type { OutboxEntry } from '../../services/outbox';
import type { PosStore } from '../store';
import { printReceipt } from './orders';

function giftOrder(entry: OutboxEntry): string | undefined {
  const c = entry.command;
  if (c.type === 'payment.record' && c.payment.method === 'gift') return c.orderId;
  if (c.type === 'order.adjust' && c.adjustment.alloc.some((row) => row.method === 'gift')) return c.orderId;
  return undefined;
}

/** Both uncertain and definitively rejected gift requests must be reviewed before another tender. */
export function unresolvedGiftCommand(store: PosStore, orderId: string): OutboxEntry | undefined {
  if (store.backend.kind !== 'http') return undefined;
  return [...store.outbox.pending, ...store.outbox.rejected].find((entry) => giftOrder(entry) === orderId);
}

export async function checkCustomerGiftCard(store: PosStore): Promise<void> {
  const d = store.state.dlg;
  if (!d || d.kind !== 'pay' || d.status === 'processing' || d.giftChecking) return;
  const getBalance = store.backend.giftCards.getBalance;
  const customerId = d.forOrderId ? store.state.orders.find((order) => order.id === d.forOrderId)?.customerId : store.state.customerId;
  const token = getStaffToken(),
    staffId = store.state.staffId,
    cafe = store.state.cafe;
  const fail = (err: string) => store.setState({ dlg: { ...d, gift: null, giftChecking: false, err } });
  if (!store.state.online) return fail('Connect to the server to check a gift card.');
  if (!customerId) return fail('Select a customer on the cart before opening a gift card payment.');
  if (!getBalance || !token || !(store.can('gift.redeem') || store.can('gift')))
    return fail('Sign in with permission to redeem gift cards.');
  store.setState({ dlg: { ...d, gift: null, giftChecking: true, err: '' } });
  const current = () => {
    const cur = store.state.dlg;
    if (
      !cur ||
      cur.kind !== 'pay' ||
      cur.key !== d.key ||
      cur.method !== 'gift' ||
      !store.state.online ||
      getStaffToken() !== token ||
      store.state.staffId !== staffId ||
      store.state.cafe !== cafe
    )
      return null;
    const selected = cur.forOrderId ? store.state.orders.find((order) => order.id === cur.forOrderId)?.customerId : store.state.customerId;
    return selected === customerId ? cur : null;
  };
  try {
    const card = await getBalance(customerId, { staffToken: token });
    const cur = current();
    if (!cur) return;
    if (
      card.customerId !== customerId ||
      !card.id ||
      !/^\d{4}$/.test(card.last4) ||
      !Number.isSafeInteger(card.balance) ||
      card.balance < 0
    ) {
      store.setState({ dlg: { ...cur, giftChecking: false, gift: null, err: 'The server returned an invalid gift balance.' } });
      return;
    }
    store.setState({
      dlg: {
        ...cur,
        giftChecking: false,
        gift: { id: card.id, customerId, last4: card.last4, balance: card.balance / 100 },
        err: card.balance ? '' : 'This gift card has no balance.',
      },
    });
  } catch (error) {
    const cur = current();
    if (cur)
      store.setState({
        dlg: {
          ...cur,
          giftChecking: false,
          gift: null,
          err: error instanceof Error ? error.message : 'The gift card could not be checked.',
        },
      });
  } finally {
    const cur = store.state.dlg;
    if (cur?.kind === 'pay' && cur.key === d.key && cur.giftChecking) {
      store.setState({
        dlg: { ...cur, giftChecking: false, gift: null, err: 'The customer or staff session changed. Check the balance again.' },
      });
    }
  }
}

export function updateGiftPendingDialog(store: PosStore): void {
  const d = store.state.dlg;
  if (!d || !('forOrderId' in d || d.kind === 'ordact')) return;
  const id = d.kind === 'pay' ? d.forOrderId : d.kind === 'ordact' ? d.orderId : undefined;
  if (!id) return;
  const entry = unresolvedGiftCommand(store, id);
  if (!entry) return;
  const rejected = store.outbox.rejected.some((item) => item.id === entry.id);
  const message =
    rejected || entry.blockedBy
      ? `Gift request needs manager review in Sync. ${entry.lastError || 'A prerequisite was rejected.'}`
      : entry.attempts
        ? 'Gift request is awaiting server confirmation. Check Sync; do not take another payment.'
        : '';
  if (d.kind === 'pay') store.setState({ dlg: { ...d, status: rejected || entry.blockedBy ? 'failed' : 'processing', err: message } });
  if (d.kind === 'ordact') store.setState({ dlg: { ...d, processing: !rejected && !entry.blockedBy, err: message } });
}

/** Apply the server's payment/refund response, never a second gift balance adjustment. */
export function reconcileGiftResponse(store: PosStore, entry: OutboxEntry, response: unknown): void {
  if (store.backend.kind !== 'http' || !response || typeof response !== 'object') return;
  const c = entry.command;
  const order = response as Order;
  if (!order.id || !Array.isArray(order.payments) || !Array.isArray(order.lines)) return;
  if (c.type === 'order.create') {
    if (order.id !== c.order.id || !store.outbox.pending.some((e) => giftOrder(e) === order.id)) return;
    store.setState((state) => ({ orders: state.orders.some((o) => o.id === order.id) ? state.orders : [order, ...state.orders] }));
    return;
  }
  const isPayment = c.type === 'payment.record' && c.payment.method === 'gift';
  const isRefund = c.type === 'order.adjust' && c.adjustment.alloc.some((row) => row.method === 'gift');
  if ((!isPayment && !isRefund) || !('orderId' in c) || order.id !== c.orderId) return;
  const previous = store.state.orders.find((o) => o.id === order.id);
  const alreadyApplied =
    c.type === 'payment.record'
      ? previous?.payments?.some((p) => p.ref === c.payment.ref)
      : c.type === 'order.adjust' && previous?.refunds?.some((r) => r.key === c.adjustment.key);
  const dialog = store.state.dlg;
  store.setState((state) => ({
    orders: state.orders.some((o) => o.id === order.id)
      ? state.orders.map((o) => (o.id === order.id ? { ...o, ...order, queued: false } : o))
      : [order, ...state.orders],
  }));
  if (c.type === 'payment.record') {
    if (dialog?.kind === 'pay' && dialog.forOrderId === order.id && dialog.key === c.payment.ref) {
      store.setState({
        dlg: order.paid
          ? { kind: 'receipt', orderId: order.id, loyalty: '' }
          : {
              ...dialog,
              key: uid('P'),
              mode: 'full',
              status: 'idle',
              err: '',
              amount: '',
              tender: '',
              sel: {},
              gift: null,
              giftChecking: false,
              giftCode: '',
              count: (dialog.count || 0) + 1,
            },
      });
    }
    if (!alreadyApplied) {
      store.send({
        type: 'transaction.record',
        staffToken: c.staffToken,
        record: {
          kind: 'payment',
          orderId: order.id,
          cafeId: order.cafe,
          terminalId: store.config.terminalId,
          amountC: c.payment.amount,
          gstC: Math.round(c.payment.amount / 11),
          at: new Date().toISOString(),
          staff: c.payment.by || '',
          reference: c.payment.ref,
        },
      });
      if (order.paid && store.state.toggles.receipt) setTimeout(() => printReceipt(store, order.id, false), 0);
    }
    store.say(order.paid ? 'Gift payment confirmed' : `${fmtC(c.payment.amount)} paid by gift card. Pay the rest with another method.`);
  } else if (c.type === 'order.adjust') {
    if (dialog?.kind === 'ordact' && dialog.orderId === order.id && dialog.key === c.adjustment.key) store.setState({ dlg: null });
    if (!alreadyApplied) {
      const cashBack = c.adjustment.alloc.filter((a) => a.method === 'cash').reduce((n, a) => n + a.amount, 0);
      const shift = store.state.shift;
      if (cashBack && shift && shift.id === c.adjustment.shiftId)
        store.setState({ shift: { ...shift, cashRefunds: shift.cashRefunds + cashBack } });
      store.send({
        type: 'transaction.record',
        staffToken: c.staffToken,
        record: {
          kind: c.adjustment.mode,
          orderId: order.id,
          cafeId: order.cafe,
          terminalId: store.config.terminalId,
          amountC: -c.adjustment.amount,
          gstC: -Math.round(c.adjustment.amount / 11),
          at: new Date().toISOString(),
          staff: c.adjustment.by,
          reference: c.adjustment.key,
        },
      });
    }
    store.say('Gift refund confirmed — funds returned to the original card.');
  }
  store.flushPersistence();
}

const reviews = new WeakSet<OutboxEntry>();

/** A manager may resolve a definitively rejected request only after reading the actual server order. */
export async function reviewRejectedGiftRequest(store: PosStore, entryId: string): Promise<boolean> {
  const entry = store.outbox.rejected.find((item) => item.id === entryId);
  if (!entry || !giftOrder(entry) || reviews.has(entry) || !store.state.online) return false;
  const token = getStaffToken(),
    cafe = store.state.cafe,
    staffId = store.state.staffId;
  if (!token) return false;
  const orderId = giftOrder(entry)!;
  const hasPending = () => store.outbox.pending.some((item) => 'orderId' in item.command && item.command.orderId === orderId);
  if (hasPending()) {
    store.say('Related requests are still pending. Review them before resolving this gift request.');
    return false;
  }
  reviews.add(entry);
  let changed = false;
  const unsubscribe = store.outbox.subscribe(() => {
    changed = true;
  });
  try {
    // Manager PIN approval restores the cashier token after starting this approved read.
    const result = await store.backend.orders.listChanged(cafe, null, { staffToken: token });
    if (changed || !store.state.online || store.state.cafe !== cafe || store.state.staffId !== staffId || hasPending()) return false;
    const order = result.orders.find((item) => item.id === orderId);
    if (!order) {
      store.say('The order could not be verified. Check it in BOS; the rejected request is retained.');
      return false;
    }
    const c = entry.command;
    let captured = false;
    if (c.type === 'payment.record') {
      const saved = order.payments?.find((payment) => payment.ref === c.payment.ref);
      if (saved && (saved.method !== 'gift' || saved.amount !== c.payment.amount || saved.giftCardId !== c.payment.giftCardId)) {
        store.say('This payment reference has different server details. Review it in BOS.');
        return false;
      }
      captured = !!saved;
    } else if (c.type === 'order.adjust') {
      const saved = order.refunds?.find((refund) => refund.key === c.adjustment.key);
      if (
        saved &&
        (saved.mode !== c.adjustment.mode ||
          saved.amount !== c.adjustment.amount ||
          saved.alloc.length !== c.adjustment.alloc.length ||
          !saved.alloc.every((row) =>
            c.adjustment.alloc.some(
              (expected) => expected.ref === row.ref && expected.method === row.method && expected.amount === row.amount,
            ),
          ))
      ) {
        store.say('This refund reference has different server details. Review it in BOS.');
        return false;
      }
      captured = !!saved;
    }
    store.outbox.dismissRejected(entry.id);
    if (captured) reconcileGiftResponse(store, entry, order);
    else {
      store.setState((state) => ({ orders: state.orders.map((item) => (item.id === order.id ? { ...item, ...order } : item)) }));
      store.say('Server checked: the rejected gift request was not applied. Reopen payment or refund to continue.');
    }
    store.flushPersistence();
    return true;
  } catch {
    store.say('Could not verify the server order. The rejected gift request is retained.');
    return false;
  } finally {
    unsubscribe();
    reviews.delete(entry);
  }
}
