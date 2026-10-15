// Watches the shared orders on behalf of one kitchen screen: plays a sound and marks tickets as new when they
// arrive, and raises an alert when a ticket being prepared is cancelled or has items removed.
// It subscribes to the store directly (not from render), so sounds play once per change.
import { isOnBoard, removedItems } from '../../domain/kitchen';
import type { Order } from '../../domain/types';
import type { PosStore } from '../../state/store';
import { Chime } from './chime';

export interface KitchenAlert {
  key: string;
  orderId: string;
  kind: 'cancelled' | 'changed';
  text: string;
}

export interface MonitorSnapshot {
  /** Order id → when this screen first showed it (epoch ms). */
  firstSeen: Readonly<Record<string, number>>;
  alerts: readonly KitchenAlert[];
}

const voids = (o: Order) => (o.refunds || []).filter((r) => r.mode === 'void').length;

export class KitchenMonitor {
  readonly chime = new Chime();
  private snap: MonitorSnapshot = { firstSeen: {}, alerts: [] };
  private listeners = new Set<() => void>();
  /** Orders this screen has already announced (null until the first look, which announces nothing). */
  private known: Set<string> | null = null;
  /** Orders on the board at the last look → number of voids then. */
  private board = new Map<string, number>();
  private scope = '';
  private readonly store: PosStore;

  constructor(store: PosStore) {
    this.store = store;
  }

  start = (): (() => void) => {
    this.check();
    const off = this.store.subscribe(this.check);
    return () => {
      off();
      this.chime.close();
    };
  };

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): MonitorSnapshot => this.snap;

  dismiss = (key: string): void => this.set({ ...this.snap, alerts: this.snap.alerts.filter((a) => a.key !== key) });

  private set(next: MonitorSnapshot): void {
    this.snap = next;
    this.listeners.forEach((l) => l());
  }

  private check = (): void => {
    const s = this.store.state;
    if (s.phase !== 'ready') return;
    const { menuById } = s.catalog;
    const station = s.device.station;
    const ordersHere = s.orders.filter((o) => o.cafe === s.cafe);
    const onBoard = ordersHere.filter((o) => isOnBoard(o, station, menuById));
    const scope = `${s.cafe}|${station}`;

    // First look, or a different café / station: everything showing is already known.
    if (!this.known || scope !== this.scope) {
      this.scope = scope;
      this.known = new Set(ordersHere.filter((o) => isOnBoard(o, 'all', menuById)).map((o) => o.id));
      this.board = new Map(onBoard.map((o) => [o.id, voids(o)]));
      return;
    }

    const now = Date.now();
    const arrived = onBoard.filter((o) => !this.known!.has(o.id));
    arrived.forEach((o) => this.known!.add(o.id));

    const alerts: KitchenAlert[] = [];
    this.board.forEach((voidCount, id) => {
      const o = s.orders.find((x) => x.id === id);
      if (!o) return;
      if (o.status === 'cancelled' || o.status === 'refunded')
        alerts.push({ key: `${id}:cancelled`, orderId: id, kind: 'cancelled', text: `${id} was cancelled — stop preparing it` });
      else if (voids(o) > voidCount)
        alerts.push({
          key: `${id}:changed:${voids(o)}`,
          orderId: id,
          kind: 'changed',
          text: `${id} changed — removed so far: ${removedItems(o).join(', ') || 'items'}`,
        });
    });
    this.board = new Map(onBoard.map((o) => [o.id, voids(o)]));

    if (!arrived.length && !alerts.length) return;
    if (!s.device.muted) this.chime.play(alerts.length ? 'change' : 'new');
    const firstSeen: Record<string, number> = {};
    for (const o of onBoard) {
      const at = this.snap.firstSeen[o.id] ?? (arrived.includes(o) ? now : undefined);
      if (at) firstSeen[o.id] = at;
    }
    const keep = this.snap.alerts.filter((a) => !alerts.some((b) => b.key === a.key));
    this.set({ firstSeen, alerts: [...alerts, ...keep].slice(0, 6) });
  };
}
