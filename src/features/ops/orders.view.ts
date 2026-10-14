import { dueC, fmtC, orderPayments, paidC, refundableC, refundedC } from '../../domain/ledger';
import { CHANNEL_LABEL, isIncoming, isLive, NEXT_STATUS, ORDER_TYPE_LABEL } from '../../domain/policies';
import { lineTotal } from '../../domain/pricing';
import type { Order } from '../../domain/types';
import { acceptOrder, advanceOrder, openOrderAct, printReceipt, statusLabel } from '../../state/actions/orders';
import type { PosStore } from '../../state/store';
import type { OpsUi } from '../../state/types';
import { fmtT, M, modsText, scope } from './common';

export function buildOrders(store: PosStore) {
  const s = store.state,
    o = s.ops,
    { inScope, cafeName, scopeName } = scope(store);
  const f = o.orderFilter || 'all',
    src = o.orderSrc || 'pos',
    srcName = CHANNEL_LABEL[src];
  const scoped = s.orders.filter((x) => inScope(x.cafe));
  const stMatch = (x: Order) => f === 'all' || (f === 'live' ? isLive(x) : x.status === f);
  const rows = scoped.filter((x) => x.channel === src && stMatch(x));
  const custById = Object.fromEntries(s.customers.map((c) => [c.id, c]));
  const fulfil = (x: Order): [string, string] =>
    isIncoming(x)
      ? ['Awaiting acceptance', '#8B5827']
      : (
          {
            new: ['New', '#8B5827'],
            preparing: ['Preparing', '#2C1A12'],
            ready: [x.type === 'delivery' ? 'Out for delivery' : 'Ready', '#2C1A12'],
            completed: ['Completed', '#8C7A6E'],
            refunded: ['Closed', '#8C7A6E'],
            cancelled: ['Cancelled', '#8C7A6E'],
            failed: ['Not started', '#9A4436'],
          } as Record<string, [string, string]>
        )[x.status] || [x.status, '#2C1A12'];
  const payState = (x: Order): [string, string] => {
    const paid = paidC(x),
      ref = refundedC(x);
    let l: string,
      c = '#3A2B24';
    if (x.status === 'failed') {
      l = 'Payment failed';
      c = '#9A4436';
    } else if (x.status === 'refunded') l = 'Refunded';
    else if (ref > 0) l = ref >= paid ? 'Refunded' : 'Part refunded';
    else if (x.status === 'cancelled') l = paid ? 'Paid' : 'Not charged';
    else if (!x.paid) {
      l = paid ? 'Part paid' : 'Unpaid';
      c = '#8B5827';
    } else l = 'Paid';
    if (x.queued) l += ' · queued';
    return [l, c];
  };
  const srcDefs: OpsUi['orderSrc'][] = ['pos', 'web', 'app'];
  const filterDefs: [string, string][] = [
    ['all', 'All'],
    ['live', 'Live'],
    ['completed', 'Completed'],
    ['refunded', 'Refunded'],
    ['cancelled', 'Cancelled'],
  ];
  const fName = (
    { all: '', live: 'live ', completed: 'completed ', refunded: 'refunded ', cancelled: 'cancelled ' } as Record<string, string>
  )[f];
  const sel = s.orders.find((x) => x.id === o.selOrder);
  let od = null;
  if (sel) {
    const c = sel.customerId ? custById[sel.customerId] : undefined;
    const next = NEXT_STATUS[sel.status];
    const ml: Record<string, string> = { cash: 'Cash', card: 'Card', wallet: 'Apple Pay', gift: 'Gift card' };
    const incoming = isIncoming(sel);
    const pays = orderPayments(sel);
    od = {
      id: sel.id,
      status: statusLabel(sel),
      meta: `${fmtT(sel.time)} · ${cafeName(sel.cafe)} · ${CHANNEL_LABEL[sel.channel]} · ${ORDER_TYPE_LABEL[sel.type]}${sel.table ? ' · ' + sel.table : ''}${sel.extRef ? ' · ref ' + sel.extRef : ''}`,
      customer: c ? c.name : '',
      customerHref: c ? '#customers/' + c.id : '#',
      lines: sel.lines.map((l) => ({ key: l.key, qty: l.qty, name: l.name, mods: modsText(l), totalS: M(lineTotal(l)) })),
      totalS: M(sel.total),
      payment: pays.length
        ? pays.map((p) => `${ml[p.method] || p.method} ${fmtC(p.amount)}`).join(' + ') + (dueC(sel) ? ` · ${fmtC(dueC(sel))} due` : '')
        : 'Unpaid',
      refundLine: refundedC(sel) ? `${fmtC(refundedC(sel))} refunded` : '',
      history: (sel.history || [])
        .slice()
        .reverse()
        .map((h, i) => ({ id: i, at: h.at, what: h.what })),
      hasHistory: !!(sel.history || []).length,
      incoming,
      accept: () => acceptOrder(store, sel.id),
      reject: () => openOrderAct(store, sel.id, 'cancel'),
      canAdvance: !!next && !incoming && sel.status !== 'failed',
      advanceLabel:
        (
          {
            preparing: 'Start preparing',
            ready: sel.type === 'delivery' ? 'Out for delivery' : 'Ready for pickup',
            completed: 'Complete order',
          } as Record<string, string>
        )[next || ''] || '',
      advance: () => advanceOrder(store, sel.id),
      canRefund: refundableC(sel) > 0 && sel.status !== 'cancelled',
      refund: () => openOrderAct(store, sel.id, 'refund'),
      canVoid: ['new', 'preparing', 'ready'].includes(sel.status) && !incoming,
      voidItems: () => openOrderAct(store, sel.id, 'void'),
      canCancel: ['new', 'failed'].includes(sel.status) && !incoming,
      cancel: () => openOrderAct(store, sel.id, 'cancel'),
      print: () => printReceipt(store, sel.id, !!sel.prints),
      close: () => store.setOps({ selOrder: null }),
    };
  }
  return {
    detailCol: sel ? '340px' : '0px',
    orderSources: srcDefs.map((id) => {
      const n = id === 'pos' ? 0 : scoped.filter((x) => x.channel === id && isLive(x)).length,
        on = src === id;
      return {
        id,
        name: CHANNEL_LABEL[id],
        on,
        hasCount: n > 0,
        count: n,
        countLabel: n + ' live ' + CHANNEL_LABEL[id].toLowerCase() + ' order' + (n === 1 ? '' : 's'),
        bg: on ? '#FFFCF7' : 'transparent',
        fg: on ? '#2C1A12' : '#8C7A6E',
        shadow: on ? '0 1px 3px rgba(44,26,18,.12)' : 'none',
        weight: on ? 600 : 500,
        pick: () => store.setOps({ orderSrc: id, orderFilter: 'all', selOrder: null }),
      };
    }),
    orderFilters: filterDefs.map(([id, name]) => ({
      id,
      name,
      on: f === id,
      fg: f === id ? '#2C1A12' : '#8C7A6E',
      border: f === id ? '#B67A4B' : 'transparent',
      weight: f === id ? 600 : 500,
      pick: () => store.setOps({ orderFilter: id, selOrder: null }),
    })),
    orderRows: rows.map((x) => {
      const c = x.customerId ? custById[x.customerId] : undefined,
        [fl, ff] = fulfil(x),
        [pl, pf] = payState(x);
      return {
        id: x.id,
        time: fmtT(x.time),
        who: c ? c.name : 'Walk-in',
        type: ORDER_TYPE_LABEL[x.type] + (x.table ? ' · ' + x.table : ''),
        cafeName: cafeName(x.cafe),
        items: x.lines.map((l) => (l.qty > 1 ? l.qty + '× ' : '') + l.name).join(', '),
        totalS: M(x.total),
        fulfil: fl,
        fulFg: ff,
        pay: pl,
        payFg: pf,
        bg: o.selOrder === x.id ? '#F7F2EA' : 'transparent',
        pick: () => store.setOps({ selOrder: x.id }),
      };
    }),
    noOrders: !rows.length,
    ordersEmpty: 'No ' + fName + srcName + ' orders' + (o.cafe === 'all' ? '' : ' at ' + scopeName) + '.',
    srcNote:
      src === 'pos'
        ? ''
        : store.config.devTools
          ? srcName +
            ' orders here come from the simulated ' +
            srcName.toLowerCase() +
            ' feed — no live ' +
            srcName.toLowerCase() +
            ' connection yet.'
          : '',
    od,
  };
}

export type OrdersView = ReturnType<typeof buildOrders>;
