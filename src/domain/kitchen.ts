// Kitchen display rules: station routing, line-level preparation, preparation eligibility, timers and dietary alerts.
// Pure functions over the shared order model — the kitchen display keeps no orders of its own.
import type { Customer, MenuItem, Order, OrderLine, OrderStatus, PrepStatus, Station } from './types';

export type StationFilter = 'all' | Station;

export const STATIONS: Station[] = ['kitchen', 'bar'];
export const STATION_LABEL: Record<Station, string> = { kitchen: 'Kitchen', bar: 'Barista' };
export const STATION_FILTER_LABEL: Record<StationFilter, string> = {
  all: 'All stations',
  kitchen: 'Food · Kitchen',
  bar: 'Drinks · Barista',
};

/** Menu categories made at the coffee / drinks bar. Everything else is made in the kitchen. */
export const BAR_CATEGORIES: ReadonlySet<string> = new Set(['coffee', 'cold', 'smoothies', 'juices']);

/** Where an item is prepared. An explicit `station` on the menu item wins over its category. Unknown items go to the kitchen. */
export const stationOf = (item: Pick<MenuItem, 'cat' | 'station'> | undefined): Station =>
  item?.station ?? (item && BAR_CATEGORIES.has(item.cat) ? 'bar' : 'kitchen');

export const lineStation = (l: Pick<OrderLine, 'itemId'>, menuById: Record<string, MenuItem>): Station => stationOf(menuById[l.itemId]);

export const inStation = (station: StationFilter, l: Pick<OrderLine, 'itemId'>, menuById: Record<string, MenuItem>): boolean =>
  station === 'all' || lineStation(l, menuById) === station;

// ---------- line preparation ----------

/** The kitchen display has recorded progress on at least one line of this order. */
export const isTracked = (o: Pick<Order, 'lines'>): boolean => o.lines.some((l) => !!l.prep);

/**
 * Effective preparation state of a line.
 * - A ready or completed order is ready throughout (the front counter can mark a whole order ready).
 * - Lines the kitchen has touched carry their own state.
 * - On an order the kitchen has not touched yet, lines follow the order status.
 * - A line without state on a tracked order was added after the kitchen started, so it has not been started.
 */
export function linePrep(o: Pick<Order, 'status' | 'lines'>, l: Pick<OrderLine, 'prep'>): PrepStatus {
  if (o.status === 'ready' || o.status === 'completed') return 'ready';
  if (l.prep) return l.prep;
  if (isTracked(o)) return 'new';
  return o.status === 'preparing' ? 'preparing' : 'new';
}

/** Combined state of a set of line states: null when there are none. */
export function combinedPrep(preps: PrepStatus[]): PrepStatus | null {
  if (!preps.length) return null;
  if (preps.every((p) => p === 'ready')) return 'ready';
  if (preps.every((p) => p === 'new')) return 'new';
  return 'preparing';
}

/** Preparation state of an order at one station (or across all), or null when the order has nothing for it. */
export function stationPrep(
  o: Pick<Order, 'status' | 'lines'>,
  station: StationFilter,
  menuById: Record<string, MenuItem>,
): PrepStatus | null {
  return combinedPrep(o.lines.filter((l) => inStation(station, l, menuById)).map((l) => linePrep(o, l)));
}

/** Stations an order needs, in display order. */
export const stationsOf = (o: Pick<Order, 'lines'>, menuById: Record<string, MenuItem>): Station[] =>
  STATIONS.filter((st) => o.lines.some((l) => lineStation(l, menuById) === st));

/**
 * Order status implied by its line states. An order is ready only when every line at every station is ready;
 * once any line has started it is preparing.
 */
export function statusFromLines(current: OrderStatus, preps: PrepStatus[]): OrderStatus {
  const all = combinedPrep(preps);
  if (all === 'ready') return 'ready';
  if (all === 'new') return current === 'new' ? 'new' : 'preparing';
  return all ? 'preparing' : current;
}

// ---------- eligibility ----------

export type PrepHold = 'payment-failed' | 'awaiting-acceptance' | 'unpaid-online';

export const PREP_HOLD_MESSAGE: Record<PrepHold, string> = {
  'payment-failed': 'Payment not captured — do not prepare',
  'awaiting-acceptance': 'Waiting for the counter to accept this order',
  'unpaid-online': 'Online order not paid — do not prepare',
};

/**
 * Why an order on the kitchen board must not be prepared yet, or null when it may.
 * Website and app orders are prepared only once paid and accepted. Till orders may be open tabs (pay later),
 * which the till sends to the kitchen deliberately.
 */
export function prepHold(o: Pick<Order, 'status' | 'accepted' | 'channel' | 'paid'>): PrepHold | null {
  if (o.status === 'failed') return 'payment-failed';
  if (o.accepted === false) return 'awaiting-acceptance';
  if (o.channel !== 'pos' && !o.paid) return 'unpaid-online';
  return null;
}

/** Statuses the kitchen can still change. */
export const isPreparable = (o: Pick<Order, 'status'>): boolean => o.status === 'new' || o.status === 'preparing' || o.status === 'ready';

/**
 * On a station's active board: not yet ready, and with items for that station still to make.
 * Across all stations an order stays on the board until the order itself is ready.
 */
export function isOnBoard(o: Pick<Order, 'status' | 'lines'>, station: StationFilter, menuById: Record<string, MenuItem>): boolean {
  if (o.status !== 'new' && o.status !== 'preparing' && o.status !== 'failed') return false;
  const p = stationPrep(o, station, menuById);
  return p !== null && (station === 'all' || p !== 'ready');
}

// ---------- timers ----------

/** Minutes after which a ticket is shown as running late, then overdue. */
export const PREP_TARGETS: Record<Station, { warn: number; late: number }> = {
  kitchen: { warn: 10, late: 15 },
  bar: { warn: 4, late: 7 },
};

export type Urgency = 'ok' | 'warn' | 'late';

/** When the order was placed, in epoch ms. Uses `placedAt`, else today's `time` (yesterday if that is far in the future). */
export function placedAtMs(o: Pick<Order, 'placedAt' | 'time'>, now: number): number {
  const exact = o.placedAt ? Date.parse(o.placedAt) : NaN;
  if (!Number.isNaN(exact)) return exact;
  const [h, m] = o.time.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h || 0, m || 0, 0, 0);
  // Past midnight, an order from late yesterday reads as later today.
  if (d.getTime() - now > 12 * 3_600_000) d.setDate(d.getDate() - 1);
  return d.getTime();
}

/** Elapsed ms since the order was placed (never negative: clock skew shows 0). */
export const elapsedMs = (o: Pick<Order, 'placedAt' | 'time'>, now: number): number => Math.max(0, now - placedAtMs(o, now));

/** Urgency for the stations involved. Mixed orders use the longest target (the kitchen sets the pace). */
export function urgencyOf(ms: number, stations: Station[]): Urgency {
  const t = (stations.length ? stations : STATIONS).map((st) => PREP_TARGETS[st]);
  const min = ms / 60_000;
  if (min >= Math.max(...t.map((x) => x.late))) return 'late';
  if (min >= Math.max(...t.map((x) => x.warn))) return 'warn';
  return 'ok';
}

/** 7:05, 12:40, 1:02:09 */
export function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

// ---------- dietary and allergy alerts ----------

/** Words that make a note, adjustment or profile entry an allergy (shown in red). */
const ALLERGY_RX = /allerg|anaphyla|epi-?pen|coeliac|celiac|\bnuts?\b|peanut|sesame|shellfish/i;
/** Words that make it a dietary requirement. */
const DIET_RX = /gluten|\bgfo?\b|dairy|lactose|\bdf\b|\beggs?\b|\bsoy\b|vegan|vegetarian|halal|kosher|no (?:meat|pork|beef)/i;
/** Modifier choices that are dietary versions of the dish (not ordinary add-ons such as an extra egg). */
const DIET_MOD_RX = /gluten|\bgfo?\b|dairy free|vegan/i;

export type DietSeverity = 'allergy' | 'dietary';

export interface DietFlag {
  text: string;
  severity: DietSeverity;
}

const severityOf = (text: string): DietSeverity | null => (ALLERGY_RX.test(text) ? 'allergy' : DIET_RX.test(text) ? 'dietary' : null);

const flag = (text: string): DietFlag | null => {
  const severity = severityOf(text);
  return severity ? { text, severity } : null;
};

/** Dietary flags on one line: adjustments (No dairy, GFO…), dietary modifier choices and a dietary note. */
export function lineDietFlags(l: Pick<OrderLine, 'adjust' | 'sel' | 'note'>): DietFlag[] {
  const mods = Object.values(l.sel || {})
    .flat()
    .filter((m) => DIET_MOD_RX.test(m))
    .map((m): DietFlag => ({ text: m, severity: severityOf(m) || 'dietary' }));
  const out = [...(l.adjust || []).map(flag), ...mods, l.note ? flag(l.note) : null].filter((x): x is DietFlag => !!x);
  return dedupe(out);
}

/** Order-level alerts: a dietary order note and the customer's dietary profile. */
export function orderDietFlags(o: Pick<Order, 'note'>, customer?: Pick<Customer, 'dietary'> | null): DietFlag[] {
  const out = [o.note ? flag(o.note) : null, ...(customer?.dietary || []).map((d) => flag(d) || { text: d, severity: 'dietary' as const })];
  return dedupe(out.filter((x): x is DietFlag => !!x));
}

const dedupe = (flags: DietFlag[]): DietFlag[] => {
  const seen = new Set<string>();
  return flags.filter((f) => {
    const k = f.text.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ---------- amendments ----------

/** Items removed from the order after it was sent (voids), as "1× Latte" — names come from lines still on the order. */
export function removedItems(o: Pick<Order, 'refunds' | 'lines'>): string[] {
  return (o.refunds || [])
    .filter((r) => r.mode === 'void')
    .flatMap((r) =>
      Object.entries(r.items || {})
        .filter(([, q]) => q > 0)
        .map(([key, q]) => {
          const l = o.lines.find((x) => x.key === key);
          return l ? `${q}× ${l.name}` : `${q} item${q === 1 ? '' : 's'}`;
        }),
    );
}
