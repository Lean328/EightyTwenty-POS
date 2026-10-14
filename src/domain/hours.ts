// Opening hours + reservation slot rules, derived from each café's published hours string.
import type { Location } from './types';

/** Last booking 30 minutes before close. */
const LAST_BOOKING_MIN = 30;
const SLOT_MIN = 30;
/** Minimum booking notice. */
const NOTICE_HOURS = 12;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = (s: string): number | null => {
  const m = /(\d+):(\d+)(am|pm)/i.exec(s);
  if (!m) return null;
  let h = +m[1] % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + +m[2];
};
export const fmt = (min: number): string => {
  const h = Math.floor(min / 60),
    m = min % 60,
    ap = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${ap}`;
};
export const hm = (min: number): string => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const parseHM = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
/** "09:41" → "9:41am" */
export const fmtHM = (s: string): string => fmt(parseHM(s));

export interface OpeningHours {
  open: number;
  close: number;
}

/** Hours for a JS day (0 = Sunday), in minutes; null when closed. */
export function hoursFor(loc: Location | undefined, day: number): OpeningHours | null {
  if (!loc || loc.tbc) return null;
  const h = loc.hours;
  if (/Mon–Fri/.test(h) && (day === 0 || day === 6)) return null;
  const m = /(\d+:\d+(?:am|pm))\s*–\s*(\d+:\d+(?:am|pm))/i.exec(h);
  if (!m) return null;
  const open = toMin(m[1]),
    close = toMin(m[2]);
  return open == null || close == null ? null : { open, close };
}

export const dayName = (d: number): string => DAYS[d];

export interface BookingSlot {
  time: string;
  label: string;
  booked: number;
  available: boolean;
  reason: string;
  left: number;
}

/** Booking slots for a date. `taken` = {HH:MM: guests booked}. Capacity caps guests per slot. */
export function slots(
  loc: Location | undefined,
  date: Date,
  taken: Record<string, number> = {},
  capacity = 16,
  now = new Date(),
): BookingSlot[] {
  const h = hoursFor(loc, date.getDay());
  if (!h) return [];
  const out: BookingSlot[] = [];
  const noticeCut = new Date(now.getTime() + NOTICE_HOURS * 3600e3);
  for (let t = h.open; t <= h.close - LAST_BOOKING_MIN; t += SLOT_MIN) {
    const when = new Date(date);
    when.setHours(0, t, 0, 0);
    const booked = taken[hm(t)] || 0;
    let reason = '';
    if (when < noticeCut) reason = 'Too soon';
    else if (booked >= capacity) reason = 'Full';
    out.push({ time: hm(t), label: fmt(t), booked, available: !reason, reason, left: Math.max(0, capacity - booked) });
  }
  return out;
}

export const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const niceDate = (s: string): string => {
  const d = new Date(s + 'T00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
};
