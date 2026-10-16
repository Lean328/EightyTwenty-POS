import { describe, expect, it } from 'vitest';
import {
  elapsedMs,
  fmtElapsed,
  isOnBoard,
  lineDietFlags,
  linePrep,
  orderDietFlags,
  placedAtMs,
  prepHold,
  removedItems,
  stationOf,
  stationPrep,
  statusFromLines,
  urgencyOf,
} from './kitchen';
import type { MenuItem, Order, OrderLine } from './types';

const menu = {
  flat: { id: 'flat', cat: 'coffee' },
  juice: { id: 'juice', cat: 'juices' },
  toast: { id: 'toast', cat: 'allday' },
  cake: { id: 'cake', cat: 'bites', station: 'bar' },
} as unknown as Record<string, MenuItem>;

const line = (key: string, itemId: string, x: Partial<OrderLine> = {}): OrderLine => ({
  key,
  itemId,
  name: itemId,
  price: 5,
  qty: 1,
  sel: {},
  adjust: [],
  note: '',
  ...x,
});
const order = (x: Partial<Order> = {}): Order => ({
  id: '#8020-1',
  channel: 'pos',
  type: 'takeaway',
  status: 'new',
  cafe: 'phillip',
  time: '09:00',
  lines: [line('a', 'toast'), line('b', 'flat')],
  total: 10,
  paid: true,
  methods: [],
  ...x,
});

describe('station routing', () => {
  it('sends drinks to the barista and everything else to the kitchen', () => {
    expect(stationOf(menu.flat)).toBe('bar');
    expect(stationOf(menu.juice)).toBe('bar');
    expect(stationOf(menu.toast)).toBe('kitchen');
    expect(stationOf(undefined)).toBe('kitchen');
  });
  it('lets a menu item override its category', () => {
    expect(stationOf(menu.cake)).toBe('bar');
  });
});

describe('line preparation', () => {
  it('follows the order status until the kitchen touches a line', () => {
    expect(linePrep(order({ status: 'new' }), {})).toBe('new');
    expect(linePrep(order({ status: 'preparing' }), {})).toBe('preparing');
    expect(linePrep(order({ status: 'ready' }), { prep: 'new' })).toBe('ready');
  });
  it('treats an untracked line on a tracked order as not started (added later)', () => {
    const o = order({ status: 'preparing', lines: [line('a', 'toast', { prep: 'ready' }), line('b', 'flat')] });
    expect(linePrep(o, o.lines[1])).toBe('new');
  });
  it('combines lines per station', () => {
    const o = order({ status: 'preparing', lines: [line('a', 'toast', { prep: 'preparing' }), line('b', 'flat', { prep: 'ready' })] });
    expect(stationPrep(o, 'bar', menu)).toBe('ready');
    expect(stationPrep(o, 'kitchen', menu)).toBe('preparing');
    expect(stationPrep(o, 'all', menu)).toBe('preparing');
    expect(stationPrep(order({ lines: [line('a', 'toast')] }), 'bar', menu)).toBeNull();
  });
  it('makes a mixed order ready only when every station is ready', () => {
    expect(statusFromLines('preparing', ['ready', 'preparing'])).toBe('preparing');
    expect(statusFromLines('preparing', ['ready', 'new'])).toBe('preparing');
    expect(statusFromLines('new', ['preparing', 'new'])).toBe('preparing');
    expect(statusFromLines('new', ['new', 'new'])).toBe('new');
    expect(statusFromLines('preparing', ['ready', 'ready'])).toBe('ready');
    expect(statusFromLines('ready', ['ready', 'preparing'])).toBe('preparing');
  });
  it('keeps a station-finished mixed order on the board for the other station only', () => {
    const o = order({ status: 'preparing', lines: [line('a', 'toast', { prep: 'preparing' }), line('b', 'flat', { prep: 'ready' })] });
    expect(isOnBoard(o, 'kitchen', menu)).toBe(true);
    expect(isOnBoard(o, 'bar', menu)).toBe(false);
    expect(isOnBoard(o, 'all', menu)).toBe(true);
    expect(isOnBoard({ ...o, status: 'ready' }, 'all', menu)).toBe(false);
    expect(isOnBoard({ ...o, status: 'cancelled' }, 'kitchen', menu)).toBe(false);
  });
});

describe('preparation eligibility', () => {
  it('holds failed, unaccepted and unpaid online orders', () => {
    expect(prepHold(order({ status: 'failed', channel: 'web', paid: false }))).toBe('payment-failed');
    expect(prepHold(order({ channel: 'app', accepted: false }))).toBe('awaiting-acceptance');
    expect(prepHold(order({ channel: 'web', paid: false }))).toBe('unpaid-online');
    expect(prepHold(order({ channel: 'web', paid: true }))).toBeNull();
  });
  it('allows till open tabs sent to the kitchen before payment', () => {
    expect(prepHold(order({ channel: 'pos', paid: false }))).toBeNull();
  });
});

describe('timers', () => {
  const now = new Date(2026, 9, 15, 10, 12, 30).getTime();
  it('uses the exact placement time when known', () => {
    expect(elapsedMs({ time: '10:00', placedAt: new Date(2026, 9, 15, 10, 5, 0).toISOString() }, now)).toBe(450_000);
  });
  it('falls back to the HH:MM order time, crossing midnight', () => {
    expect(elapsedMs({ time: '10:00' }, now)).toBe(750_000);
    const justAfterMidnight = new Date(2026, 9, 16, 0, 5).getTime();
    expect(placedAtMs({ time: '23:55' }, justAfterMidnight)).toBe(new Date(2026, 9, 15, 23, 55).getTime());
    expect(elapsedMs({ time: '10:20' }, now)).toBe(0);
  });
  it('shows running late and overdue by station targets', () => {
    expect(urgencyOf(3 * 60_000, ['bar'])).toBe('ok');
    expect(urgencyOf(5 * 60_000, ['bar'])).toBe('warn');
    expect(urgencyOf(8 * 60_000, ['bar'])).toBe('late');
    expect(urgencyOf(8 * 60_000, ['kitchen', 'bar'])).toBe('ok');
    expect(urgencyOf(16 * 60_000, ['kitchen'])).toBe('late');
  });
  it('formats elapsed time', () => {
    expect(fmtElapsed(65_000)).toBe('1:05');
    expect(fmtElapsed(3_725_000)).toBe('1:02:05');
  });
});

describe('dietary and allergy alerts', () => {
  it('flags allergy and dietary adjustments, dietary modifiers and notes', () => {
    const flags = lineDietFlags(
      line('a', 'toast', {
        adjust: ['No nuts', 'No gluten (GFO)', 'Extra hot'],
        sel: { gfo: ['Gluten Free Bun'], add: ['Poached Egg'] },
        note: 'Severe sesame allergy',
      }),
    );
    expect(flags).toEqual([
      { text: 'No nuts', severity: 'allergy' },
      { text: 'No gluten (GFO)', severity: 'dietary' },
      { text: 'Gluten Free Bun', severity: 'dietary' },
      { text: 'Severe sesame allergy', severity: 'allergy' },
    ]);
  });
  it('includes the customer dietary profile and a dietary order note', () => {
    expect(orderDietFlags({ note: 'Vegan please' }, { dietary: ['Coeliac', 'Lactose free'] })).toEqual([
      { text: 'Vegan please', severity: 'dietary' },
      { text: 'Coeliac', severity: 'allergy' },
      { text: 'Lactose free', severity: 'dietary' },
    ]);
    expect(orderDietFlags({ note: 'Window table' }, null)).toEqual([]);
  });
});

describe('amendments', () => {
  it('lists items removed by voids', () => {
    const o = order({
      lines: [line('a', 'toast', { name: 'French Toast', qty: 1 })],
      refunds: [{ key: 'R1', mode: 'void', amount: 0, alloc: [], reason: '', by: '', approver: '', at: '', items: { a: 1, gone: 2 } }],
    });
    expect(removedItems(o)).toEqual(['1× French Toast', '2 items']);
  });
});
