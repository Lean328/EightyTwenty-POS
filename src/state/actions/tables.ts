// Floor plan: which tables are occupied, moving / joining / separating tabs, seating reservations.
import { tablesOf } from '../../domain/policies';
import type { Order, Reservation } from '../../domain/types';
import type { PosStore } from '../store';
import { note, setOrder } from './orders';

/** Table id → the open order seated there, for the till's café. */
export function occupancy(store: PosStore): Record<string, Order> {
  const s = store.state,
    map: Record<string, Order> = {};
  s.orders.forEach((o) => {
    if (o.cafe !== s.cafe || o.cleared || ['cancelled', 'refunded', 'failed'].includes(o.status)) return;
    if (o.paid && o.status === 'completed' && !tablesOf(o).length) return;
    tablesOf(o).forEach((t) => {
      map[t] = o;
    });
  });
  return map;
}

function sendTables(store: PosStore, id: string): void {
  const o = store.state.orders.find((x) => x.id === id);
  if (o) store.send({ type: 'order.tables', orderId: id, table: o.table, tables: tablesOf(o), cleared: o.cleared });
}

export function moveTable(store: PosStore, id: string, to: string): void {
  setOrder(store, id, (o) => ({
    ...o,
    table: to,
    tables: [to, ...tablesOf(o).filter((t) => t !== o.table && t !== to)],
    history: note(o, `Moved to ${to}`),
  }));
  sendTables(store, id);
  store.say(`Moved to ${to}`);
  store.setState({ dlg: null });
}

export function joinTable(store: PosStore, id: string, t: string): void {
  setOrder(store, id, (o) => ({ ...o, tables: [...new Set([...tablesOf(o), t])], history: note(o, `Joined ${t}`) }));
  sendTables(store, id);
  store.say(`${t} joined`);
}

export function separateTable(store: PosStore, id: string, t: string): void {
  setOrder(store, id, (o) => ({ ...o, tables: tablesOf(o).filter((x) => x !== t), history: note(o, `Separated ${t}`) }));
  sendTables(store, id);
  store.say(`${t} separated`);
}

export function clearTable(store: PosStore, id: string): void {
  const before = store.state.orders.find((x) => x.id === id)?.status;
  setOrder(store, id, (o) => ({
    ...o,
    cleared: true,
    status: o.status === 'ready' || o.status === 'preparing' ? o.status : 'completed',
    history: note(o, 'Table marked available'),
  }));
  sendTables(store, id);
  const after = store.state.orders.find((x) => x.id === id)?.status;
  if (after && after !== before) store.send({ type: 'order.status', orderId: id, status: after, note: 'Table marked available' });
  store.setState({ dlg: null });
  store.say('Table available');
}

export function seatReservation(store: PosStore, r: Reservation, tableId: string): void {
  const updated: Reservation = { ...r, status: 'completed', table: tableId };
  store.setState((s) => ({
    reservations: s.reservations.map((x) => (x.id === r.id ? updated : x)),
    view: 'till',
    type: 'dinein',
    table: tableId,
    customerId: r.customerId || null,
    dlg: null,
  }));
  store.send({ type: 'reservation.upsert', reservation: updated });
  store.say(`${r.name} seated at ${tableId}`);
}
