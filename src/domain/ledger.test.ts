import { describe, expect, it } from 'vitest';
import {
  allocateRefund,
  cash5,
  dueC,
  fmtC,
  lineShareC,
  orderPayments,
  paidC,
  refundableC,
  sharesC,
  shiftExpectedC,
  surchargeC,
  toC,
} from './ledger';
import type { Order } from './types';

const order = (x: Partial<Order> = {}): Order => ({
  id: '#8020-1',
  channel: 'pos',
  type: 'takeaway',
  status: 'completed',
  cafe: 'phillip',
  time: '09:00',
  lines: [
    { key: 'a', itemId: 'x', name: 'A', price: 6, qty: 2, sel: {}, adjust: [], note: '' },
    { key: 'b', itemId: 'y', name: 'B', price: 8, qty: 1, sel: {}, adjust: [], note: '' },
  ],
  total: 20,
  paid: true,
  methods: ['card'],
  ...x,
});

describe('ledger', () => {
  it('converts and formats cents without float drift', () => {
    expect(toC(0.1 + 0.2)).toBe(30);
    expect(toC('12.345')).toBe(1235);
    expect(toC(undefined)).toBe(0);
    expect(fmtC(-150)).toBe('−$1.50');
  });

  it('rounds cash to 5c and computes the card surcharge', () => {
    expect(cash5(1232)).toBe(1230);
    expect(cash5(1233)).toBe(1235);
    expect(surchargeC(10000)).toBe(295);
  });

  it('derives a single payment for seeded paid orders', () => {
    expect(orderPayments(order())).toEqual([{ method: 'card', amount: 2000, tip: 0, surcharge: 0, ref: 'seed-#8020-1' }]);
    expect(orderPayments(order({ paid: false }))).toEqual([]);
  });

  it('tracks paid, refunded, refundable and due amounts', () => {
    const o = order({
      payments: [{ method: 'cash', amount: 1500, tip: 0, surcharge: 0, ref: 'p1' }],
      refunds: [{ key: 'r', mode: 'refund', amount: 500, alloc: [], reason: '', by: '', approver: '', at: '', items: {} }],
      paid: false,
    });
    expect(paidC(o)).toBe(1500);
    expect(refundableC(o)).toBe(1000);
    expect(dueC(o)).toBe(500);
  });

  it('values line units as a share of the (discounted) order total', () => {
    const discounted = order({ total: 16 }); // $20 of goods, $4 off
    expect(lineShareC(discounted, 'b', 1)).toBe(640); // $8 is 40% of the goods → 40% of $16
    expect(lineShareC(discounted, 'a', 2)).toBe(960);
    expect(lineShareC(discounted, 'missing', 1)).toBe(0);
  });

  it('refunds to the most recent payments first and never over-refunds a payment', () => {
    const o = order({
      payments: [
        { method: 'gift', amount: 500, tip: 0, surcharge: 0, ref: 'g', giftLast4: '8020' },
        { method: 'card', amount: 1500, tip: 0, surcharge: 0, ref: 'c' },
      ],
    });
    expect(allocateRefund(o, 1800)).toEqual([
      { method: 'card', amount: 1500, ref: 'c', giftLast4: null },
      { method: 'gift', amount: 300, ref: 'g', giftLast4: '8020' },
    ]);
    const after = {
      ...o,
      refunds: [
        {
          key: 'r1',
          mode: 'refund' as const,
          amount: 1500,
          alloc: [{ method: 'card' as const, amount: 1500, ref: 'c', giftLast4: null }],
          reason: '',
          by: '',
          approver: '',
          at: '',
          items: {},
        },
      ],
    };
    expect(allocateRefund(after, 900)).toEqual([{ method: 'gift', amount: 500, ref: 'g', giftLast4: '8020' }]);
  });

  it('splits equal shares with the remainder on the first shares', () => {
    expect(sharesC(1000, 3)).toEqual([334, 333, 333]);
    expect(sharesC(1001, 2).reduce((a, b) => a + b, 0)).toBe(1001);
  });

  it('computes the expected drawer', () => {
    expect(
      shiftExpectedC({
        float: 20000,
        cashSales: 4550,
        cashRefunds: 1000,
        moves: [
          { id: '1', type: 'in', amount: 5000, reason: '', by: '', approver: '', at: '' },
          { id: '2', type: 'out', amount: 2000, reason: '', by: '', approver: '', at: '' },
        ],
      }),
    ).toBe(26550);
  });
});
