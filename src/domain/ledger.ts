// Payments ledger, refunds and cash maths — integer cents throughout.
// Pure functions only; the server must re-validate every amount before accepting it.
import type { CashShift, Order, Payment, RefundAllocation } from './types';

export const toC = (n: number | string | null | undefined): number => Math.round((+(n ?? 0) || 0) * 100);
export const fromC = (c: number): number => Math.round(c) / 100;
export const fmtC = (c: number): string => (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toFixed(2);
/** AU cash rounding to the nearest 5c. */
export const cash5 = (c: number): number => Math.round(c / 5) * 5;
/** 2.95% card / wallet surcharge, in basis points. */
export const SURCHARGE_BP = 295;
export const surchargeC = (c: number): number => Math.round((c * SURCHARGE_BP) / 10000);
/** A drawer variance above $5 needs a manager to close the shift. */
export const VARIANCE_LIMIT_C = 500;

/** Payments recorded on an order. Seeded orders predate the ledger, so derive one payment from `paid`. */
export function orderPayments(o: Order): Payment[] {
  if (o.payments) return o.payments;
  if (!o.paid) return [];
  const m = (o.methods && o.methods.find((x) => x !== 'gift')) || (o.methods && o.methods[0]) || 'card';
  return [{ method: m, amount: toC(o.total), tip: 0, surcharge: 0, ref: 'seed-' + o.id }];
}
export const paidC = (o: Order): number => orderPayments(o).reduce((n, p) => n + p.amount, 0);
export const refundedC = (o: Order): number => (o.refunds || []).reduce((n, r) => n + r.amount, 0);
export const refundableC = (o: Order): number => Math.max(0, paidC(o) - refundedC(o));
export const dueC = (o: Order): number => Math.max(0, toC(o.total) - paidC(o));

/** Value of `qty` units of a line as a share of the order total (keeps discounts proportional). */
export function lineShareC(o: Pick<Order, 'lines' | 'total'>, key: string, qty: number): number {
  const sub = o.lines.reduce((n, l) => n + toC(l.price) * l.qty, 0);
  const l = o.lines.find((x) => x.key === key);
  if (!l || !sub) return 0;
  return Math.round((toC(l.price) * qty * toC(o.total)) / sub);
}

/** Refunds go back to the most recent payments first and never exceed what each payment captured. */
export function allocateRefund(o: Order, amountC: number): RefundAllocation[] {
  const used: Record<string, number> = {};
  (o.refunds || []).forEach((r) =>
    (r.alloc || []).forEach((a) => {
      used[a.ref] = (used[a.ref] || 0) + a.amount;
    }),
  );
  const out: RefundAllocation[] = [];
  let left = amountC;
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
export function sharesC(totalC: number, n: number): number[] {
  const base = Math.floor(totalC / n),
    rem = totalC - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export function shiftExpectedC(sh: Pick<CashShift, 'float' | 'cashSales' | 'cashRefunds' | 'moves'>): number {
  const sum = (t: 'in' | 'out') => (sh.moves || []).filter((m) => m.type === t).reduce((n, m) => n + m.amount, 0);
  return sh.float + sh.cashSales - sh.cashRefunds + sum('in') - sum('out');
}
