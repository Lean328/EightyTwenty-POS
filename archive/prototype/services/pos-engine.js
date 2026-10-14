// POS engine — state transitions for payments, refunds, shifts, tables, devices, sync and audit.
// Installed onto the POS component (`Object.assign(this, engine)`), so `this` is the component.
// Every money value here is integer cents. Real payment / printer / network calls are simulated.
import * as O from './operations.js';

const sim = (ms) => new Promise(r => setTimeout(r, ms));

export const engine = {
  // ---------- identity, permissions, audit ----------
  roles() { return this._roles || this.D.ROLES; },
  can(perm) { const r = this.roles()[this.staff().role] || this.D.ROLES[this.staff().role]; return r.perms.includes('*') || r.perms.includes(perm); },
  cfg() { return { kitchen: true, receipt: false, tips: false, openDrawer: true, autoStamp: true, ...(this.S.load('ops', {}).toggles || {}) }; },
  logAudit(action, detail, x = {}) {
    const st = this.staff();
    const e = { id: this.S.uid('A'), at: this.S.stamp(), ts: Date.now(), staff: st.name, role: this.D.ROLES[st.role].label, action, detail, reason: x.reason || '', approver: x.approver || '', amount: x.amount == null ? null : x.amount, area: x.area || 'Orders', cafe: this.state.cafe };
    this.setState(s => ({ audit: [e, ...(s.audit || [])].slice(0, 400) }));
  },
  /** Run fn(approver|null) now if allowed, otherwise ask for a manager PIN first. */
  approve(perm, title, body, fn) {
    if (this.can(perm)) return fn(null);
    this.setState({ dlg: { kind: 'pin', pin: '', title, body, perm, next: st => fn(st) } });
  },
  setOrder(id, fn) { this.setState(s => ({ orders: s.orders.map(o => o.id === id ? fn(o) : o) })); },
  note(o, what) { return [...(o.history || []), { at: this.S.stamp(), what }]; },

  // ---------- shifts & cash ----------
  openShift(floatC) {
    const st = this.staff();
    const sh = { id: this.S.uid('SH'), cafe: this.state.cafe, staffId: st.id, staffName: st.name, openedAt: this.S.stamp(), float: floatC, cashSales: 0, cashRefunds: 0, moves: [], status: 'open' };
    this.setState({ shift: sh, dlg: { kind: 'shift' } });
    this.logAudit('Shift opened', `Opening float ${O.fmtC(floatC)}`, { amount: floatC, area: 'Cash' });
    this.say(`Shift open · float ${O.fmtC(floatC)}`);
  },
  cashMove(type, amountC, reason, approver) {
    const mv = { id: this.S.uid('M'), type, amount: amountC, reason, by: this.staff().name, approver: approver ? approver.name : '', at: this.S.stamp() };
    this.setState(s => ({ shift: { ...s.shift, moves: [...s.shift.moves, mv] }, dlg: { kind: 'shift' } }));
    this.logAudit(type === 'in' ? 'Cash in' : 'Cash out', reason, { amount: type === 'in' ? amountC : -amountC, reason, approver: mv.approver, area: 'Cash' });
    if (this.cfg().openDrawer) this.kickDrawer();
  },
  closeShift(countedC, note, approver) {
    const sh = this.state.shift, exp = O.shiftExpectedC(sh);
    const closed = { ...sh, status: 'closed', closedAt: this.S.stamp(), closedBy: this.staff().name, counted: countedC, expected: exp, variance: countedC - exp, note, approvedBy: approver ? approver.name : '' };
    this.setState(s => ({ shift: null, shifts: [closed, ...(s.shifts || [])], dlg: { kind: 'shift', summary: closed.id } }));
    this.logAudit('Shift closed', `Expected ${O.fmtC(exp)} · counted ${O.fmtC(countedC)} · variance ${O.fmtC(countedC - exp)}`, { amount: countedC - exp, reason: note, approver: closed.approvedBy, area: 'Cash' });
  },
  kickDrawer() {
    if (this.state.devices.drawer !== 'online') { this.say('Cash drawer not responding (simulated) — open it manually'); return false; }
    return true;
  },

  // ---------- orders & payments ----------
  cartToOrder() {
    const s = this.state, t = this.cartTotals(s.lines, null);
    const o = { id: this.S.nextOrderNo(), channel: 'pos', type: s.type, status: 'new', accepted: true, cafe: s.cafe, time: this.S.nowHM(), table: s.table || undefined, tables: s.table ? [s.table] : [], customerId: s.customerId || undefined, lines: s.lines, total: t.total, paid: false, methods: [], payments: [], note: s.note, discounts: s.discount ? [{ label: s.discount.label, amount: t.disc }] : [], rewardUsed: !!(s.discount && s.discount.kind === 'reward'), staff: this.staff().name, queued: !s.online, history: [{ at: this.S.stamp(), what: `Created on till by ${this.staff().name}` }] };
    let giftcards = s.giftcards;
    if (s.gift && t.gift > 0) {
      const amt = O.toC(t.gift);
      o.payments.push({ method: 'gift', amount: amt, tip: 0, surcharge: 0, ref: this.S.uid('G'), giftLast4: s.gift.last4, at: this.S.stamp(), by: this.staff().name });
      o.methods.push('gift');
      giftcards = giftcards.map(g => g.code.endsWith(s.gift.last4) ? { ...g, balance: O.fromC(O.toC(g.balance) - amt), history: [...g.history, { d: 'Today', what: `Redeemed · ${o.id}`, amt: -O.fromC(amt) }] } : g);
    }
    if (s.discount) this.logAudit('Discount applied', `${s.discount.label} on ${o.id}`, { amount: -O.toC(t.disc) });
    return { o, giftcards };
  },
  awardLoyalty(o, customers) {
    if (!o.customerId || o.stamped) return [customers, ''];
    const c = customers.find(x => x.id === o.customerId); if (!c) return [customers, ''];
    let n = this.L.stampsFor(o.lines, this.D.MENU_BY_ID), cc = c;
    if (o.rewardUsed) { cc = { ...cc, rewards: Math.max(0, cc.rewards - 1) }; n = Math.max(0, n - 1); }
    if (n) cc = this.L.addStamps(cc, n);
    const msg = n ? `${c.name.split(' ')[0]} earned ${n} stamp${n > 1 ? 's' : ''} · ${cc.rewards ? cc.rewards + ' free coffee ready' : (this.L.STAMPS_PER_REWARD - cc.stamps) + ' to go'}` : '';
    return [customers.map(x => x.id === c.id ? cc : x), msg];
  },
  /** Record one tender. Idempotent on `ref` so a retried terminal response never double-charges. */
  takePayment(tender) {
    const s = this.state, d = s.dlg || {};
    let orders = s.orders, giftcards = s.giftcards, id = d.forOrderId, patch = {}, created = null;
    if (id && (orders.find(o => o.id === id)?.payments || []).some(p => p.ref === tender.ref)) return this.say('Payment already recorded');
    if (!id) {
      const r = this.cartToOrder(); created = r.o; id = r.o.id; giftcards = r.giftcards; orders = [r.o, ...orders];
      patch = { lines: [], discount: null, gift: null, note: '', table: '', customerId: null, cartOpen: false };
    }
    const pay = { ...tender, at: this.S.stamp(), by: this.staff().name };
    if (tender.method === 'gift') giftcards = giftcards.map(g => g.code.endsWith(tender.giftLast4) ? { ...g, balance: O.fromC(O.toC(g.balance) - tender.amount), history: [...g.history, { d: 'Today', what: `Redeemed · ${id}`, amt: -O.fromC(tender.amount) }] } : g);
    let shift = s.shift;
    if (tender.method === 'cash' && shift) shift = { ...shift, cashSales: shift.cashSales + (tender.cashPaid != null ? tender.cashPaid : tender.amount) };
    orders = orders.map(o => o.id === id ? { ...o, payments: [...O.orderPayments(o), pay], methods: [...new Set([...(o.methods || []), tender.method])], history: this.note(o, `${O.fmtC(tender.amount)} ${tender.method}${tender.tip ? ' + ' + O.fmtC(tender.tip) + ' tip' : ''} · ${pay.by}`) } : o);
    const o = orders.find(x => x.id === id); const done = O.paidC(o) >= O.toC(o.total);
    let customers = s.customers, loyalty = '';
    if (done) { [customers, loyalty] = this.awardLoyalty(o, customers); orders = orders.map(x => x.id === id ? { ...x, paid: true, stamped: true } : x); }
    const queue = !s.online ? [...s.queue, { id: this.S.uid('Q'), kind: 'payment', orderId: id, label: `${id} · cash ${O.fmtC(tender.amount)}`, at: this.S.stamp() }] : s.queue;
    this.setState({ ...patch, orders, giftcards, shift, customers, queue, dlg: done ? { kind: 'receipt', orderId: id, loyalty } : { ...d, forOrderId: id, key: this.S.uid('P'), status: 'idle', err: '', tender: '', amount: '', sel: {}, giftCode: '', gift: null, count: (d.count || 0) + 1 } });
    if (tender.method === 'cash' && this.cfg().openDrawer) this.kickDrawer();
    if (created) setTimeout(() => this.printDocket(id), 0);
    if (done && this.cfg().receipt) setTimeout(() => this.printReceipt(id, false), 0);
  },
  /** Card / wallet — simulated terminal round-trip with success, decline and offline outcomes. */
  async chargeCard(tender) {
    const d = this.state.dlg; if (!d || d.status === 'processing') return;
    this.setState({ dlg: { ...d, status: 'processing', err: '' } });
    await sim(1100);
    const s = this.state; if (!s.dlg || s.dlg.kind !== 'pay') return;
    if (!s.online) return this.setState({ dlg: { ...s.dlg, status: 'failed', err: 'Connection lost before approval — no charge was made. Take cash or retry when back online.' } });
    if (s.devices.terminal !== 'online') return this.setState({ dlg: { ...s.dlg, status: 'failed', err: 'Card terminal not responding (simulated) — no charge was made. Check the terminal and retry.' } });
    if (s.dlg.declineNext) return this.setState({ dlg: { ...s.dlg, status: 'failed', declineNext: false, err: 'Card declined by issuer — no charge was made. Ask for another card or method.' } });
    this.takePayment(tender);
  },

  // ---------- refunds, voids, cancellations ----------
  openOrderAct(id, mode) { this.setState({ dlg: { kind: 'ordact', orderId: id, mode, sel: {}, by: 'items', amount: '', reason: '', key: this.S.uid('R') } }); },
  applyOrderAction(id, act, approver) {
    const s = this.state, o = s.orders.find(x => x.id === id); if (!o) return;
    if ((o.refunds || []).some(r => r.key === act.key)) return this.say('Already processed');
    let lines = o.lines, total = o.total, status = o.status, refundC = 0;
    const units = act.sel || {};
    if (act.mode === 'cancel') { status = 'cancelled'; refundC = O.refundableC(o); }
    if (act.mode === 'void') {
      const valueC = Object.entries(units).reduce((n, [k, q]) => n + O.lineShareC(o, k, q), 0);
      lines = o.lines.map(l => ({ ...l, qty: l.qty - (units[l.key] || 0) })).filter(l => l.qty > 0);
      total = O.fromC(O.toC(o.total) - valueC);
      refundC = Math.max(0, O.paidC(o) - O.refundedC(o) - O.toC(total));
      if (!lines.length) status = 'cancelled';
    }
    if (act.mode === 'refund') refundC = Math.min(act.amountC, O.refundableC(o));
    const alloc = refundC ? O.allocateRefund(o, refundC) : [];
    let giftcards = s.giftcards, shift = s.shift, customers = s.customers;
    alloc.filter(a => a.method === 'gift').forEach(a => { giftcards = giftcards.map(g => g.code.endsWith(a.giftLast4 || '') ? { ...g, balance: O.fromC(O.toC(g.balance) + a.amount), history: [...g.history, { d: 'Today', what: `Refund restored · ${id}`, amt: O.fromC(a.amount) }] } : g); });
    const cashBack = alloc.filter(a => a.method === 'cash').reduce((n, a) => n + a.amount, 0);
    if (cashBack && shift) shift = { ...shift, cashRefunds: shift.cashRefunds + cashBack };
    // reverse stamps for coffee units given back
    const coffeeUnits = act.mode === 'cancel' ? this.L.stampsFor(o.lines, this.D.MENU_BY_ID) : Object.entries(units).reduce((n, [k, q]) => { const l = o.lines.find(x => x.key === k); return n + (l && this.L.isEligible(this.D.MENU_BY_ID[l.itemId]) ? q : 0); }, 0);
    if (o.customerId && o.stamped && coffeeUnits) customers = customers.map(c => c.id === o.customerId ? { ...c, stamps: Math.max(0, c.stamps - coffeeUnits) } : c);
    const rec = { key: act.key, mode: act.mode, amount: refundC, alloc, reason: act.reason, by: this.staff().name, approver: approver ? approver.name : '', at: this.S.stamp(), items: units };
    const after = O.refundedC(o) + refundC;
    if (act.mode === 'refund' && after >= O.paidC(o)) status = 'refunded';
    const label = { cancel: 'Order cancelled', void: 'Items voided', refund: after >= O.paidC(o) ? 'Order refunded' : 'Partial refund' }[act.mode];
    const methods = alloc.map(a => `${O.fmtC(a.amount)} to ${a.method === 'gift' ? 'gift card ···' + a.giftLast4 : a.method}`).join(', ');
    const o2 = { ...o, lines, total, status, refunds: [...(o.refunds || []), rec], history: this.note(o, `${label} · ${act.reason}${refundC ? ' · ' + methods : ''} · ${rec.by}${rec.approver ? ' (approved ' + rec.approver + ')' : ''}`) };
    this.setState({ orders: s.orders.map(x => x.id === id ? o2 : x), giftcards, shift, customers, dlg: null });
    this.logAudit(label, `${id}${refundC ? ' · ' + methods : ''}`, { amount: refundC ? -refundC : null, reason: act.reason, approver: rec.approver });
    this.say(`${label}${refundC ? ' · ' + O.fmtC(refundC) + ' returned' : ''}`);
    if (cashBack && this.cfg().openDrawer) this.kickDrawer();
  },

  // ---------- multichannel ----------
  advanceOrder(id) {
    const o = this.state.orders.find(x => x.id === id); if (!o) return;
    const next = { new: 'preparing', preparing: 'ready', ready: 'completed' }[o.status]; if (!next) return;
    const label = { preparing: 'Preparing', ready: o.type === 'delivery' ? 'Out for delivery' : 'Ready for pickup', completed: 'Completed' }[next];
    this.setOrder(id, x => ({ ...x, status: next, accepted: true, history: this.note(x, `${label}${x.channel !== 'pos' ? ' · customer notified via ' + (x.channel === 'app' ? 'app' : 'email') : ''}`) }));
  },
  acceptOrder(id) { this.setOrder(id, x => ({ ...x, accepted: true, status: 'preparing', history: this.note(x, `Accepted by ${this.staff().name} · customer notified`) })); this.printDocket(id); this.logAudit('Online order accepted', id); },
  simulateInbound(kind) {
    const s = this.state;
    if (!s.online) return this.say('Offline — website and app orders will arrive when the connection is back');
    const channel = kind === 'web' || kind === 'failed' ? 'web' : 'app';
    const extRef = kind === 'dup' && this._lastExt ? this._lastExt : 'EXT' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const dup = s.orders.find(o => o.extRef === extRef);
    const log = (msg) => this.setState(st => ({ syncLog: [{ id: this.S.uid('L'), at: this.S.stamp(), msg }, ...(st.syncLog || [])].slice(0, 50) }));
    if (dup) { log(`Duplicate ${channel} order ${extRef} ignored — already ${dup.id}`); this.logAudit('Duplicate order blocked', `${extRef} already received as ${dup.id}`, { area: 'Sync' }); return this.say(`Duplicate ignored · already ${dup.id}`); }
    const base = O.mockInbound(channel, s.cafe, this.D.MENU_BY_ID, Date.now(), extRef);
    const o = { ...base, id: this.S.nextOrderNo(), time: this.S.nowHM(), history: [{ at: this.S.stamp(), what: `Received from ${channel === 'app' ? 'EightyTwenty app' : 'eightytwentyfood.com.au'} · routed to ${(this.D.LOCATIONS.find(l => l.id === s.cafe) || {}).name}` }] };
    if (kind === 'failed') Object.assign(o, { status: 'failed', paid: false, payments: [], methods: [], history: [...o.history, { at: this.S.stamp(), what: 'Payment not captured by website — do not prepare' }] });
    this._lastExt = extRef;
    this.setState(st => ({ orders: [o, ...st.orders] }));
    log(`${o.id} received from ${channel === 'app' ? 'app' : 'website'}${kind === 'failed' ? ' · payment failed' : ''}`);
    this.say(`${kind === 'failed' ? 'Failed' : 'New'} ${channel === 'app' ? 'app' : 'website'} order ${o.id}`);
  },

  // ---------- tables ----------
  tablesOf(o) { return [...new Set([...(o.tables || []), ...(o.table ? [o.table] : [])])]; },
  occupancy() {
    const map = {};
    this.state.orders.forEach(o => { if (o.cafe !== this.state.cafe || o.cleared || ['cancelled', 'refunded', 'failed'].includes(o.status)) return; if (o.paid && o.status === 'completed' && !this.tablesOf(o).length) return; this.tablesOf(o).forEach(t => { map[t] = o; }); });
    return map;
  },
  moveTable(id, to) { this.setOrder(id, o => ({ ...o, table: to, tables: [to, ...this.tablesOf(o).filter(t => t !== o.table && t !== to)], history: this.note(o, `Moved to ${to}`) })); this.say(`Moved to ${to}`); this.setState({ dlg: null }); },
  joinTable(id, t) { this.setOrder(id, o => ({ ...o, tables: [...new Set([...this.tablesOf(o), t])], history: this.note(o, `Joined ${t}`) })); this.say(`${t} joined`); },
  separateTable(id, t) { this.setOrder(id, o => ({ ...o, tables: this.tablesOf(o).filter(x => x !== t), history: this.note(o, `Separated ${t}`) })); this.say(`${t} separated`); },
  clearTable(id) { this.setOrder(id, o => ({ ...o, cleared: true, status: o.status === 'ready' || o.status === 'preparing' ? o.status : 'completed', history: this.note(o, 'Table marked available') })); this.setState({ dlg: null }); this.say('Table available'); },
  resList() { return this.S.load('ops', {}).reservations || this.D.RESERVATIONS; },
  seatReservation(r, tableId) {
    const ops = this.S.load('ops', {}); const list = (ops.reservations || this.D.RESERVATIONS).map(x => x.id === r.id ? { ...x, status: 'completed', table: tableId } : x);
    this.S.save('ops', { ...ops, reservations: list });
    this.setState({ view: 'till', type: 'dinein', table: tableId, customerId: r.customerId || null, dlg: null });
    this.say(`${r.name} seated at ${tableId}`);
  },

  // ---------- printing (simulated devices) ----------
  printDocket(id) {
    if (!this.cfg().kitchen) return;
    const ok = this.state.devices.kitchen === 'online';
    this.setOrder(id, o => ({ ...o, docket: ok ? 'printed' : 'failed', docketTries: (o.docketTries || 0) + 1 }));
    if (!ok) this.say(`Kitchen docket for ${id} failed — ticket is still on the kitchen screen`);
  },
  printReceipt(id, reprint) {
    const ok = this.state.devices.receipt === 'online';
    if (ok) this.setOrder(id, o => ({ ...o, prints: (o.prints || 0) + 1 }));
    if (this.state.dlg && this.state.dlg.kind === 'receipt') this.setState(s => ({ dlg: { ...s.dlg, printState: ok ? (reprint ? 'reprinted' : 'printed') : 'failed' } }));
    if (ok && reprint) this.logAudit('Receipt reprinted', id);
    this.say(ok ? `${reprint ? 'Reprinted' : 'Printed'} receipt ${id} (simulated printer)` : 'Receipt printer offline — nothing printed. Retry when it is back.');
    return ok;
  },

  // ---------- offline & sync ----------
  setOnline(on) {
    if (on === this.state.online) return;
    this.setState({ online: on });
    this.logAudit(on ? 'Connection restored' : 'Connection lost', on ? 'Back online' : 'Working offline — cash sales queue locally', { area: 'Sync' });
    if (on) setTimeout(() => this.runSync(), 300); else this.say('Offline · cash sales will queue and sync later');
  },
  runSync() {
    const s = this.state; if (!s.online) return this.say('Still offline — nothing synced');
    const sold = new Set(s.soldOut || []), done = new Set(s.synced || []);
    const conflicts = [...(s.conflicts || [])]; let n = 0;
    s.queue.forEach(q => {
      if (done.has(q.id)) return; done.add(q.id); n++;
      const o = s.orders.find(x => x.id === q.orderId);
      const bad = o && o.lines.find(l => sold.has(l.itemId));
      if (bad && !conflicts.some(c => c.orderId === o.id)) conflicts.push({ id: this.S.uid('C'), orderId: o.id, msg: `${o.id} includes ${bad.name}, marked sold out while offline. Confirm it was served or cancel it.` });
    });
    const orders = s.orders.map(o => o.queued ? { ...o, queued: false, history: this.note(o, 'Synced to head office') } : o);
    this.setState({ queue: [], synced: [...done].slice(-200), conflicts, orders, syncLog: [{ id: this.S.uid('L'), at: this.S.stamp(), msg: `Synced ${n} item${n === 1 ? '' : 's'}${conflicts.length ? ' · ' + conflicts.length + ' need attention' : ''}` }, ...(s.syncLog || [])].slice(0, 50) });
    this.say(n ? `Synced ${n} item${n === 1 ? '' : 's'}` : 'Everything is up to date');
  },
  resolveConflict(id) { this.setState(s => ({ conflicts: s.conflicts.filter(c => c.id !== id) })); this.logAudit('Sync conflict resolved', id, { area: 'Sync' }); },

  // ---------- inventory ----------
  adjustStock(id, delta, reason) {
    const s = this.state; const item = s.stock.find(x => x.id === id); if (!item) return;
    const level = Math.max(0, Math.round((item.level + delta) * 10) / 10);
    const stock = s.stock.map(x => x.id === id ? { ...x, level, state: O.stockState({ ...x, level }) } : x);
    const entry = { id: this.S.uid('S'), at: this.S.stamp(), item: item.name, delta, unit: item.unit, level, reason, by: this.staff().name };
    this.setState({ stock, stockLog: [entry, ...(s.stockLog || [])].slice(0, 200), availSync: this.S.stamp() });
    this.logAudit('Stock adjusted', `${item.name} ${delta > 0 ? '+' : ''}${delta} ${item.unit} → ${level}`, { reason, area: 'Inventory' });
  },
  unavailableMods() {
    const s = this.state, set = new Set(s.unavailableMods || []);
    (s.stock || []).forEach(x => { if (x.level <= 0) (O.INGREDIENT_MODS[x.id] || []).forEach(m => set.add(m)); });
    return set;
  }
};
