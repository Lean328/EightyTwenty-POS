// Kitchen display: line-level preparation on the shared orders, and assigning this device to the counter or the kitchen.
// Every change goes through the same store and outbox as the till, as an idempotent `order.prep` command.
import {
  isPreparable,
  inStation,
  linePrep,
  PREP_HOLD_MESSAGE,
  prepHold,
  STATION_FILTER_LABEL,
  STATION_LABEL,
  stationPrep,
  statusFromLines,
  type StationFilter,
} from '../../domain/kitchen';
import type { Order, PrepStatus } from '../../domain/types';
import type { PosStore } from '../store';
import type { DeviceMode, DeviceSetup } from '../types';
import { onRoute, requireSignIn } from './auth';
import { note } from './orders';

const READY_LABEL = (o: Order) => (o.type === 'delivery' ? 'Out for delivery' : 'Ready for pickup');

/**
 * A second tap on the same control this soon after it changed a ticket is ignored. On a touchscreen a double tap
 * would otherwise land on the button that just replaced the first one (Start → Ready) and skip a step.
 */
const TAP_GUARD_MS = 700;
const lastTaps = new WeakMap<PosStore, Map<string, number>>();

function tapGuarded(store: PosStore, control: string): boolean {
  const at = lastTaps.get(store)?.get(control);
  return at !== undefined && Date.now() - at < TAP_GUARD_MS;
}

function tapDone(store: PosStore, control: string, changed: boolean): boolean {
  if (changed) {
    const taps = lastTaps.get(store) ?? new Map<string, number>();
    taps.set(control, Date.now());
    lastTaps.set(store, taps);
  }
  return changed;
}

const bumpControl = (orderId: string, station: StationFilter) => `${orderId}|${station}`;
const where = (station: StationFilter) => (station === 'all' ? 'Kitchen' : STATION_LABEL[station]);

/** Why the signed-in staff member cannot change this order right now, or '' when they can. */
function blocked(store: PosStore, o: Order | undefined): string {
  if (!store.can('kitchen')) return 'Sign in with a kitchen PIN to update tickets';
  if (!o) return 'This order is no longer on the board';
  if (o.status !== 'failed' && !isPreparable(o)) return `${o.id} is ${o.status} — no change made`;
  const hold = prepHold(o);
  return hold ? `${o.id}: ${PREP_HOLD_MESSAGE[hold]}` : '';
}

/**
 * Write new line states (and the order status they imply) to the shared order.
 * Returns false when nothing changed, which is how repeated taps become no-ops.
 */
function commitPrep(store: PosStore, o: Order, next: PrepStatus[], what: string): boolean {
  const current = o.lines.map((l) => linePrep(o, l));
  const status = statusFromLines(o.status, next);
  if (status === o.status && next.every((p, i) => p === current[i])) return false;
  const lines = o.lines.map((l, i) => ({ ...l, prep: next[i] }));
  const becameReady = status === 'ready' && o.status !== 'ready';
  const notified = becameReady && o.channel !== 'pos' ? ` · customer notified via ${o.channel === 'app' ? 'app' : 'email'}` : '';
  const text = `${becameReady ? READY_LABEL(o) : what}${notified} · ${store.staff().name}`;
  store.setState((s) => ({ orders: s.orders.map((x) => (x.id === o.id ? { ...x, lines, status, history: note(x, text) } : x)) }));
  store.send({ type: 'order.prep', orderId: o.id, lines: lines.map((l) => ({ key: l.key, prep: l.prep })), status, note: text });
  return true;
}

/**
 * Advance one station's part of a ticket: not started → preparing → ready.
 * `seen` is the state the screen showed when tapped. If the ticket has moved on since (another tap, another
 * device, the counter), the tap is ignored rather than applied to a state the cook never saw.
 */
export function bumpStation(store: PosStore, orderId: string, station: StationFilter, seen: PrepStatus): boolean {
  const control = bumpControl(orderId, station);
  if (tapGuarded(store, control)) return false;
  const o = store.state.orders.find((x) => x.id === orderId);
  const why = blocked(store, o);
  if (why || !o) {
    store.say(why);
    return false;
  }
  const { menuById } = store.state.catalog;
  const now = stationPrep(o, station, menuById);
  if (now === null) return false;
  const to: PrepStatus = seen === 'new' ? 'preparing' : 'ready';
  if (now !== seen) {
    // Already where this tap would take it (double tap) → quietly do nothing; anything else → say so.
    if (now !== to) store.say(`${o.id} was updated — check the ticket again`);
    return false;
  }
  const next = o.lines.map((l) => {
    const p = linePrep(o, l);
    if (!inStation(station, l, menuById)) return p;
    return to === 'preparing' ? (p === 'new' ? 'preparing' : p) : 'ready';
  });
  return tapDone(store, control, commitPrep(store, o, next, `${where(station)} ${to === 'preparing' ? 'started' : 'ready'}`));
}

/** Tick one item ready, or untick it back to preparing. `seen` guards against acting on a stale screen. */
export function toggleLine(store: PosStore, orderId: string, key: string, seen: PrepStatus): boolean {
  const control = `${orderId}|line|${key}`;
  if (tapGuarded(store, control)) return false;
  const o = store.state.orders.find((x) => x.id === orderId);
  const why = blocked(store, o);
  if (why || !o) {
    store.say(why);
    return false;
  }
  const i = o.lines.findIndex((l) => l.key === key);
  if (i < 0) {
    store.say(`That item was removed from ${o.id}`);
    return false;
  }
  const now = linePrep(o, o.lines[i]);
  const to: PrepStatus = seen === 'ready' ? 'preparing' : 'ready';
  if (now !== seen) {
    if (now !== to) store.say(`${o.id} was updated — check the ticket again`);
    return false;
  }
  const next = o.lines.map((l, j) => (j === i ? to : linePrep(o, l)));
  return tapDone(
    store,
    control,
    commitPrep(store, o, next, `${o.lines[i].qty}× ${o.lines[i].name} ${to === 'ready' ? 'ready' : 'back to preparing'}`),
  );
}

/** Bring a ticket back from ready to preparing at a station (made wrong, dropped, customer changed it). */
export function recallTicket(store: PosStore, orderId: string, station: StationFilter): boolean {
  const control = bumpControl(orderId, station);
  if (tapGuarded(store, control)) return false;
  const o = store.state.orders.find((x) => x.id === orderId);
  const why = blocked(store, o);
  if (why || !o) {
    store.say(why);
    return false;
  }
  const { menuById } = store.state.catalog;
  if (stationPrep(o, station, menuById) !== 'ready') return false;
  const next = o.lines.map((l) => (inStation(station, l, menuById) ? 'preparing' : linePrep(o, l)));
  const done = tapDone(store, control, commitPrep(store, o, next, `Recalled to ${where(station).toLowerCase()}`));
  if (done) store.say(`${o.id} recalled — back on the board`);
  return done;
}

/** Every line is ready but the order is not (e.g. the unfinished items were voided): send it to pickup. */
export function finishTicket(store: PosStore, orderId: string): boolean {
  const control = bumpControl(orderId, 'all');
  if (tapGuarded(store, control)) return false;
  const o = store.state.orders.find((x) => x.id === orderId);
  const why = blocked(store, o);
  if (why || !o) {
    store.say(why);
    return false;
  }
  const next = o.lines.map((l) => linePrep(o, l));
  if (!next.every((p) => p === 'ready')) return false;
  return tapDone(store, control, commitPrep(store, o, next, READY_LABEL(o)));
}

// ---------- device setup ----------

export const DEVICE_MODE_LABEL: Record<DeviceMode, string> = { counter: 'Front counter', kitchen: 'Kitchen display' };

/** Assign this device to the front counter or the kitchen. Needs the `devices` permission (manager PIN otherwise). */
export function assignDevice(store: PosStore, mode: DeviceMode, station: StationFilter = store.state.device.station): void {
  const what =
    mode === 'kitchen'
      ? `Use this device as the kitchen display (${STATION_FILTER_LABEL[station]})`
      : 'Use this device as a front counter till';
  store.approve('devices', 'Device setup', `${what} needs a manager PIN.`, (approver) => {
    const by = (approver || store.staff()).name;
    const device: DeviceSetup = { ...store.state.device, mode, station, by, at: new Date().toISOString() };
    store.setState({ device, dlg: null });
    store.logAudit('Device assigned', `${DEVICE_MODE_LABEL[mode]}${mode === 'kitchen' ? ' · ' + STATION_FILTER_LABEL[station] : ''}`, {
      area: 'Devices',
      approver: approver ? approver.name : '',
    });
    if (mode === 'counter') onRoute(store);
    // The person signed in may not be allowed on the new screen: ask for a PIN that is.
    if (!store.can(mode === 'kitchen' ? 'kitchen' : 'pos')) requireSignIn(store);
    store.say(`This device is now ${mode === 'kitchen' ? 'the kitchen display' : 'a front counter till'}`);
  });
}

/** Which station's items this kitchen screen shows. Kitchen staff may change it (e.g. one tablet covering both). */
export function setStation(store: PosStore, station: StationFilter): void {
  if (store.state.device.station === station) return;
  store.setState((s) => ({ device: { ...s.device, station } }));
}

export function toggleMute(store: PosStore): void {
  store.setState((s) => ({ device: { ...s.device, muted: !s.device.muted } }));
}

/** Sign the current person out of the kitchen display; the next person signs in with their PIN. */
export function lockKitchen(store: PosStore): void {
  store.setState({ staffId: '' });
  requireSignIn(store);
}
