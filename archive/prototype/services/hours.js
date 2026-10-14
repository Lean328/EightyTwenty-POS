// Opening hours + reservation slot rules, derived from each café's published hours string.
export const LAST_BOOKING_MIN = 30;   // last booking 30 min before close
export const SLOT_MIN = 30;
export const NOTICE_HOURS = 12;       // minimum booking notice
export const MAX_GUESTS_ONLINE = 10;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = s => { const m = /(\d+):(\d+)(am|pm)/i.exec(s); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
export const fmt = min => { const h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'pm' : 'am'; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${ap}`; };
export const hm = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const parseHM = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

/** Hours for a given JS day (0=Sun). Returns {open, close} in minutes or null when closed. */
export function hoursFor(loc, day) {
  if (!loc || loc.tbc) return null;
  const h = loc.hours;
  if (/Mon–Fri/.test(h) && (day === 0 || day === 6)) return null;
  const m = /(\d+:\d+(?:am|pm))\s*–\s*(\d+:\d+(?:am|pm))/i.exec(h);
  if (!m) return null;
  return { open: toMin(m[1]), close: toMin(m[2]) };
}

export const dayName = d => DAYS[d];

/** Is the café open at a given date + HH:MM? */
export function isOpen(loc, date, time) {
  const h = hoursFor(loc, date.getDay());
  if (!h) return { open: false, reason: `${loc.name} is closed on ${DAYS[date.getDay()]}s` };
  const t = parseHM(time);
  if (t < h.open || t > h.close) return { open: false, reason: `Outside service hours (${fmt(h.open)} – ${fmt(h.close)})` };
  return { open: true };
}

/**
 * Booking slots for a date. `taken` = {time: guestsBooked}. Capacity caps guests per slot.
 */
export function slots(loc, date, taken = {}, capacity = 16, now = new Date()) {
  const h = hoursFor(loc, date.getDay());
  if (!h) return [];
  const out = [];
  const noticeCut = new Date(now.getTime() + NOTICE_HOURS * 3600e3);
  for (let t = h.open; t <= h.close - LAST_BOOKING_MIN; t += SLOT_MIN) {
    const when = new Date(date); when.setHours(0, t, 0, 0);
    const booked = taken[hm(t)] || 0;
    let reason = '';
    if (when < noticeCut) reason = 'Too soon';
    else if (booked >= capacity) reason = 'Full';
    out.push({ time: hm(t), label: fmt(t), booked, available: !reason, reason, left: Math.max(0, capacity - booked) });
  }
  return out;
}

export const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const niceDate = s => { const d = new Date(s + 'T00:00'); return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }); };
