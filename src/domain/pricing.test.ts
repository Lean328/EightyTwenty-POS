import { describe, expect, it } from 'vitest';
import { cateringQuote, lineTotal, missingRequired, money, packagePriceLabel, r2, subtotal, totals, unitPrice } from './pricing';
import type { MenuItem } from './types';

const coffee: Pick<MenuItem, 'price' | 'mods'> = {
  price: 4.5,
  mods: [
    {
      id: 'drink',
      name: 'Choose your drink',
      required: true,
      max: 1,
      options: [
        ['Flat White', 0.5],
        ['Espresso', 0],
      ],
    },
    {
      id: 'var',
      name: 'Drink variation',
      required: false,
      max: 0,
      options: [
        ['Large', 1],
        ['OAT ADC', 0.8],
      ],
    },
  ],
};

describe('pricing', () => {
  it('adds modifier surcharges to the unit price', () => {
    expect(unitPrice(coffee, { drink: ['Flat White'], var: ['Large', 'OAT ADC'] })).toBe(6.8);
    expect(unitPrice(coffee, {})).toBe(4.5);
    expect(unitPrice(coffee, { drink: ['Not on menu'] })).toBe(4.5);
  });

  it('lists required groups with nothing chosen', () => {
    expect(missingRequired(coffee)).toEqual(['Choose your drink']);
    expect(missingRequired(coffee, { drink: ['Espresso'] })).toEqual([]);
  });

  it('rounds line and subtotal to cents', () => {
    expect(lineTotal({ price: 0.1, qty: 3 })).toBe(0.3);
    expect(
      subtotal([
        { price: 5.5, qty: 2 },
        { price: 0.7, qty: 3 },
      ]),
    ).toBe(13.1);
    expect(r2(1.005)).toBe(1);
  });

  it('computes GST-inclusive totals', () => {
    const t = totals([{ price: 22, qty: 1 }]);
    expect(t).toMatchObject({ sub: 22, disc: 0, delivery: 0, surcharge: 0, total: 22, gift: 0, due: 22, gst: 2 });
  });

  it('applies percentage and amount discounts, never below zero', () => {
    expect(totals([{ price: 20, qty: 1 }], { discount: { kind: 'pct', value: 15, label: '' } }).total).toBe(17);
    expect(totals([{ price: 20, qty: 1 }], { discount: { kind: 'amt', value: 5, label: '' } }).total).toBe(15);
    expect(totals([{ price: 4, qty: 1 }], { discount: { kind: 'amt', value: 10, label: '' } }).total).toBe(0);
  });

  it('adds delivery after discount, then card surcharge on the discounted total', () => {
    const t = totals([{ price: 100, qty: 1 }], { discount: { kind: 'pct', value: 10, label: '' }, type: 'delivery', method: 'card' });
    expect(t.disc).toBe(10);
    expect(t.delivery).toBe(9);
    expect(t.surcharge).toBe(2.92); // 2.95% of $99 = 2.9205
    expect(t.total).toBe(101.92);
  });

  it('caps a gift card at the total and reports the remainder due', () => {
    expect(totals([{ price: 12, qty: 1 }], { gift: 20 })).toMatchObject({ gift: 12, due: 0 });
    expect(totals([{ price: 12, qty: 1 }], { gift: 5 })).toMatchObject({ gift: 5, due: 7 });
  });

  it('formats money and catering prices as published', () => {
    expect(money(-3.5)).toBe('−$3.50');
    expect(packagePriceLabel(22)).toBe('$22');
    expect(packagePriceLabel(27.5)).toBe('$27.50');
    expect(cateringQuote(27.5, 24, true)).toBe(726);
    expect(cateringQuote(16.5, 15, false)).toBe(247.5);
  });
});
