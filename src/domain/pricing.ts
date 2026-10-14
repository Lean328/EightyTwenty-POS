// Pricing rules — AU, GST inclusive. The server must recompute every total before accepting an order;
// these functions exist so the till can show the same numbers the backend will charge.
import type { Discount, MenuItem, ModSelection, OrderLine, OrderType } from './types';

export const GST_RATE = 0.1;
/** Card / wallet surcharge applied by the payments terminal configuration, all stores. */
export const CARD_SURCHARGE = 0.0295;
export const DELIVERY_RATE = 0.1;

export const r2 = (n: number): number => Math.round(n * 100) / 100;
export const money = (n: number): string => (n < 0 ? '−' : '') + '$' + Math.abs(n).toFixed(2);

/** Unit price for an item with a modifier selection. */
export function unitPrice(item: Pick<MenuItem, 'price' | 'mods'>, sel: ModSelection = {}): number {
  let p = item.price;
  for (const g of item.mods || []) {
    for (const label of sel[g.id] || []) {
      const opt = g.options.find((o) => o[0] === label);
      if (opt) p += opt[1];
    }
  }
  return r2(p);
}

/** Names of required modifier groups with nothing chosen. */
export function missingRequired(item: Pick<MenuItem, 'mods'>, sel: ModSelection = {}): string[] {
  return (item.mods || []).filter((g) => g.required && !(sel[g.id] || []).length).map((g) => g.name);
}

export const lineTotal = (l: Pick<OrderLine, 'price' | 'qty'>): number => r2(l.price * l.qty);
export const subtotal = (lines: Pick<OrderLine, 'price' | 'qty'>[]): number => r2(lines.reduce((s, l) => s + lineTotal(l), 0));

export interface TotalsOptions {
  discount?: Discount | null;
  /** Gift card amount applied, dollars. */
  gift?: number;
  type?: OrderType;
  /** 'card' adds the card surcharge. */
  method?: 'card' | null;
}

export interface Totals {
  sub: number;
  disc: number;
  delivery: number;
  surcharge: number;
  total: number;
  gift: number;
  due: number;
  gst: number;
}

export function totals(lines: Pick<OrderLine, 'price' | 'qty'>[], o: TotalsOptions = {}): Totals {
  const sub = subtotal(lines);
  let disc = 0;
  if (o.discount) {
    const d = o.discount;
    disc = d.kind === 'pct' ? (sub * d.value) / 100 : d.value;
    disc = Math.min(r2(disc), sub);
  }
  const delivery = o.type === 'delivery' ? r2((sub - disc) * DELIVERY_RATE) : 0;
  const afterDisc = r2(sub - disc + delivery);
  const surcharge = o.method === 'card' ? r2(afterDisc * CARD_SURCHARGE) : 0;
  const total = r2(afterDisc + surcharge);
  const gift = Math.min(o.gift || 0, total);
  const due = r2(total - gift);
  const gst = r2(total / 11); // GST is included in the price
  return { sub, disc, delivery, surcharge, total, gift, due, gst };
}

/** Catering estimate: guests × package price, +10% for delivery. */
export const cateringQuote = (pricePerPerson: number, guests: number, delivery: boolean): number =>
  r2(pricePerPerson * guests * (delivery ? 1.1 : 1));

/** "$22", "$27.50" — package prices as published. */
export const packagePriceLabel = (n: number): string => '$' + (Number.isInteger(n) ? String(n) : n.toFixed(2));
