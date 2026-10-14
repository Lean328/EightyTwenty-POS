// Pricing rules — AU GST-inclusive. Server must recompute all totals before accepting an order.
export const GST_RATE = 0.10;
export const CARD_SURCHARGE = 0.0295; // TapTouch payments config, all stores
export const DELIVERY_RATE = 0.10;

export const r2 = n => Math.round(n * 100) / 100;
export const money = n => (n < 0 ? '−' : '') + '$' + Math.abs(n).toFixed(2);

/** Unit price for an item with a modifier selection. */
export function unitPrice(item, sel = {}) {
  let p = item.price;
  for (const g of item.mods || []) {
    for (const label of sel[g.id] || []) {
      const opt = g.options.find(o => o[0] === label);
      if (opt) p += opt[1];
    }
  }
  return r2(p);
}

/** Required groups with nothing chosen. */
export function missingRequired(item, sel = {}) {
  return (item.mods || []).filter(g => g.required && !(sel[g.id] || []).length).map(g => g.name);
}

export const lineTotal = l => r2(l.price * l.qty);
export const subtotal = lines => r2(lines.reduce((s, l) => s + lineTotal(l), 0));

/**
 * @param {OrderLine[]} lines
 * @param {{discount?:{kind:'pct'|'amt'|'promo'|'reward',value:number,label:string}, gift?:number, type?:string, method?:string}} o
 */
export function totals(lines, o = {}) {
  const sub = subtotal(lines);
  let disc = 0;
  if (o.discount) {
    const d = o.discount;
    disc = d.kind === 'pct' ? sub * d.value / 100 : d.value;
    disc = Math.min(r2(disc), sub);
  }
  const delivery = o.type === 'delivery' ? r2((sub - disc) * DELIVERY_RATE) : 0;
  const afterDisc = r2(sub - disc + delivery);
  const surcharge = o.method === 'card' ? r2(afterDisc * CARD_SURCHARGE) : 0;
  const total = r2(afterDisc + surcharge);
  const gift = Math.min(o.gift || 0, total);
  const due = r2(total - gift);
  const gst = r2(total / 11); // GST included in price
  return { sub, disc, delivery, surcharge, total, gift, due, gst };
}

/** Equal split of a due amount into n shares, cents balanced. */
export function splitEqual(due, n) {
  const base = Math.floor((due / n) * 100) / 100;
  const shares = Array(n).fill(base);
  let rem = r2(due - base * n);
  for (let i = 0; rem > 0.004; i++, rem = r2(rem - 0.01)) shares[i] = r2(shares[i] + 0.01);
  return shares;
}

// DEMO FIXTURES — test-only codes, not verified EightyTwenty promotions.
export const PROMOS = [
  { code: 'WELCOME10', kind: 'pct', value: 10, label: 'Demo code · 10% off', scope: 'shared' },
  { code: 'LOCAL5', kind: 'amt', value: 5, label: 'Demo code · $5 off', scope: 'app' },
  { code: 'KEEPCUP', kind: 'amt', value: 5, label: 'Demo code · Keep Cup $5', scope: 'shared' }
];
