// View-models for the money dialogs: payment, receipt, shift & cash, order corrections, table, sync.
// All money maths in integer cents.
import type { ChangeEvent } from 'react';
import { fmtHM, iso } from '../../domain/hours';
import {
  allocateRefund,
  cash5,
  dueC,
  fmtC,
  lineShareC,
  orderPayments,
  paidC,
  refundableC,
  refundedC,
  sharesC,
  shiftExpectedC,
  surchargeC,
  toC,
  VARIANCE_LIMIT_C,
} from '../../domain/ledger';
import {
  CANCEL_REASONS,
  CASH_IN_REASONS,
  CASH_OUT_REASONS,
  ORDER_TYPE_LABEL,
  REFUND_REASONS,
  tablesOf,
  VOID_REASONS,
} from '../../domain/policies';
import type { Order, PaymentSplitMode } from '../../domain/types';
import { uid } from '../../lib/ids';
import { closeDialog } from '../../state/actions/auth';
import { applyOrderAction, kickDrawer, openOrderAct, printReceipt } from '../../state/actions/orders';
import { cartTotals, chargeCard, takePayment, type Tender } from '../../state/actions/payments';
import { cashMove, closeShift, openShift } from '../../state/actions/shifts';
import { resolveConflict, runSync, setOnline } from '../../state/actions/sync';
import { clearTable, joinTable, moveTable, occupancy, seatReservation, separateTable } from '../../state/actions/tables';
import type { PosStore } from '../../state/store';
import type { DialogOf } from '../../state/types';
import { devSim } from '../devSim';
import { dlgSet } from './till-dialogs.view';

const on = (x: boolean) =>
  x ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: '#F7F2EA', fg: '#3A2B24', border: 'rgba(44,26,18,.12)' };
const seg = (x: boolean) => (x ? { bg: '#FFFCF7', fg: '#2C1A12' } : { bg: 'transparent', fg: '#8C7A6E' });
const methodName: Record<string, string> = { cash: 'Cash', card: 'Card', wallet: 'Apple Pay', gift: 'Gift card', reward: 'Reward' };
type Input = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export function buildPayDialog(store: PosStore, d: DialogOf<'pay'>) {
  const s = store.state,
    set = (p: Partial<typeof d>) => dlgSet(store, 'pay', p);
  const forO = d.forOrderId ? s.orders.find((o) => o.id === d.forOrderId) : undefined;
  const ct = cartTotals(store, s.lines, null);
  const pseudo: Pick<Order, 'lines' | 'total'> = forO || { lines: s.lines, total: ct.total };
  const totalC = toC(pseudo.total);
  const preGiftC = forO ? 0 : toC(ct.gift);
  const paidSoFar = forO ? paidC(forO) : preGiftC;
  const remaining = Math.max(0, totalC - paidSoFar);
  const mode = d.mode || 'full',
    n = d.n || 2,
    count = d.count || 0;
  const paidUnits: Record<string, number> = {};
  (forO ? orderPayments(forO) : []).forEach((p) =>
    Object.entries(p.items || {}).forEach(([k, q]) => {
      paidUnits[k] = (paidUnits[k] || 0) + q;
    }),
  );
  const sel = d.sel || {};
  let amount = remaining;
  if (mode === 'equal') {
    const sh = sharesC(totalC, n);
    amount = count >= n - 1 ? remaining : Math.min(remaining, sh[count]);
  }
  if (mode === 'items')
    amount = Math.min(
      remaining,
      Object.entries(sel).reduce((a, [k, q]) => a + lineShareC(pseudo, k, q), 0),
    );
  if (mode === 'amount') amount = Math.min(remaining, toC(d.amount));
  const method = d.method || 'card',
    cardLike = method === 'card' || method === 'wallet';
  const tipsOn = s.toggles.tips && cardLike;
  const tipC = tipsOn ? Math.round((amount * (d.tip || 0)) / 100) : 0;
  const surcharge = cardLike ? surchargeC(amount + tipC) : 0;
  const cashDue = cash5(amount);
  const tenderC = toC(d.tender);
  const gift = d.gift;
  const giftAmt = gift ? Math.min(toC(gift.balance), amount) : 0;
  const offline = !s.online,
    noShift = !s.shift;
  const processing = d.status === 'processing',
    failed = d.status === 'failed';
  const methodDefs: [typeof method, string, string][] = [
    ['cash', 'Cash', noShift ? 'open a shift first' : 'rounded to 5c'],
    ['card', 'Card', offline ? 'paused offline' : '+2.95%'],
    ['wallet', 'Apple Pay', offline ? 'paused offline' : '+2.95%'],
    ['gift', 'Gift card', offline ? 'paused offline' : 'any balance'],
  ];
  const methods = methodDefs.map(([id, name, sub]) => {
    const dis = processing || (offline && id !== 'cash');
    return {
      id,
      name,
      sub,
      on: method === id,
      disabled: dis,
      opacity: dis ? 0.45 : 1,
      ...on(method === id),
      pick: () => set({ method: id, err: '', status: 'idle' }),
    };
  });
  const ledger = [
    ...(preGiftC && s.gift
      ? [{ id: 'pg', label: `Gift card ···${s.gift.last4}`, amtS: fmtC(preGiftC), sub: 'applied from discounts' }]
      : []),
    ...(forO
      ? orderPayments(forO).map((p, i) => ({
          id: p.ref || String(i),
          label: `${methodName[p.method] || p.method}${p.giftLast4 ? ' ···' + p.giftLast4 : ''}`,
          amtS: fmtC(p.amount),
          sub: [
            p.tip ? 'tip ' + fmtC(p.tip) : '',
            p.surcharge ? 'surcharge ' + fmtC(p.surcharge) : '',
            p.rounding ? 'rounding ' + fmtC(p.rounding) : '',
            p.by || '',
          ]
            .filter(Boolean)
            .join(' · '),
        }))
      : []),
  ];
  const itemRows = pseudo.lines.map((l) => {
    const left = l.qty - (paidUnits[l.key] || 0),
      q = sel[l.key] || 0;
    return {
      key: l.key,
      name: l.name,
      left,
      q,
      leftS: left ? `${left} left` : 'paid',
      valS: fmtC(lineShareC(pseudo, l.key, 1)),
      dim: left ? 1 : 0.45,
      inc: () => {
        if (q < left) set({ sel: { ...sel, [l.key]: q + 1 } });
      },
      dec: () => {
        if (q > 0) set({ sel: { ...sel, [l.key]: q - 1 } });
      },
    };
  });
  const quick = [
    cashDue,
    Math.ceil(cashDue / 500) * 500,
    Math.ceil(cashDue / 1000) * 1000,
    Math.ceil(cashDue / 2000) * 2000,
    Math.ceil(cashDue / 5000) * 5000,
  ]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .slice(0, 4);
  const charge = method === 'cash' ? cashDue : method === 'gift' ? giftAmt : amount + tipC + surcharge;
  const confirm = () => {
    if (processing) return;
    const live = store.state;
    if (!forO && !live.lines.length) return set({ err: 'Nothing to pay for yet.' });
    if (!forO) {
      const sold = new Set(live.soldOut || []);
      const bad = live.lines.find((l) => sold.has(l.itemId));
      if (bad) return set({ err: `${bad.name} is sold out — remove it before taking payment.` });
    }
    // Nothing left to take (100% comp, a free-coffee reward, or a gift card that covers the bill): close the order.
    if (remaining === 0) {
      const coveredByGift = preGiftC > 0 || (forO ? orderPayments(forO).some((p) => p.method === 'gift') : false);
      const rewardUsed = forO ? forO.rewardUsed : live.discount?.kind === 'reward';
      return takePayment(store, {
        method: coveredByGift ? 'gift' : rewardUsed ? 'reward' : method,
        amount: 0,
        tip: 0,
        surcharge: 0,
        ref: d.key,
        mode: 'full',
      });
    }
    if (amount <= 0) return set({ err: mode === 'items' ? 'Choose the items this guest is paying for.' : 'Enter an amount to take.' });
    const tender: Tender = { method, amount, tip: 0, surcharge: 0, ref: d.key, mode, items: mode === 'items' ? sel : undefined };
    if (method === 'cash') {
      if (noShift) return set({ err: 'Open a cash shift before taking cash.' });
      if (tenderC < cashDue) return set({ err: `Tendered ${fmtC(tenderC)} is less than ${fmtC(cashDue)}.` });
      return takePayment(store, { ...tender, cashPaid: cashDue, rounding: cashDue - amount, change: tenderC - cashDue });
    }
    if (method === 'gift') {
      if (!gift) return set({ err: 'Check a gift card first.' });
      if (giftAmt <= 0) return set({ err: 'This gift card has no balance.' });
      return takePayment(store, { ...tender, amount: giftAmt, giftLast4: gift.last4 });
    }
    void chargeCard(store, { ...tender, tip: tipC, surcharge });
  };
  const modeDefs: [PaymentSplitMode, string][] = [
    ['full', 'Pay in full'],
    ['equal', 'Equal shares'],
    ['items', 'By item'],
    ['amount', 'By amount'],
  ];
  const sim = store.devices.simulated;
  return {
    close: () => closeDialog(store),
    title: forO ? `Payment · ${forO.id}` : 'Payment',
    totalS: fmtC(totalC),
    remainingS: fmtC(remaining),
    paidS: fmtC(paidSoFar),
    hasPaid: paidSoFar > 0,
    ledger,
    gstS: fmtC(Math.round(totalC / 11)),
    modes: modeDefs.map(([id, name]) => ({
      id,
      name,
      on: mode === id,
      ...seg(mode === id),
      pick: () => set({ mode: id, sel: {}, err: '' }),
    })),
    isEqual: mode === 'equal',
    isItems: mode === 'items',
    isAmount: mode === 'amount',
    shareLabel: mode === 'equal' ? `Share ${Math.min(count + 1, n)} of ${n}` : '',
    nOpts: [2, 3, 4, 5, 6].map((k) => ({ k, on: n === k, ...seg(n === k), pick: () => set({ n: k }) })),
    itemRows,
    amountStr: d.amount || '',
    setAmount: (e: Input) => set({ amount: e.target.value, err: '' }),
    thisS: fmtC(amount),
    methods,
    isCash: method === 'cash',
    isCard: cardLike,
    isGift: method === 'gift',
    noShift,
    shiftOk: !noShift,
    openShift: () => store.setState({ dlg: { kind: 'shift', back: d } }),
    cashDueS: fmtC(cashDue),
    roundingS: cashDue !== amount ? `Cash rounding ${fmtC(cashDue - amount)}` : '',
    tender: d.tender || '',
    setTender: (e: Input) => set({ tender: e.target.value, err: '' }),
    quick: quick.map((v) => ({ v, label: fmtC(v), pick: () => set({ tender: (v / 100).toFixed(2), err: '' }) })),
    changeS: fmtC(Math.max(0, tenderC - cashDue)),
    tipsOn,
    tips: [0, 5, 10, 15].map((p) => ({
      p,
      label: p ? p + '%' : 'No tip',
      on: (d.tip || 0) === p,
      ...seg((d.tip || 0) === p),
      pick: () => set({ tip: p }),
    })),
    tipS: fmtC(tipC),
    surchargeS: fmtC(surcharge),
    giftCode: d.giftCode || '',
    setGiftCode: (e: Input) => set({ giftCode: e.target.value, err: '' }),
    checkGift: () => {
      const code = (d.giftCode || '').replace(/\s/g, '');
      const g = code.length >= 4 && s.giftcards.find((x) => x.code.replace(/\s/g, '').endsWith(code));
      if (!g) return set({ err: 'Gift card not found.', gift: null });
      set({ gift: { last4: g.code.slice(-4), balance: g.balance }, err: '' });
    },
    giftLine: gift
      ? `···${gift.last4} · balance ${fmtC(toC(gift.balance))} · uses ${fmtC(giftAmt)}${toC(gift.balance) < amount ? ' · pay the rest with another method' : ''}`
      : '',
    chargeS: fmtC(charge),
    processing,
    failed,
    err: d.err || '',
    offline,
    confirmLabel: processing
      ? `Waiting for terminal…${sim ? ' (simulated)' : ''}`
      : failed
        ? `Retry ${fmtC(charge)}`
        : method === 'cash'
          ? `Take cash ${fmtC(cashDue)}`
          : `Charge ${fmtC(charge)}`,
    confirmBg: processing ? '#9A8B80' : '#B67A4B',
    confirm,
    /** Development simulator only. */
    canSimulateDecline: sim,
    declineNext: () => set({ declineNext: true, err: 'Simulation: the next card attempt will be declined.' }),
    closeNote:
      paidSoFar > 0 && remaining > 0
        ? `${fmtC(paidSoFar)} taken so far — closing keeps the order open with ${fmtC(remaining)} still due.`
        : '',
  };
}

export function buildReceiptDialog(store: PosStore, d: DialogOf<'receipt'>) {
  const o = store.state.orders.find((x) => x.id === d.orderId);
  if (!o) return null;
  const pays = orderPayments(o);
  const change = pays.reduce((n, p) => n + (p.change || 0), 0);
  return {
    close: () => closeDialog(store),
    totalS: fmtC(toC(o.total)),
    meta: `${o.id} · ${ORDER_TYPE_LABEL[o.type]}${tablesOf(o).length ? ' · ' + tablesOf(o).join('+') : ''} · GST incl. ${fmtC(Math.round(toC(o.total) / 11))}`,
    loyalty: d.loyalty,
    changeS: change ? `Change ${fmtC(change)}` : '',
    lines: o.lines.map((l) => ({ key: l.key, qty: l.qty, name: l.name, totalS: fmtC(toC(l.price) * l.qty) })),
    pays: pays.map((p, i) => ({
      id: p.ref || String(i),
      label: `${methodName[p.method] || p.method}${p.giftLast4 ? ' ···' + p.giftLast4 : ''}`,
      amtS: fmtC(p.amount + (p.tip || 0) + (p.surcharge || 0)),
      sub: [
        p.tip ? 'incl. tip ' + fmtC(p.tip) : '',
        p.surcharge ? 'surcharge ' + fmtC(p.surcharge) : '',
        p.rounding ? 'rounding ' + fmtC(p.rounding) : '',
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    printState:
      d.printState === 'failed'
        ? 'Printer offline — nothing printed.'
        : d.printState === 'printed'
          ? 'Receipt printed.'
          : d.printState === 'reprinted'
            ? 'Reprinted.'
            : '',
    printFg: d.printState === 'failed' ? '#9A4436' : '#3E6B47',
    printLabel: d.printState === 'failed' ? 'Retry print' : o.prints ? 'Reprint receipt' : 'Print receipt',
    print: () => printReceipt(store, o.id, !!o.prints),
  };
}

export function buildShiftDialog(store: PosStore, d: DialogOf<'shift'>) {
  const s = store.state,
    set = (p: Partial<typeof d>) => dlgSet(store, 'shift', p),
    cafe = store.location(s.cafe)?.name;
  const base = { close: () => closeDialog(store), isSummary: false as const, isOpen: false as const, isManage: false as const };
  if (d.summary) {
    const sh = (s.shifts || []).find((x) => x.id === d.summary);
    if (!sh) return null;
    const rows: [string, string][] = [
      ['Opened', `${sh.openedAt} · ${sh.staffName}`],
      ['Closed', `${sh.closedAt} · ${sh.closedBy}`],
      ['Expected in drawer', fmtC(sh.expected)],
      ['Counted', fmtC(sh.counted)],
      ['Variance', fmtC(sh.variance)],
      ...(sh.approvedBy ? ([['Approved by', sh.approvedBy]] as [string, string][]) : []),
    ];
    return {
      ...base,
      isSummary: true as const,
      title: 'Shift closed',
      rows: rows.map(([k, v]) => ({ k, v })),
      varFg: Math.abs(sh.variance) > VARIANCE_LIMIT_C ? '#9A4436' : '#3E6B47',
    };
  }
  if (!s.shift) {
    const f = d.float == null ? '200' : d.float;
    return {
      ...base,
      isOpen: true as const,
      title: `Open shift · ${cafe}`,
      float: f,
      setFloat: (e: Input) => set({ float: e.target.value, err: '' }),
      presets: [100, 200, 300].map((v) => ({ v, label: '$' + v, on: +f === v, ...on(+f === v), pick: () => set({ float: String(v) }) })),
      err: d.err || '',
      open: () => {
        const c = toC(f);
        if (c < 0 || isNaN(c) || f.trim() === '') return set({ err: 'Enter the opening float.' });
        openShift(store, c);
        if (d.back) setTimeout(() => store.setState({ dlg: { ...d.back!, err: '' } }), 0);
      },
    };
  }
  const sh = s.shift,
    exp = shiftExpectedC(sh),
    mode = d.mode || '';
  const sum = (t: 'in' | 'out') => sh.moves.filter((m) => m.type === t).reduce((n, m) => n + m.amount, 0);
  const counted = toC(d.counted),
    variance = counted - exp,
    big = Math.abs(variance) > VARIANCE_LIMIT_C;
  const reasons = mode === 'in' ? CASH_IN_REASONS : CASH_OUT_REASONS;
  const rows: [string, number][] = [
    ['Opening float', sh.float],
    ['Cash sales', sh.cashSales],
    ['Cash refunds', -sh.cashRefunds],
    ['Cash in', sum('in')],
    ['Cash out', -sum('out')],
  ];
  return {
    ...base,
    isManage: true as const,
    title: `Shift · ${cafe}`,
    meta: `Opened ${sh.openedAt} by ${sh.staffName}`,
    rows: rows.map(([k, v]) => ({ k, v: fmtC(v) })),
    expectedS: fmtC(exp),
    moves: sh.moves
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        label: `${m.type === 'in' ? 'Cash in' : 'Cash out'} · ${m.reason}`,
        sub: `${m.at} · ${m.by}${m.approver ? ' · approved ' + m.approver : ''}`,
        amtS: (m.type === 'in' ? '+' : '−') + fmtC(m.amount),
      })),
    hasMoves: sh.moves.length > 0,
    isIdle: !mode,
    isMove: mode === 'in' || mode === 'out',
    isClose: mode === 'close',
    moveTitle: mode === 'in' ? 'Cash in' : 'Cash out',
    amt: d.amt || '',
    setAmt: (e: Input) => set({ amt: e.target.value, err: '' }),
    reasons: reasons.map((r) => ({ r, label: r, on: d.reason === r, ...on(d.reason === r), pick: () => set({ reason: r }) })),
    counted: d.counted || '',
    setCounted: (e: Input) => set({ counted: e.target.value, err: '' }),
    varianceS: d.counted ? fmtC(variance) : '—',
    varFg: !d.counted ? '#8C7A6E' : big ? '#9A4436' : '#3E6B47',
    bigNote: d.counted && big ? 'Variance over $5 needs manager approval to close.' : '',
    noteText: d.note || '',
    setNote: (e: Input) => set({ note: e.target.value }),
    err: d.err || '',
    goIn: () => set({ mode: 'in', amt: '', reason: '' }),
    goOut: () => set({ mode: 'out', amt: '', reason: '' }),
    goClose: () => set({ mode: 'close', counted: '' }),
    back: () => set({ mode: '', err: '' }),
    noSale: () => {
      if (kickDrawer(store)) {
        store.logAudit('Drawer opened (no sale)', 'Manual drawer open', { area: 'Cash' });
        store.say('Drawer opened · logged');
      }
    },
    confirmMove: () => {
      const a = toC(d.amt);
      if (!(a > 0)) return set({ err: 'Enter an amount.' });
      if (!d.reason) return set({ err: 'Choose a reason.' });
      const reason = d.reason;
      if (mode === 'out' && a > exp) return set({ err: 'More than the expected cash in the drawer.' });
      const type = mode === 'out' ? 'out' : 'in';
      if (type === 'out' || store.backend.kind === 'http')
        return store.approve('cash.out', 'Manager approval', `Cash ${type} ${fmtC(a)} · ${reason}`, (ap) =>
          cashMove(store, type, a, reason, ap),
        );
      cashMove(store, type, a, reason, null);
    },
    confirmClose: () => {
      if (d.counted === undefined || d.counted === '') return set({ err: 'Count the drawer and enter the total.' });
      if (big && !(d.note || '').trim()) return set({ err: 'Add a note explaining the variance.' });
      if (big || store.backend.kind === 'http')
        return store.approve(
          'cash.out',
          big ? 'Approve variance' : 'Approve shift close',
          `Expected ${fmtC(exp)} · counted ${fmtC(counted)} · variance ${fmtC(variance)}`,
          (ap) => closeShift(store, counted, d.note || '', ap),
        );
      closeShift(store, counted, d.note || '', null);
    },
  };
}

export function buildOrderActionDialog(store: PosStore, d: DialogOf<'ordact'>) {
  const s = store.state,
    set = (p: Partial<typeof d>) => dlgSet(store, 'ordact', p),
    o = s.orders.find((x) => x.id === d.orderId);
  if (!o) return null;
  const mode = d.mode,
    paid = paidC(o),
    refundable = refundableC(o),
    sel = d.sel || {};
  const refundedUnits: Record<string, number> = {};
  (o.refunds || []).forEach((r) =>
    Object.entries(r.items || {}).forEach(([k, q]) => {
      refundedUnits[k] = (refundedUnits[k] || 0) + q;
    }),
  );
  let block = '';
  if (mode === 'cancel' && !['new', 'failed'].includes(o.status))
    block =
      o.status === 'preparing' || o.status === 'ready'
        ? 'The kitchen has started this order — void items instead.'
        : 'This order can no longer be cancelled.';
  if (mode === 'void' && !['new', 'preparing', 'ready'].includes(o.status)) block = 'Completed orders are refunded, not voided.';
  if (mode === 'refund' && (!paid || o.status === 'cancelled')) block = 'Nothing was paid on this order.';
  if (mode === 'refund' && paid && !refundable) block = 'This order has already been fully refunded.';
  const by = d.by || 'items';
  const rows = o.lines.map((l) => {
    const max = mode === 'refund' ? l.qty - (refundedUnits[l.key] || 0) : l.qty;
    const q = sel[l.key] || 0;
    return {
      key: l.key,
      name: l.name,
      max,
      q,
      maxS: mode === 'refund' ? `${max} refundable` : `${l.qty} on order`,
      valS: fmtC(lineShareC(o, l.key, 1)),
      dim: max ? 1 : 0.45,
      inc: () => {
        if (q < max) set({ sel: { ...sel, [l.key]: q + 1 } });
      },
      dec: () => {
        if (q > 0) set({ sel: { ...sel, [l.key]: q - 1 } });
      },
    };
  });
  const selValue = Object.entries(sel).reduce((n, [k, q]) => n + lineShareC(o, k, q), 0);
  let refundC = 0;
  if (mode === 'cancel') refundC = refundable;
  if (mode === 'void') refundC = Math.max(0, paid - refundedC(o) - (toC(o.total) - selValue));
  if (mode === 'refund') refundC = Math.min(refundable, by === 'amount' ? toC(d.amount) : selValue);
  const alloc = refundC ? allocateRefund(o, refundC) : [];
  const reasons = { cancel: CANCEL_REASONS, void: VOID_REASONS, refund: REFUND_REASONS }[mode];
  const needsPerm = !(mode === 'cancel' && !paid);
  const title = { cancel: 'Cancel order', void: 'Void items', refund: 'Refund' }[mode] + ' · ' + o.id;
  const units = Object.values(sel).reduce((a, b) => a + b, 0);
  const byDefs: ['items' | 'amount', string][] = [
    ['items', 'By item'],
    ['amount', 'Custom amount'],
  ];
  return {
    close: () => closeDialog(store),
    title,
    block,
    ok: !block,
    showItems: mode === 'void' || (mode === 'refund' && by === 'items'),
    rows,
    isRefund: mode === 'refund',
    byOpts: byDefs.map(([id, name]) => ({ id, name, on: by === id, ...seg(by === id), pick: () => set({ by: id, sel: {}, amount: '' }) })),
    isAmount: mode === 'refund' && by === 'amount',
    amount: d.amount || '',
    setAmount: (e: Input) => set({ amount: e.target.value, err: '' }),
    reasons: reasons.map((r) => ({ r, label: r, on: d.reason === r, ...on(d.reason === r), pick: () => set({ reason: r, err: '' }) })),
    paidS: fmtC(paid),
    refundedS: fmtC(refundedC(o)),
    refundableS: fmtC(refundable),
    refundS: fmtC(refundC),
    toLine: alloc.length
      ? 'Returns ' +
        alloc.map((a) => `${fmtC(a.amount)} to ${a.method === 'gift' ? 'gift card ···' + a.giftLast4 : methodName[a.method]}`).join(' + ')
      : mode === 'cancel'
        ? 'Nothing was paid — no refund needed.'
        : mode === 'void'
          ? 'Unpaid order — the bill is reduced.'
          : '',
    permNote: needsPerm && !store.can('orders.refund') ? 'Needs a manager PIN.' : '',
    err: d.err || '',
    cta:
      mode === 'cancel'
        ? 'Cancel order'
        : mode === 'void'
          ? `Void ${units || ''} item${units === 1 ? '' : 's'}`.replace('  ', ' ')
          : `Refund ${fmtC(refundC)}`,
    confirm: () => {
      if (block) return;
      if (!d.reason) return set({ err: 'Choose a reason.' });
      if (mode === 'void' && !selValue) return set({ err: 'Choose the items to void.' });
      if (mode === 'refund' && refundC <= 0) return set({ err: 'Choose items or enter an amount.' });
      const act = { mode, sel, amountC: refundC, reason: d.reason, key: d.key };
      if (!needsPerm) return applyOrderAction(store, o.id, act, null);
      store.approve('orders.refund', 'Manager approval', `${title} · ${fmtC(refundC)}`, (ap) => applyOrderAction(store, o.id, act, ap));
    },
  };
}

export function buildTableDialog(store: PosStore, d: DialogOf<'table'>) {
  const s = store.state,
    occ = occupancy(store),
    { tables } = s.catalog,
    tb = tables.find((t) => t.id === d.tableId);
  if (!tb) return null;
  const o = occ[tb.id];
  const today = iso(new Date());
  const res = s.reservations.find(
    (r) => r.cafe === s.cafe && r.date === today && r.table === tb.id && ['pending', 'confirmed'].includes(r.status),
  );
  const free = tables.filter((t) => !occ[t.id] && t.id !== tb.id);
  const chip = (t: (typeof tables)[number], go: () => void) => ({ id: t.id, label: `${t.id} · ${t.seats}`, go });
  const base = { close: () => closeDialog(store), hasOrder: false as const, hasRes: false as const, isFree: false as const };
  if (o) {
    const tabs = tablesOf(o),
      due = dueC(o);
    return {
      ...base,
      hasOrder: true as const,
      title: `${tabs.join(' + ')} · ${tabs.reduce((n, id) => n + (tables.find((t) => t.id === id)?.seats || 0), 0)} seats`,
      meta: `${o.id} · ${o.lines.reduce((n, l) => n + l.qty, 0)} items · ${o.status}`,
      stateLine: o.paid
        ? 'Paid — mark the table available once guests leave.'
        : due < toC(o.total)
          ? `Part paid · ${fmtC(due)} still due`
          : `${fmtC(due)} open on this table`,
      moveTo: free.map((t) => chip(t, () => moveTable(store, o.id, t.id))),
      joinWith: free.map((t) => chip(t, () => joinTable(store, o.id, t.id))),
      joined: tabs.filter((t) => t !== tabs[0]).map((t) => ({ id: t, label: t, go: () => separateTable(store, o.id, t) })),
      hasJoined: tabs.length > 1,
      canPay: !o.paid,
      pay: () => store.setState({ dlg: { kind: 'pay', forOrderId: o.id, method: 'card', mode: 'full', key: uid('P') } }),
      split: () => store.setState({ dlg: { kind: 'pay', forOrderId: o.id, method: 'card', mode: 'items', key: uid('P') } }),
      canClear: o.paid,
      clear: () => clearTable(store, o.id),
      view: () => store.setState({ view: 'orders', selOrder: o.id, orderStatus: 'all', dlg: null }),
    };
  }
  if (res)
    return {
      ...base,
      hasRes: true as const,
      title: `${tb.id} · ${tb.seats} seats`,
      meta: `Reserved ${fmtHM(res.time)} · ${res.name} · ${res.guests} guests`,
      stateLine: res.notes || 'Synced from Reservations',
      seat: () => seatReservation(store, res, tb.id),
      walkIn: () => {
        store.setState({ view: 'till', type: 'dinein', table: tb.id, dlg: null });
        store.say(`Dine in · ${tb.id} (reservation kept)`);
      },
    };
  return {
    ...base,
    isFree: true as const,
    title: `${tb.id} · ${tb.seats} seats`,
    meta: `${tb.zone} · available`,
    stateLine: '',
    start: () => {
      store.setState({ view: 'till', type: 'dinein', table: tb.id, dlg: null });
      store.say(`Dine in · ${tb.id}`);
    },
  };
}

export function buildSyncDialog(store: PosStore) {
  const s = store.state,
    dev = s.devices;
  const devName = { receipt: 'Receipt printer', kitchen: 'Kitchen printer', drawer: 'Cash drawer', terminal: 'Card terminal' } as const;
  const devTools = store.config.devTools;
  return {
    close: () => closeDialog(store),
    online: s.online,
    statusLine: store.outbox.storageError
      ? 'Device storage is unavailable · changes may not be saved'
      : store.outbox.rejected.length
      ? `${store.outbox.rejected.length} change(s) rejected · manager review required`
      : s.online
      ? store.outbox.rejected.length
        ? `Online · ${store.outbox.rejected.length} change${store.outbox.rejected.length === 1 ? '' : 's'} need review`
        : s.queue.length
          ? `${s.queue.length} item${s.queue.length === 1 ? '' : 's'} waiting to sync`
          : 'Online · everything synced'
      : 'Offline · cash sales are saved on this till and sync later. Card, Apple Pay and gift cards are paused.',
    dot: s.online ? '#3E6B47' : '#9A4436',
    /** Connection loss can only be simulated in development; production follows the real network. */
    canToggle: devTools,
    toggleLabel: s.online ? 'Simulate connection loss' : 'Restore connection',
    toggle: () => setOnline(store, !s.online),
    syncNow: () => void runSync(store),
    rejected: store.outbox.rejected.map((entry) => {
      const command = entry.command;
      const orderId = 'orderId' in command ? command.orderId : 'order' in command ? command.order.id : '';
      return {
        id: entry.id,
        label: orderId ? `${command.type} · ${orderId}` : command.type,
        error: entry.lastError || 'The server rejected this change.',
        paymentReview: command.type === 'payment.record',
        canRetry: command.type === 'order.create',
        retry: () => store.approve('orders.refund', 'Manager approval', `Review ${orderId} before retrying`, () => {
          const queued = store.outbox.retryRejectedOrder(entry.id);
          store.setState({ dlg: { kind: 'sync' } });
          store.say(
            queued
              ? 'Order queued for retry'
              : store.outbox.storageError
                ? 'Device storage is unavailable — the order was not queued'
                : 'This order cannot be retried now',
          );
        }),
      };
    }),
    queue: s.queue.map((q) => ({ id: q.id, label: q.label, at: q.at })),
    hasQueue: s.queue.length > 0,
    conflicts: (s.conflicts || []).map((c) => ({
      id: c.id,
      msg: c.msg,
      keep: () => resolveConflict(store, c.id),
      cancel: () => {
        resolveConflict(store, c.id);
        openOrderAct(store, c.orderId, 'refund');
      },
    })),
    hasConflicts: (s.conflicts || []).length > 0,
    log: (s.syncLog || []).slice(0, 8),
    hasLog: (s.syncLog || []).length > 0,
    devices: (Object.keys(devName) as (keyof typeof devName)[]).map((k) => ({
      id: k,
      name: devName[k],
      state: store.devices.simulated ? dev[k] : 'not connected',
      fg: dev[k] === 'online' ? '#4E6538' : '#8A2E1C',
      bg: dev[k] === 'online' ? '#EEF1E4' : '#FBE9E4',
    })),
    devTools,
    simWeb: () => devSim(store, (m) => m.simulateInbound(store, 'web')),
    simApp: () => devSim(store, (m) => m.simulateInbound(store, 'app')),
    simDup: () => devSim(store, (m) => m.simulateInbound(store, 'dup')),
    simFail: () => devSim(store, (m) => m.simulateInbound(store, 'failed')),
  };
}

export type PayDialogView = ReturnType<typeof buildPayDialog>;
export type ReceiptDialogView = NonNullable<ReturnType<typeof buildReceiptDialog>>;
export type ShiftDialogView = NonNullable<ReturnType<typeof buildShiftDialog>>;
export type OrderActionDialogView = NonNullable<ReturnType<typeof buildOrderActionDialog>>;
export type TableDialogView = NonNullable<ReturnType<typeof buildTableDialog>>;
export type SyncDialogView = ReturnType<typeof buildSyncDialog>;
