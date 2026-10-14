// View-model builders for the POS dialogs (payment, receipt, shift, order corrections, tables, sync).
// Each returns the flat values the template reads; all money maths in integer cents.
import * as O from './operations.js';

const on = (x) => x ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: '#F7F2EA', fg: '#3A2B24', border: 'rgba(44,26,18,.12)' };
const seg = (x) => x ? { bg: '#FFFCF7', fg: '#2C1A12' } : { bg: 'transparent', fg: '#8C7A6E' };
const methodName = { cash: 'Cash', card: 'Card', wallet: 'Apple Pay', gift: 'Gift card', reward: 'Reward' };

export function payVals(h, d) {
  const s = h.state, set = p => h.dlgSet(p);
  const forO = d.forOrderId ? s.orders.find(o => o.id === d.forOrderId) : null;
  const ct = h.cartTotals(s.lines, null);
  const pseudo = forO || { lines: s.lines, total: ct.total, payments: [] };
  const totalC = O.toC(pseudo.total);
  const preGiftC = forO ? 0 : O.toC(ct.gift);
  const paidSoFar = forO ? O.paidC(forO) : preGiftC;
  const remaining = Math.max(0, totalC - paidSoFar);
  const mode = d.mode || 'full', n = d.n || 2, count = d.count || 0;
  const paidUnits = {}; (forO ? O.orderPayments(forO) : []).forEach(p => Object.entries(p.items || {}).forEach(([k, q]) => { paidUnits[k] = (paidUnits[k] || 0) + q; }));
  const sel = d.sel || {};
  let amount = remaining;
  if (mode === 'equal') { const sh = O.sharesC(totalC, n); amount = count >= n - 1 ? remaining : Math.min(remaining, sh[count]); }
  if (mode === 'items') amount = Math.min(remaining, Object.entries(sel).reduce((a, [k, q]) => a + O.lineShareC(pseudo, k, q), 0));
  if (mode === 'amount') amount = Math.min(remaining, O.toC(d.amount));
  const method = d.method || 'card', cardLike = method === 'card' || method === 'wallet';
  const tipsOn = h.cfg().tips && cardLike;
  const tipC = tipsOn ? Math.round(amount * (d.tip || 0) / 100) : 0;
  const surcharge = cardLike ? O.surchargeC(amount + tipC) : 0;
  const cashDue = O.cash5(amount);
  const tenderC = O.toC(d.tender);
  const gift = d.gift; const giftAmt = gift ? Math.min(O.toC(gift.balance), amount) : 0;
  const offline = !s.online, noShift = !s.shift;
  const processing = d.status === 'processing', failed = d.status === 'failed';
  const methods = [['cash', 'Cash', noShift ? 'open a shift first' : 'rounded to 5c'], ['card', 'Card', offline ? 'paused offline' : '+2.95%'], ['wallet', 'Apple Pay', offline ? 'paused offline' : '+2.95%'], ['gift', 'Gift card', offline ? 'paused offline' : 'any balance']].map(([id, name, sub]) => {
    const dis = processing || (offline && id !== 'cash');
    return { id, name, sub, on: method === id, disabled: dis, opacity: dis ? .45 : 1, ...on(method === id), pick: () => set({ method: id, err: '', status: 'idle' }) };
  });
  const ledger = [...(preGiftC ? [{ id: 'pg', label: `Gift card ···${s.gift.last4}`, amtS: O.fmtC(preGiftC), sub: 'applied from discounts' }] : []), ...(forO ? O.orderPayments(forO).map((p, i) => ({ id: p.ref || i, label: `${methodName[p.method] || p.method}${p.giftLast4 ? ' ···' + p.giftLast4 : ''}`, amtS: O.fmtC(p.amount), sub: [p.tip ? 'tip ' + O.fmtC(p.tip) : '', p.surcharge ? 'surcharge ' + O.fmtC(p.surcharge) : '', p.rounding ? 'rounding ' + O.fmtC(p.rounding) : '', p.by || ''].filter(Boolean).join(' · ') })) : [])];
  const itemRows = pseudo.lines.map(l => { const left = l.qty - (paidUnits[l.key] || 0), q = sel[l.key] || 0; return { key: l.key, name: l.name, left, q, leftS: left ? `${left} left` : 'paid', valS: O.fmtC(O.lineShareC(pseudo, l.key, 1)), dim: left ? 1 : .45, inc: () => { if (q < left) set({ sel: { ...sel, [l.key]: q + 1 } }); }, dec: () => { if (q > 0) set({ sel: { ...sel, [l.key]: q - 1 } }); } }; });
  const quick = [cashDue, Math.ceil(cashDue / 500) * 500, Math.ceil(cashDue / 1000) * 1000, Math.ceil(cashDue / 2000) * 2000, Math.ceil(cashDue / 5000) * 5000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4);
  const err = d.err || '';
  const charge = method === 'cash' ? cashDue : method === 'gift' ? giftAmt : amount + tipC + surcharge;
  const confirm = () => {
    if (processing) return;
    if (!forO && !s.lines.length) return set({ err: 'Nothing to pay for yet.' });
    if (!forO) { const sold = new Set(s.soldOut || []); const bad = s.lines.find(l => sold.has(l.itemId)); if (bad) return set({ err: `${bad.name} is sold out — remove it before taking payment.` }); }
    if (amount <= 0) return set({ err: mode === 'items' ? 'Choose the items this guest is paying for.' : 'Enter an amount to take.' });
    const tender = { method, amount, tip: 0, surcharge: 0, ref: d.key, mode, items: mode === 'items' ? sel : undefined };
    if (method === 'cash') {
      if (noShift) return set({ err: 'Open a cash shift before taking cash.' });
      if (tenderC < cashDue) return set({ err: `Tendered ${O.fmtC(tenderC)} is less than ${O.fmtC(cashDue)}.` });
      return h.takePayment({ ...tender, cashPaid: cashDue, rounding: cashDue - amount, change: tenderC - cashDue });
    }
    if (method === 'gift') {
      if (!gift) return set({ err: 'Check a gift card first.' });
      if (giftAmt <= 0) return set({ err: 'This gift card has no balance.' });
      return h.takePayment({ ...tender, amount: giftAmt, giftLast4: gift.last4 });
    }
    h.chargeCard({ ...tender, tip: tipC, surcharge });
  };
  return {
    title: forO ? `Payment · ${forO.id}` : 'Payment',
    totalS: O.fmtC(totalC), remainingS: O.fmtC(remaining), paidS: O.fmtC(paidSoFar), hasPaid: paidSoFar > 0, ledger,
    gstS: O.fmtC(Math.round(totalC / 11)),
    modes: [['full', 'Pay in full'], ['equal', 'Equal shares'], ['items', 'By item'], ['amount', 'By amount']].map(([id, name]) => ({ id, name, on: mode === id, ...seg(mode === id), pick: () => set({ mode: id, sel: {}, err: '' }) })),
    isEqual: mode === 'equal', isItems: mode === 'items', isAmount: mode === 'amount',
    shareLabel: mode === 'equal' ? `Share ${Math.min(count + 1, n)} of ${n}` : '', nOpts: [2, 3, 4, 5, 6].map(k => ({ k, on: n === k, ...seg(n === k), pick: () => set({ n: k }) })),
    itemRows, amountStr: d.amount || '', setAmount: e => set({ amount: e.target.value, err: '' }),
    thisS: O.fmtC(amount), methods, isCash: method === 'cash', isCard: cardLike, isGift: method === 'gift',
    noShift, shiftOk: !noShift, openShift: () => h.setState({ dlg: { kind: 'shift', back: d } }),
    cashDueS: O.fmtC(cashDue), roundingS: cashDue !== amount ? `Cash rounding ${O.fmtC(cashDue - amount)}` : '', tender: d.tender || '', setTender: e => set({ tender: e.target.value, err: '' }),
    quick: quick.map(v => ({ v, label: O.fmtC(v), pick: () => set({ tender: (v / 100).toFixed(2), err: '' }) })), changeS: O.fmtC(Math.max(0, tenderC - cashDue)),
    tipsOn, tips: [0, 5, 10, 15].map(p => ({ p, label: p ? p + '%' : 'No tip', on: (d.tip || 0) === p, ...seg((d.tip || 0) === p), pick: () => set({ tip: p }) })), tipS: O.fmtC(tipC), surchargeS: O.fmtC(surcharge),
    giftCode: d.giftCode || '', setGiftCode: e => set({ giftCode: e.target.value, err: '' }),
    checkGift: () => { const code = (d.giftCode || '').replace(/\s/g, ''); const g = code.length >= 4 && s.giftcards.find(x => x.code.replace(/\s/g, '').endsWith(code)); if (!g) return set({ err: 'Gift card not found.', gift: null }); set({ gift: { last4: g.code.slice(-4), balance: g.balance }, err: '' }); },
    giftLine: gift ? `···${gift.last4} · balance ${O.fmtC(O.toC(gift.balance))} · uses ${O.fmtC(giftAmt)}${O.toC(gift.balance) < amount ? ' · pay the rest with another method' : ''}` : '',
    chargeS: O.fmtC(charge), processing, failed, err, offline,
    confirmLabel: processing ? 'Waiting for terminal… (simulated)' : failed ? `Retry ${O.fmtC(charge)}` : method === 'cash' ? `Take cash ${O.fmtC(cashDue)}` : `Charge ${O.fmtC(charge)}`,
    confirmBg: processing ? '#9A8B80' : '#B67A4B', confirm,
    declineNext: () => set({ declineNext: true, err: 'Simulation: the next card attempt will be declined.' }),
    closeNote: paidSoFar > 0 && remaining > 0 ? `${O.fmtC(paidSoFar)} taken so far — closing keeps the order open with ${O.fmtC(remaining)} still due.` : ''
  };
}

export function receiptVals(h, d) {
  const s = h.state, o = s.orders.find(x => x.id === d.orderId); if (!o) return null;
  const pays = O.orderPayments(o);
  const change = pays.reduce((n, p) => n + (p.change || 0), 0);
  return {
    totalS: O.fmtC(O.toC(o.total)), meta: `${o.id} · ${{ dinein: 'Dine in', pickup: 'Pickup', takeaway: 'Takeaway', delivery: 'Delivery' }[o.type]}${h.tablesOf(o).length ? ' · ' + h.tablesOf(o).join('+') : ''} · GST incl. ${O.fmtC(Math.round(O.toC(o.total) / 11))}`,
    loyalty: d.loyalty, changeS: change ? `Change ${O.fmtC(change)}` : '',
    lines: o.lines.map(l => ({ key: l.key, qty: l.qty, name: l.name, totalS: O.fmtC(O.toC(l.price) * l.qty) })),
    pays: pays.map((p, i) => ({ id: p.ref || i, label: `${methodName[p.method] || p.method}${p.giftLast4 ? ' ···' + p.giftLast4 : ''}`, amtS: O.fmtC(p.amount + (p.tip || 0) + (p.surcharge || 0)), sub: [p.tip ? 'incl. tip ' + O.fmtC(p.tip) : '', p.surcharge ? 'surcharge ' + O.fmtC(p.surcharge) : '', p.rounding ? 'rounding ' + O.fmtC(p.rounding) : ''].filter(Boolean).join(' · ') })),
    printState: d.printState === 'failed' ? 'Printer offline — nothing printed.' : d.printState === 'printed' ? 'Receipt printed.' : d.printState === 'reprinted' ? 'Reprinted.' : '',
    printFg: d.printState === 'failed' ? '#9A4436' : '#3E6B47', printLabel: d.printState === 'failed' ? 'Retry print' : (o.prints ? 'Reprint receipt' : 'Print receipt'),
    print: () => h.printReceipt(o.id, !!o.prints)
  };
}

export function shiftVals(h, d) {
  const s = h.state, set = p => h.dlgSet(p), cafe = (h.D.LOCATIONS.find(l => l.id === s.cafe) || {}).name;
  if (d.summary) {
    const sh = (s.shifts || []).find(x => x.id === d.summary); if (!sh) return null;
    return { isSummary: true, title: 'Shift closed', rows: [['Opened', `${sh.openedAt} · ${sh.staffName}`], ['Closed', `${sh.closedAt} · ${sh.closedBy}`], ['Expected in drawer', O.fmtC(sh.expected)], ['Counted', O.fmtC(sh.counted)], ['Variance', O.fmtC(sh.variance)], ...(sh.approvedBy ? [['Approved by', sh.approvedBy]] : [])].map(([k, v]) => ({ k, v })), varFg: Math.abs(sh.variance) > O.VARIANCE_LIMIT_C ? '#9A4436' : '#3E6B47' };
  }
  if (!s.shift) {
    const f = d.float == null ? '200' : d.float;
    return { isOpen: true, title: `Open shift · ${cafe}`, float: f, setFloat: e => set({ float: e.target.value, err: '' }), presets: [100, 200, 300].map(v => ({ v, label: '$' + v, on: +f === v, ...on(+f === v), pick: () => set({ float: String(v) }) })), err: d.err || '', open: () => { const c = O.toC(f); if (c < 0 || isNaN(c)) return set({ err: 'Enter the opening float.' }); h.openShift(c); if (d.back) setTimeout(() => h.setState({ dlg: { ...d.back, err: '' } }), 0); } };
  }
  const sh = s.shift, exp = O.shiftExpectedC(sh), mode = d.mode || '';
  const sum = t => sh.moves.filter(m => m.type === t).reduce((n, m) => n + m.amount, 0);
  const counted = O.toC(d.counted), variance = counted - exp, big = Math.abs(variance) > O.VARIANCE_LIMIT_C;
  const reasons = mode === 'in' ? O.CASH_IN_REASONS : O.CASH_OUT_REASONS;
  return {
    isManage: true, title: `Shift · ${cafe}`, meta: `Opened ${sh.openedAt} by ${sh.staffName}`,
    rows: [['Opening float', sh.float], ['Cash sales', sh.cashSales], ['Cash refunds', -sh.cashRefunds], ['Cash in', sum('in')], ['Cash out', -sum('out')]].map(([k, v]) => ({ k, v: O.fmtC(v) })), expectedS: O.fmtC(exp),
    moves: sh.moves.slice().reverse().map(m => ({ id: m.id, label: `${m.type === 'in' ? 'Cash in' : 'Cash out'} · ${m.reason}`, sub: `${m.at} · ${m.by}${m.approver ? ' · approved ' + m.approver : ''}`, amtS: (m.type === 'in' ? '+' : '−') + O.fmtC(m.amount) })), hasMoves: sh.moves.length > 0,
    isIdle: !mode, isMove: mode === 'in' || mode === 'out', isClose: mode === 'close', moveTitle: mode === 'in' ? 'Cash in' : 'Cash out',
    amt: d.amt || '', setAmt: e => set({ amt: e.target.value, err: '' }), reasons: reasons.map(r => ({ r, label: r, on: d.reason === r, ...on(d.reason === r), pick: () => set({ reason: r }) })),
    counted: d.counted || '', setCounted: e => set({ counted: e.target.value, err: '' }), varianceS: d.counted ? O.fmtC(variance) : '—', varFg: !d.counted ? '#8C7A6E' : big ? '#9A4436' : '#3E6B47', bigNote: d.counted && big ? 'Variance over $5 needs manager approval to close.' : '',
    noteText: d.note || '', setNote: e => set({ note: e.target.value }), err: d.err || '',
    goIn: () => set({ mode: 'in', amt: '', reason: '' }), goOut: () => set({ mode: 'out', amt: '', reason: '' }), goClose: () => set({ mode: 'close', counted: '' }), back: () => set({ mode: '', err: '' }),
    noSale: () => { if (h.kickDrawer()) { h.logAudit('Drawer opened (no sale)', 'Manual drawer open', { area: 'Cash' }); h.say('Drawer opened · logged'); } },
    confirmMove: () => { const a = O.toC(d.amt); if (!(a > 0)) return set({ err: 'Enter an amount.' }); if (!d.reason) return set({ err: 'Choose a reason.' }); if (mode === 'out' && a > exp) return set({ err: 'More than the expected cash in the drawer.' }); if (mode === 'out') return h.approve('cash.out', 'Manager approval', `Cash out ${O.fmtC(a)} · ${d.reason}`, ap => h.cashMove('out', a, d.reason, ap)); h.cashMove('in', a, d.reason, null); },
    confirmClose: () => { if (d.counted === undefined || d.counted === '') return set({ err: 'Count the drawer and enter the total.' }); if (big && !(d.note || '').trim()) return set({ err: 'Add a note explaining the variance.' }); if (big) return h.approve('cash.out', 'Approve variance', `Variance ${O.fmtC(variance)} on close`, ap => h.closeShift(counted, d.note || '', ap)); h.closeShift(counted, d.note || '', null); }
  };
}

export function actVals(h, d) {
  const s = h.state, set = p => h.dlgSet(p), o = s.orders.find(x => x.id === d.orderId); if (!o) return null;
  const mode = d.mode, paid = O.paidC(o), refundable = O.refundableC(o), sel = d.sel || {};
  const refundedUnits = {}; (o.refunds || []).forEach(r => Object.entries(r.items || {}).forEach(([k, q]) => { refundedUnits[k] = (refundedUnits[k] || 0) + q; }));
  let block = '';
  if (mode === 'cancel' && !['new', 'failed'].includes(o.status)) block = o.status === 'preparing' || o.status === 'ready' ? 'The kitchen has started this order — void items instead.' : 'This order can no longer be cancelled.';
  if (mode === 'void' && !['new', 'preparing', 'ready'].includes(o.status)) block = 'Completed orders are refunded, not voided.';
  if (mode === 'refund' && (!paid || o.status === 'cancelled')) block = 'Nothing was paid on this order.';
  if (mode === 'refund' && paid && !refundable) block = 'This order has already been fully refunded.';
  const by = d.by || 'items';
  const rows = o.lines.map(l => { const max = mode === 'refund' ? l.qty - (refundedUnits[l.key] || 0) : l.qty; const q = sel[l.key] || 0; return { key: l.key, name: l.name, max, q, maxS: mode === 'refund' ? `${max} refundable` : `${l.qty} on order`, valS: O.fmtC(O.lineShareC(o, l.key, 1)), dim: max ? 1 : .45, inc: () => { if (q < max) set({ sel: { ...sel, [l.key]: q + 1 } }); }, dec: () => { if (q > 0) set({ sel: { ...sel, [l.key]: q - 1 } }); } }; });
  const selValue = Object.entries(sel).reduce((n, [k, q]) => n + O.lineShareC(o, k, q), 0);
  let refundC = 0;
  if (mode === 'cancel') refundC = refundable;
  if (mode === 'void') refundC = Math.max(0, paid - O.refundedC(o) - (O.toC(o.total) - selValue));
  if (mode === 'refund') refundC = Math.min(refundable, by === 'amount' ? O.toC(d.amount) : selValue);
  const alloc = refundC ? O.allocateRefund(o, refundC) : [];
  const reasons = { cancel: O.CANCEL_REASONS, void: O.VOID_REASONS, refund: O.REFUND_REASONS }[mode];
  const needsPerm = !(mode === 'cancel' && !paid);
  const title = { cancel: 'Cancel order', void: 'Void items', refund: 'Refund' }[mode] + ' · ' + o.id;
  return {
    title, block, ok: !block, showItems: mode === 'void' || (mode === 'refund' && by === 'items'), rows,
    isRefund: mode === 'refund', byOpts: [['items', 'By item'], ['amount', 'Custom amount']].map(([id, name]) => ({ id, name, on: by === id, ...seg(by === id), pick: () => set({ by: id, sel: {}, amount: '' }) })), isAmount: mode === 'refund' && by === 'amount', amount: d.amount || '', setAmount: e => set({ amount: e.target.value, err: '' }),
    reasons: reasons.map(r => ({ r, label: r, on: d.reason === r, ...on(d.reason === r), pick: () => set({ reason: r, err: '' }) })),
    paidS: O.fmtC(paid), refundedS: O.fmtC(O.refundedC(o)), refundableS: O.fmtC(refundable),
    refundS: O.fmtC(refundC), toLine: alloc.length ? 'Returns ' + alloc.map(a => `${O.fmtC(a.amount)} to ${a.method === 'gift' ? 'gift card ···' + a.giftLast4 : methodName[a.method]}`).join(' + ') : mode === 'cancel' ? 'Nothing was paid — no refund needed.' : mode === 'void' ? 'Unpaid order — the bill is reduced.' : '',
    permNote: needsPerm && !h.can('orders.refund') ? 'Needs a manager PIN.' : '', err: d.err || '',
    cta: mode === 'cancel' ? 'Cancel order' : mode === 'void' ? `Void ${Object.values(sel).reduce((a, b) => a + b, 0) || ''} item${Object.values(sel).reduce((a, b) => a + b, 0) === 1 ? '' : 's'}`.replace('  ', ' ') : `Refund ${O.fmtC(refundC)}`,
    confirm: () => {
      if (block) return;
      if (!d.reason) return set({ err: 'Choose a reason.' });
      if (mode === 'void' && !selValue) return set({ err: 'Choose the items to void.' });
      if (mode === 'refund' && refundC <= 0) return set({ err: 'Choose items or enter an amount.' });
      const act = { mode, sel, amountC: refundC, reason: d.reason, key: d.key };
      if (!needsPerm) return h.applyOrderAction(o.id, act, null);
      h.approve('orders.refund', 'Manager approval', `${title} · ${O.fmtC(refundC)}`, ap => h.applyOrderAction(o.id, act, ap));
    }
  };
}

export function tableVals(h, d) {
  const s = h.state, occ = h.occupancy(), tb = h.D.TABLES.find(t => t.id === d.tableId); if (!tb) return null;
  const o = occ[tb.id]; const today = new Date(); const iso = h.H.iso(today);
  const res = h.resList().find(r => r.cafe === s.cafe && r.date === iso && r.table === tb.id && ['pending', 'confirmed'].includes(r.status));
  const free = h.D.TABLES.filter(t => !occ[t.id] && t.id !== tb.id);
  const chip = (t, go) => ({ id: t.id, label: `${t.id} · ${t.seats}`, go });
  if (o) {
    const tabs = h.tablesOf(o), due = O.dueC(o);
    return { hasOrder: true, title: `${tabs.join(' + ')} · ${tabs.reduce((n, id) => n + (h.D.TABLES.find(t => t.id === id) || {}).seats, 0)} seats`, meta: `${o.id} · ${o.lines.reduce((n, l) => n + l.qty, 0)} items · ${o.status}`, stateLine: o.paid ? 'Paid — mark the table available once guests leave.' : due < O.toC(o.total) ? `Part paid · ${O.fmtC(due)} still due` : `${O.fmtC(due)} open on this table`,
      moveTo: free.map(t => chip(t, () => h.moveTable(o.id, t.id))), joinWith: free.map(t => chip(t, () => h.joinTable(o.id, t.id))), joined: tabs.filter(t => t !== tabs[0]).map(t => ({ id: t, label: t, go: () => h.separateTable(o.id, t) })), hasJoined: tabs.length > 1,
      canPay: !o.paid, pay: () => h.setState({ dlg: { kind: 'pay', forOrderId: o.id, method: 'card', mode: 'full', key: h.S.uid('P') } }), split: () => h.setState({ dlg: { kind: 'pay', forOrderId: o.id, method: 'card', mode: 'items', key: h.S.uid('P') } }),
      canClear: o.paid, clear: () => h.clearTable(o.id), view: () => h.setState({ view: 'orders', selOrder: o.id, orderStatus: 'all', dlg: null }) };
  }
  if (res) return { hasRes: true, title: `${tb.id} · ${tb.seats} seats`, meta: `Reserved ${h.H.fmt(h.H.parseHM(res.time))} · ${res.name} · ${res.guests} guests`, stateLine: res.notes || 'Synced from Reservations', seat: () => h.seatReservation(res, tb.id), walkIn: () => { h.setState({ view: 'till', type: 'dinein', table: tb.id, dlg: null }); h.say(`Dine in · ${tb.id} (reservation kept)`); } };
  return { isFree: true, title: `${tb.id} · ${tb.seats} seats`, meta: `${tb.zone} · available`, stateLine: '', start: () => { h.setState({ view: 'till', type: 'dinein', table: tb.id, dlg: null }); h.say(`Dine in · ${tb.id}`); } };
}

export function syncVals(h) {
  const s = h.state, dev = s.devices;
  const devName = { receipt: 'Receipt printer', kitchen: 'Kitchen printer', drawer: 'Cash drawer', terminal: 'Card terminal' };
  return {
    online: s.online, statusLine: s.online ? (s.queue.length ? `${s.queue.length} item${s.queue.length === 1 ? '' : 's'} waiting to sync` : 'Online · everything synced') : 'Offline · cash sales are saved on this till and sync later. Card, Apple Pay and gift cards are paused.',
    dot: s.online ? '#3E6B47' : '#9A4436', toggleLabel: s.online ? 'Simulate connection loss' : 'Restore connection', toggle: () => h.setOnline(!s.online), syncNow: () => h.runSync(),
    queue: s.queue.map(q => ({ id: q.id, label: q.label, at: q.at })), hasQueue: s.queue.length > 0,
    conflicts: (s.conflicts || []).map(c => ({ id: c.id, msg: c.msg, keep: () => h.resolveConflict(c.id), cancel: () => { h.resolveConflict(c.id); h.openOrderAct(c.orderId, 'refund'); } })), hasConflicts: (s.conflicts || []).length > 0,
    log: (s.syncLog || []).slice(0, 8), hasLog: (s.syncLog || []).length > 0,
    devices: Object.keys(devName).map(k => ({ id: k, name: devName[k], state: dev[k], fg: dev[k] === 'online' ? '#4E6538' : '#8A2E1C', bg: dev[k] === 'online' ? '#EEF1E4' : '#FBE9E4' })),
    simWeb: () => h.simulateInbound('web'), simApp: () => h.simulateInbound('app'), simDup: () => h.simulateInbound('dup'), simFail: () => h.simulateInbound('failed')
  };
}
