// Connectivity and sync: offline queue, delivery to the backend, conflicts found when coming back online.
import { uid, stamp } from '../../lib/ids';
import type { PosStore } from '../store';
import { note } from './orders';

export function setOnline(store: PosStore, on: boolean): void {
  if (on === store.state.online) return;
  store.setState({ online: on });
  store.logAudit(on ? 'Connection restored' : 'Connection lost', on ? 'Back online' : 'Working offline — cash sales queue locally', {
    area: 'Sync',
  });
  if (on) setTimeout(() => void runSync(store), 300);
  else {
    store.outbox.setOnline(false);
    store.say('Offline · cash sales will queue and sync later');
  }
}

const log = (store: PosStore, msg: string) =>
  store.setState((s) => ({ syncLog: [{ id: uid('L'), at: stamp(), msg }, ...(s.syncLog || [])].slice(0, 50) }));

/** Deliver everything queued on this till, flagging orders that sold out while the till was offline. */
export async function runSync(store: PosStore): Promise<void> {
  const s = store.state;
  if (!s.online) return store.say('Still offline — nothing synced');
  const sold = new Set(s.soldOut || []);
  const conflicts = [...(s.conflicts || [])];
  const n = s.queue.length;
  s.queue.forEach((q) => {
    const o = s.orders.find((x) => x.id === q.orderId);
    const bad = o && o.lines.find((l) => sold.has(l.itemId));
    if (o && bad && !conflicts.some((c) => c.orderId === o.id))
      conflicts.push({
        id: uid('C'),
        orderId: o.id,
        msg: `${o.id} includes ${bad.name}, marked sold out while offline. Confirm it was served or cancel it.`,
      });
  });
  store.setState({ conflicts });
  store.outbox.setOnline(true);
  const res = await store.outbox.flush();
  if (res.error) {
    log(store, `Sync paused · ${res.waiting} waiting · ${res.error.message}`);
    store.say('Could not reach the server — the till will keep retrying');
    return;
  }
  store.setState((st) => ({
    orders: st.orders.map((o) => (o.queued ? { ...o, queued: false, history: note(o, 'Synced to head office') } : o)),
  }));
  log(store, `Synced ${n} item${n === 1 ? '' : 's'}${conflicts.length ? ' · ' + conflicts.length + ' need attention' : ''}`);
  store.say(n ? `Synced ${n} item${n === 1 ? '' : 's'}` : 'Everything is up to date');
}

export function resolveConflict(store: PosStore, id: string): void {
  store.setState((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id) }));
  store.logAudit('Sync conflict resolved', id, { area: 'Sync' });
}

/** Pick up website and app orders that arrived at the backend (http provider only). */
export async function pullRemoteOrders(store: PosStore, cursor: string | null): Promise<string | null> {
  if (!store.state.online || store.backend.kind !== 'http') return cursor;
  try {
    const res = await store.backend.orders.listChanged(store.state.cafe, cursor);
    if (res.orders.length) {
      const pendingIds = new Set(
        store.outbox.pending.flatMap((e) =>
          'orderId' in e.command ? [e.command.orderId] : 'order' in e.command ? [e.command.order.id] : [],
        ),
      );
      store.setState((s) => {
        const byId = new Map(s.orders.map((o) => [o.id, o]));
        // Orders with changes still waiting in this till's outbox keep the local version until delivered.
        res.orders.forEach((o) => {
          if (!pendingIds.has(o.id)) byId.set(o.id, o);
        });
        const incoming = res.orders.filter((o) => !s.orders.some((x) => x.id === o.id));
        return { orders: [...incoming, ...s.orders.map((o) => byId.get(o.id) || o)] };
      });
    }
    return res.cursor;
  } catch {
    return cursor;
  }
}
