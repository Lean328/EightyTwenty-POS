// Regression guard: the TypeScript business rules must give exactly the same results as the approved
// prototype (archive/prototype/services/*.js) for randomized carts, orders and dates.
import { describe, expect, it } from 'vitest';
import { LOCATIONS } from '../dev/seed/locations';
import { MENU } from '../dev/seed/menu';
import * as hours from './hours';
import * as ledger from './ledger';
import * as loyalty from './loyalty';
import * as pricing from './pricing';
import type { Discount, Order, OrderLine, OrderType, PaymentMethod } from './types';

// Loaded at runtime from the archive so TypeScript does not need types for the legacy JavaScript.
const LEGACY_DIR = '../../archive/prototype/services/';
const legacyPath = (f: string) => LEGACY_DIR + f;
/* eslint-disable @typescript-eslint/no-explicit-any */
const L: Record<string, any> = {
  pricing: await import(/* @vite-ignore */ legacyPath('pricing.js')),
  ops: await import(/* @vite-ignore */ legacyPath('operations.js')),
  loyalty: await import(/* @vite-ignore */ legacyPath('loyalty.js')),
  hours: await import(/* @vite-ignore */ legacyPath('hours.js')),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

let seed = 20261009;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const MENU_BY_ID = Object.fromEntries(MENU.map((m) => [m.id, m]));

function randomLines(): OrderLine[] {
  return Array.from({ length: 1 + Math.floor(rnd() * 5) }, (_, i) => {
    const m = pick(MENU);
    const sel: Record<string, string[]> = {};
    for (const g of m.mods) if (g.required || rnd() < 0.4) sel[g.id] = [pick(g.options)[0]];
    return {
      key: 'k' + i,
      itemId: m.id,
      name: m.name,
      price: pricing.unitPrice(m, sel),
      qty: 1 + Math.floor(rnd() * 4),
      sel,
      adjust: [],
      note: '',
    };
  });
}
function randomDiscount(): Discount | null {
  const r = rnd();
  if (r < 0.4) return null;
  if (r < 0.7) return { kind: 'pct', value: pick([10, 15, 30, 50, 100]), label: '' };
  if (r < 0.9) return { kind: 'amt', value: pick([1, 5, 7.5, 200]), label: '' };
  return { kind: 'reward', value: pick([4.5, 5, 5.5]), label: '' };
}

describe('parity with the approved prototype', () => {
  it('prices items and totals carts identically (2,000 random carts)', () => {
    for (let i = 0; i < 2000; i++) {
      const lines = randomLines();
      const o = {
        discount: randomDiscount(),
        gift: rnd() < 0.3 ? Math.round(rnd() * 6000) / 100 : 0,
        type: pick<OrderType>(['dinein', 'pickup', 'takeaway', 'delivery']),
        method: rnd() < 0.5 ? ('card' as const) : null,
      };
      expect(pricing.totals(lines, o)).toEqual(L.pricing.totals(lines, o));
      for (const l of lines) {
        const m = MENU_BY_ID[l.itemId];
        expect(pricing.unitPrice(m, l.sel)).toBe(L.pricing.unitPrice(m, l.sel));
        expect(pricing.missingRequired(m, l.sel)).toEqual(L.pricing.missingRequired(m, l.sel));
      }
      expect(loyalty.stampsFor(lines, MENU_BY_ID)).toBe(L.loyalty.stampsFor(lines, MENU_BY_ID));
      expect(loyalty.rewardValue(lines, MENU_BY_ID)).toBe(L.loyalty.rewardValue(lines, MENU_BY_ID));
    }
  });

  it('allocates refunds, values lines and splits shares identically (2,000 random orders)', () => {
    for (let i = 0; i < 2000; i++) {
      const lines = randomLines();
      const total = pricing.totals(lines, { discount: randomDiscount() }).total;
      const methods: PaymentMethod[] = ['cash', 'card', 'wallet', 'gift'];
      let left = ledger.toC(total);
      const payments = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, j) => {
        const amount = j === 2 ? left : Math.min(left, Math.round(rnd() * left));
        left -= amount;
        return { method: pick(methods), amount, tip: 0, surcharge: 0, ref: 'p' + j, giftLast4: '8020' };
      });
      const o: Order = {
        id: 'o',
        channel: 'pos',
        type: 'takeaway',
        status: 'completed',
        cafe: 'phillip',
        time: '09:00',
        lines,
        total,
        paid: true,
        methods: [],
        payments,
      };
      const refund = Math.round(rnd() * ledger.paidC(o));
      expect(ledger.allocateRefund(o, refund)).toEqual(L.ops.allocateRefund(o, refund));
      expect(ledger.refundableC(o)).toBe(L.ops.refundableC(o));
      expect(ledger.dueC(o)).toBe(L.ops.dueC(o));
      for (const l of lines) expect(ledger.lineShareC(o, l.key, l.qty)).toBe(L.ops.lineShareC(o, l.key, l.qty));
      const n = 2 + Math.floor(rnd() * 5);
      expect(ledger.sharesC(ledger.toC(total), n)).toEqual(L.ops.sharesC(ledger.toC(total), n));
      expect(ledger.cash5(ledger.toC(total))).toBe(L.ops.cash5(ledger.toC(total)));
      expect(ledger.surchargeC(ledger.toC(total))).toBe(L.ops.surchargeC(ledger.toC(total)));
    }
  });

  it('rolls stamps into rewards identically', () => {
    for (let i = 0; i < 500; i++) {
      const c = { stamps: Math.floor(rnd() * 9), rewards: Math.floor(rnd() * 3) };
      const n = Math.floor(rnd() * 25);
      expect(loyalty.addStamps(c, n)).toEqual(L.loyalty.addStamps(c, n));
    }
  });

  it('builds the same reservation slots for every café over four weeks', () => {
    const start = new Date('2026-10-05T00:00');
    for (const loc of LOCATIONS)
      for (let d = 0; d < 28; d++) {
        const date = hours.addDays(start, d);
        const taken = { '09:00': d % 17, '12:30': 16 };
        expect(hours.slots(loc, date, taken, 16, new Date(0))).toEqual(L.hours.slots(loc, date, taken, 16, new Date(0)));
        expect(hours.hoursFor(loc, date.getDay())).toEqual(L.hours.hoursFor(loc, date.getDay()));
      }
  });
});
