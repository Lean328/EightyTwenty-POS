import { getStaffToken } from '../services/http/staffSession';
import { refreshCustomerLoyalty } from './actions/loyaltySync';
import { reconcileGiftResponse, updateGiftPendingDialog } from './actions/giftCards';
// The till's state container. Holds the working copy of shared records plus this device's session,
// applies changes synchronously, persists them, and sends every business change to the backend as a command.
import type { AppConfig } from '../config/env';
import { hasPermission, sanitizeRoles } from '../domain/permissions';
import type { AuditEntry, Permission, StaffMember } from '../domain/types';
import { readJSON, writeJSON } from '../lib/storage';
import { stamp, uid } from '../lib/ids';
import type { PosBackend, PosSnapshot } from '../services/contracts';
import type { PosCommand } from '../services/commands';
import type { DeviceHub } from '../services/devices';
import { ApiError } from '../services/http/httpClient';
import type { Outbox } from '../services/outbox';
import { readCachedSnapshot, writeCachedSnapshot } from '../services/recordCache';
import type { OpsUi, Patch, PosState } from './types';
import { initialState, sessionKeys, snapshotFromState, stateFromSnapshot, type SessionState } from './snapshot';
import { loadPosBootstrap } from '../services/http/posBootstrap';

export interface StoreDeps {
  backend: PosBackend;
  devices: DeviceHub;
  outbox: Outbox;
  config: AppConfig;
}

const SESSION_KEY = 'session';
const ORDER_SEQ_KEY = 'order-seq';
const RECORD_KEYS = [
  'orders',
  'customers',
  'giftcards',
  'reservations',
  'catering',
  'staff',
  'roles',
  'stock',
  'stockLog',
  'audit',
  'shift',
  'shifts',
  'soldOut',
  'branchOff',
  'unavailableMods',
  'availSync',
  'prices',
  'catOrder',
  'loy',
  'rules',
  'toggles',
  'cafeFields',
  'devices',
  'conflicts',
  'syncLog',
] as const satisfies readonly (keyof PosState)[];

export class PosStore {
  private st: PosState;
  private listeners = new Set<() => void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private persisted: Partial<PosState> = {};
  private persistStopped = false;
  private orderSeq = 0;
  private loyaltyRefresh = new Set<string>();
  private refreshingLoyalty = false;
  private loyaltyRefreshVersion = 0;
  private commandBatch: { command: PosCommand; label?: string }[] | null = null;
  private debounced = new Map<string, { timer: ReturnType<typeof setTimeout>; command: PosCommand }>();
  readonly backend: PosBackend;
  readonly devices: DeviceHub;
  readonly outbox: Outbox;
  readonly config: AppConfig;

  constructor(deps: StoreDeps) {
    this.backend = deps.backend;
    this.devices = deps.devices;
    this.outbox = deps.outbox;
    this.config = deps.config;
    const session = readJSON<Partial<SessionState>>(SESSION_KEY, {});
    this.st = initialState(session, deps.devices.initialStates());
    // Only re-render when the visible offline queue actually changes.
    this.outbox.onDelivered((entry, response) => reconcileGiftResponse(this, entry, response));
    let previousEntries = this.outbox.pending;
    this.outbox.subscribe(() => {
      if (this.backend.kind === 'http') {
        this.loyaltyRefreshVersion++;
        const outstanding = new Set([...this.outbox.pending, ...this.outbox.rejected].map((entry) => entry.id));
        for (const entry of previousEntries) {
          if (outstanding.has(entry.id)) continue;
          const command = entry.command;
          const customerId = command.type === 'loyalty.action' || command.type === 'loyalty.balance'
            ? command.customerId
            : command.type === 'order.create' ? command.order.customerId
              : command.type === 'payment.record' || command.type === 'order.adjust'
                ? this.st.orders.find((order) => order.id === command.orderId)?.customerId : undefined;
          if (customerId) this.loyaltyRefresh.add(customerId);
        }
        previousEntries = this.outbox.pending;
        // Subscribe after the current notification has finished, so it cannot invalidate its own read.
        if (this.loyaltyRefresh.size) queueMicrotask(() => { void this.refreshLoyaltyWhenIdle(); });
      }
      const queue = this.queueFromOutbox();
      // Re-render when rejection or blocking changes, even if visible queue IDs do not.
      this.setState({ queue });
      if (this.backend.kind === 'http') updateGiftPendingDialog(this);
    });
  }

  private async refreshLoyaltyWhenIdle(): Promise<void> {
    if (this.refreshingLoyalty || this.outbox.pending.length || this.outbox.rejected.length) return;
    this.refreshingLoyalty = true;
    const version = this.loyaltyRefreshVersion;
    try {
      for (const id of [...this.loyaltyRefresh]) {
        if (await refreshCustomerLoyalty(this, id)) this.loyaltyRefresh.delete(id);
      }
    } finally {
      this.refreshingLoyalty = false;
      // Retry a read invalidated by a newer command, without looping on network errors.
      if (this.loyaltyRefresh.size && version !== this.loyaltyRefreshVersion) {
        queueMicrotask(() => { void this.refreshLoyaltyWhenIdle(); });
      }
    }
  }

  // ---------- external store protocol (useSyncExternalStore) ----------

  get state(): PosState {
    return this.st;
  }
  getSnapshot = (): PosState => this.st;
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  setState(p: Patch | ((s: PosState) => Patch | null | undefined)): void {
    const patch = typeof p === 'function' ? p(this.st) : p;
    if (!patch) return;
    this.st = { ...this.st, ...patch };
    if (this.commandBatch) return;
    this.schedulePersist();
    this.listeners.forEach((l) => l());
  }

  /** Update back-office UI state. */
  setOps(p: Partial<OpsUi> | ((ops: OpsUi, s: PosState) => Partial<OpsUi>)): void {
    this.setState((s) => ({ ops: { ...s.ops, ...(typeof p === 'function' ? p(s.ops, s) : p) } }));
  }

  async loadBootstrap(): Promise<void> {
    const data = await loadPosBootstrap();

    // Frontend dùng slug làm mã chi nhánh trong các API POS.
    const cafeId = data.location.slug;

    const location = {
      id: cafeId,
      name: data.location.name,
      address: data.location.address,
      phone: '',
      hours: '',
      hoursShort: '',
      email: '',
      tbc: data.location.status !== 'open',
    };

    this.setState({
      catalog: {
        locations: [location],
        categories: data.categories,
        menu: data.menu,
        menuById: Object.fromEntries(data.menu.map((item) => [item.id, item])),
        cateringPackages: [],
        tables: [],
        promotions: [],
      },

      cafe: cafeId,
      cat: data.categories[0]?.id ?? '',
      catOrder: data.categories.map((category) => category.id),

      staff: [data.session.staff],
      staffId: data.session.staff.id,

      roles: {
        cashier: { label: 'Cashier', perms: [] },
        manager: { label: 'Manager', perms: [] },
        admin: { label: 'Admin', perms: [] },
        [data.session.staff.role]: {
          label: data.session.staff.role,
          perms: data.session.permissions,
        },
      },

      branchOff: {
        [cafeId]: data.unavailableItemIds,
      },
      soldOut: [],
      prices: {},
      unavailableMods: [],

      // Không mang giỏ hàng demo sang phiên dữ liệu thật.
      lines: [],
      customerId: null,
      discount: null,
      gift: null,
      table: '',
      note: '',
      held: [],

      // Clear records from the previous session before using live data.
      orders: [],
      customers: [],
      giftcards: [],
      reservations: [],
      catering: [],
      stock: [],
      stockLog: [],
      audit: [],
      shift: null,
      shifts: [],
      reports: null,
      selOrder: null,
      dlg: null,
    });
  }

  // ---------- lifecycle ----------

  async load(signal?: AbortSignal): Promise<void> {
    this.setState({ phase: 'loading', loadError: '' });
    let snap: PosSnapshot;
    let offlineSince: string | null = null;
    try {
      snap = await this.backend.loadSnapshot({ signal });
    } catch (e) {
      if (signal?.aborted) return;
      const cached = this.backend.kind === 'http' ? readCachedSnapshot() : null;
      if (cached && e instanceof ApiError && e.retryable) {
        snap = cached.snapshot;
        offlineSince = cached.savedAt;
      } else {
        this.setState({ phase: 'error', loadError: e instanceof Error ? e.message : String(e) });
        return;
      }
    }
    const session = readJSON<Partial<SessionState>>(SESSION_KEY, {});
    const next = stateFromSnapshot(this.st, snap, session);
    this.orderSeq = Math.max(readJSON<number>(ORDER_SEQ_KEY, 0), ...next.orders.map((o) => +(o.id.split('-').pop() || 0) || 0));
    const online = offlineSince ? false : this.backend.kind === 'http' ? navigator.onLine : next.online;
    this.st = { ...next, offlineSince, online, queue: this.queueFromOutbox() };
    this.persisted = { ...this.st };
    this.listeners.forEach((l) => l());
  }

  /** Stop writing to this device's storage (used before clearing development data). */
  stopPersisting(): void {
    this.persistStopped = true;
  }

  /** Write pending changes now (page hide / unload). */
  flushPersistence(): void {
    this.flushDebounced();
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = null;
    this.persist();
  }

  private schedulePersist(): void {
    if (this.st.phase !== 'ready' || this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persist();
    }, 250);
  }

  private persist(): void {
    if (this.st.phase !== 'ready' || this.persistStopped) return;
    const s = this.st,
      p = this.persisted;
    if (RECORD_KEYS.some((k) => s[k] !== p[k])) writeCachedSnapshot(snapshotFromState(s));
    if (sessionKeys.some((k) => s[k] !== p[k])) writeJSON(SESSION_KEY, Object.fromEntries(sessionKeys.map((k) => [k, s[k]])));
    this.persisted = { ...s };
  }

  private queueFromOutbox(): PosState['queue'] {
    return this.outbox.pending
      .filter((e) => e.label)
      .map((e) => ({
        id: e.id,
        kind: e.command.type === 'payment.record' ? ('payment' as const) : ('order' as const),
        orderId: 'orderId' in e.command ? e.command.orderId : 'order' in e.command ? e.command.order.id : '',
        label: e.label || '',
        at: stamp(new Date(e.at)),
      }));
  }

  // ---------- shared helpers used by actions and views ----------

  /** Queue a change for the backend. `label` shows it in the till's offline queue. */
  send(command: PosCommand, label?: string): void {
    if (this.backend.kind === 'http' && !Object.hasOwn(command, 'staffToken')) {
      command = { ...command, staffToken: getStaffToken() };
    }
    if (this.commandBatch) this.commandBatch.push({ command, label });
    else this.outbox.enqueue(command, label);
  }

  /** Collect synchronous changes and persist their commands before notifying the UI. */
  runCommandBatch<T>(action: () => T): T {
    if (this.commandBatch) throw new Error('Nested command batches are not supported.');
    const previous = this.st;
    this.commandBatch = [];
    try {
      const result = action();
      this.outbox.enqueueBatch(this.commandBatch);
      this.commandBatch = null;
      if (this.st !== previous) {
        this.schedulePersist();
        this.listeners.forEach((listener) => listener());
      }
      return result;
    } catch (error) {
      this.commandBatch = null;
      this.st = previous;
      this.listeners.forEach((listener) => listener());
      throw error;
    }
  }

  /** Save related commands together before starting delivery. */
  sendBatch(commands: { command: PosCommand; label?: string }[]): void {
    const staffToken = this.backend.kind === 'http' ? getStaffToken() : null;
    this.outbox.enqueueBatch(commands.map(({ command, label }) => ({
      command: this.backend.kind === 'http' && !Object.hasOwn(command, 'staffToken')
        ? { ...command, staffToken }
        : command,
      label,
    })));
  }

  /** Coalesce rapid edits (typing in a field) into one command per key. */
  sendDebounced(key: string, command: PosCommand, ms = 800): void {
    if (this.backend.kind === 'http' && !Object.hasOwn(command, 'staffToken')) {
      command = { ...command, staffToken: getStaffToken() };
    }
    const prev = this.debounced.get(key);
    if (prev) clearTimeout(prev.timer);
    const timer = setTimeout(() => {
      this.debounced.delete(key);
      this.send(command);
    }, ms);
    this.debounced.set(key, { timer, command });
  }

  private flushDebounced(): void {
    this.debounced.forEach(({ timer, command }) => {
      clearTimeout(timer);
      this.send(command);
    });
    this.debounced.clear();
  }

  say(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.setState({ toast: msg });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), 2400);
  }

  nextOrderNo(): string {
    if (this.backend.kind === 'http') {
      const prefix = this.config.terminalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'POS';
      // 12 random base-36 characters (~62 bits), generated once and retained on every retry.
      // The backend's unique order number constraint remains the final collision guard.
      return uid(`${prefix}-`, 12);
    }
    this.orderSeq += 1;
    writeJSON(ORDER_SEQ_KEY, this.orderSeq);
    return `#8020-${this.orderSeq}`;
  }

  staff(): StaffMember {
    const s = this.st;
    return s.staff.find((x) => x.id === s.staffId) || s.staff[0];
  }

  roles() {
    return sanitizeRoles(this.st.roles);
  }

  /** False until a staff member has signed in with their PIN. */
  get signedIn(): boolean {
    return !!this.st.staffId && this.st.staff.some((x) => x.id === this.st.staffId);
  }

  can(perm: Permission): boolean {
    if (!this.signedIn) return false;
    return hasPermission(this.roles()[this.staff().role].perms, perm);
  }

  roleLabel(staff: StaffMember): string {
    return this.roles()[staff.role].label;
  }

  location(id: string) {
    return this.st.catalog.locations.find((l) => l.id === id);
  }

  logAudit(action: string, detail: string, x: { reason?: string; approver?: string; amount?: number | null; area?: string } = {}): void {
    const st = this.staff();
    const e: AuditEntry = {
      id: uid('A'),
      at: stamp(),
      ts: Date.now(),
      staff: st.name,
      role: this.roleLabel(st),
      action,
      detail,
      reason: x.reason || '',
      approver: x.approver || '',
      amount: x.amount == null ? null : x.amount,
      area: x.area || 'Orders',
      cafe: this.st.cafe,
    };
    this.setState((s) => ({ audit: [e, ...(s.audit || [])].slice(0, 400) }));
    this.send({ type: 'audit.append', entry: e });
  }

  /** Run fn(approver | null) now if the signed-in staff member may, otherwise ask for a manager PIN first. */
  approve(perm: Permission, title: string, body: string, fn: (approver: StaffMember | null) => void): void {
    if (this.can(perm)) return fn(null);
    this.setState({ dlg: { kind: 'pin', pin: '', title, body, perm, next: (st) => fn(st) } });
  }
}
