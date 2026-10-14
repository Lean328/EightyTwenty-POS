// Operational rules for the POS: integer-cent money, payments ledger, refunds, shifts, stock, sync.
// Pure functions only — the server must re-validate every amount before accepting it.
export const toC = n => Math.round((+n || 0) * 100);
export const fromC = c => Math.round(c) / 100;
export const fmtC = c => (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toFixed(2);
export const cash5 = c => Math.round(c / 5) * 5;                 // AU cash rounding to 5c
export const SURCHARGE_BP = 295;                                  // 2.95% card / wallet
export const surchargeC = c => Math.round(c * SURCHARGE_BP / 10000);
export const VARIANCE_LIMIT_C = 500;                              // > $5 drawer variance needs a manager

export const REFUND_REASONS = ['Wrong item made', 'Customer changed mind', 'Quality issue', 'Long wait', 'Allergen concern', 'Duplicate charge'];
export const VOID_REASONS = ['Entered by mistake', 'Out of stock', 'Customer changed order', 'Kitchen error'];
export const CANCEL_REASONS = ['Customer cancelled', 'Café too busy', 'Item unavailable', 'Payment not captured'];
export const CASH_IN_REASONS = ['Float top-up', 'Change from bank'];
export const CASH_OUT_REASONS = ['Supplier paid in cash', 'Banking drop', 'Petty cash'];
export const STOCK_REASONS = ['Delivery received', 'Wastage', 'Stock count', 'Transfer to another café'];

/** Payments recorded on an order. Seeded orders predate the ledger, so derive one payment. */
export function orderPayments(o) {
  if (o.payments) return o.payments;
  if (!o.paid) return [];
  const m = (o.methods && o.methods.find(x => x !== 'gift')) || (o.methods && o.methods[0]) || 'card';
  return [{ method: m, amount: toC(o.total), tip: 0, surcharge: 0, ref: 'seed-' + o.id }];
}
export const paidC = o => orderPayments(o).reduce((n, p) => n + p.amount, 0);
export const refundedC = o => (o.refunds || []).reduce((n, r) => n + r.amount, 0);
export const refundableC = o => Math.max(0, paidC(o) - refundedC(o));
export const dueC = o => Math.max(0, toC(o.total) - paidC(o));

/** Value of `qty` units of a line, as a share of the order total (keeps discounts proportional). */
export function lineShareC(o, key, qty) {
  const sub = o.lines.reduce((n, l) => n + toC(l.price) * l.qty, 0);
  const l = o.lines.find(x => x.key === key);
  if (!l || !sub) return 0;
  return Math.round(toC(l.price) * qty * toC(o.total) / sub);
}

/** Refund goes back to the most recent payments first. Never exceeds what each payment captured. */
export function allocateRefund(o, amountC) {
  const used = {};
  (o.refunds || []).forEach(r => (r.alloc || []).forEach(a => { used[a.ref] = (used[a.ref] || 0) + a.amount; }));
  const out = []; let left = amountC;
  for (const p of orderPayments(o).slice().reverse()) {
    const avail = p.amount - (used[p.ref] || 0);
    if (avail <= 0 || left <= 0) continue;
    const a = Math.min(avail, left);
    out.push({ method: p.method, amount: a, ref: p.ref, giftLast4: p.giftLast4 || null });
    left -= a;
  }
  return out;
}

/** Equal shares in cents; the first shares absorb the remainder. */
export function sharesC(totalC, n) {
  const base = Math.floor(totalC / n), rem = totalC - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export function shiftExpectedC(sh) {
  const sum = t => (sh.moves || []).filter(m => m.type === t).reduce((n, m) => n + m.amount, 0);
  return sh.float + sh.cashSales - sh.cashRefunds + sum('in') - sum('out');
}

export const stockState = s => s.level <= 0 ? 'out' : s.level < s.par * 0.5 ? 'low' : 'ok';
/** Ingredients that switch off a modifier option when they run out. */
export const INGREDIENT_MODS = { oat: ['OAT ADC'], bonsoy: ['Bonsoy'], gfbun: ['Gluten Free Bun'], salmon: ['Smoked Salmon'], milk: ['Full Cream'] };

/** Mock inbound order from the website or app (simulation only — no live integration). */
export function mockInbound(channel, cafe, menuById, n, extRef) {
  const picks = channel === 'app' ? [['hotcoffee', { drink: ['Flat White'], var: ['OAT ADC'] }], ['brekky', {}]] : [['acai-o', {}], ['coldbrew', {}]];
  const lines = picks.map(([id, sel], i) => {
    const m = menuById[id]; let price = m.price;
    for (const g of m.mods) for (const lab of sel[g.id] || []) { const o = g.options.find(x => x[0] === lab); if (o) price += o[1]; }
    return { key: id + n + i, itemId: id, name: m.name, qty: 1, sel, adjust: [], note: '', price: Math.round(price * 100) / 100 };
  });
  const total = Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
  return { channel, type: 'pickup', status: 'new', accepted: false, cafe, lines, total, paid: true, methods: ['card'], payments: [{ method: 'card', amount: toC(total), tip: 0, surcharge: 0, ref: 'ext-' + extRef }], extRef };
}
