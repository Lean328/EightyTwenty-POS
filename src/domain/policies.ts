// Operational policy constants: reason lists, order state flow, stock thresholds.
import type { Order, OrderStatus, StockItem, StockState } from './types';

export const REFUND_REASONS = [
  'Wrong item made',
  'Customer changed mind',
  'Quality issue',
  'Long wait',
  'Allergen concern',
  'Duplicate charge',
];
export const VOID_REASONS = ['Entered by mistake', 'Out of stock', 'Customer changed order', 'Kitchen error'];
export const CANCEL_REASONS = ['Customer cancelled', 'Café too busy', 'Item unavailable', 'Payment not captured'];
export const CASH_IN_REASONS = ['Float top-up', 'Change from bank'];
export const CASH_OUT_REASONS = ['Supplier paid in cash', 'Banking drop', 'Petty cash'];
export const STOCK_REASONS = ['Delivery received', 'Wastage', 'Stock count', 'Transfer to another café'];
export const DIETARY_ADJUST = ['No dairy', 'No gluten (GFO)', 'No nuts', 'No egg', 'Extra hot', 'Decaf'];

/** Reservation capacity per 30-minute slot (guests). */
export const SLOT_CAPACITY = 16;

/** Kitchen flow: what each status advances to. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = { new: 'preparing', preparing: 'ready', ready: 'completed' };

/** Orders still in play on the kitchen screen. */
export const isLive = (o: Pick<Order, 'status'>): boolean => ['new', 'preparing', 'ready', 'failed'].includes(o.status);
/** Live count used on the till and navigation badges (excludes failed online orders). */
export const isActive = (o: Pick<Order, 'status'>): boolean => ['new', 'preparing', 'ready'].includes(o.status);
export const isIncoming = (o: Pick<Order, 'status' | 'accepted'>): boolean => o.status === 'new' && o.accepted === false;

export const stockState = (s: Pick<StockItem, 'level' | 'par'>): StockState =>
  s.level <= 0 ? 'out' : s.level < s.par * 0.5 ? 'low' : 'ok';

/** Modifier options that switch off automatically when an ingredient runs out. */
export const INGREDIENT_MODS: Record<string, string[]> = {
  oat: ['OAT ADC'],
  bonsoy: ['Bonsoy'],
  gfbun: ['Gluten Free Bun'],
  salmon: ['Smoked Salmon'],
  milk: ['Full Cream'],
};

export const tablesOf = (o: Pick<Order, 'tables' | 'table'>): string[] => [
  ...new Set([...(o.tables || []), ...(o.table ? [o.table] : [])]),
];

export const CHANNEL_LABEL = { pos: 'POS', web: 'Website', app: 'App' } as const;
export const ORDER_TYPE_LABEL = { dinein: 'Dine in', pickup: 'Pickup', takeaway: 'Takeaway', delivery: 'Delivery' } as const;
export const SOURCE_LABEL = CHANNEL_LABEL;
