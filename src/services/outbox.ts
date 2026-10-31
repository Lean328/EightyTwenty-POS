// Durable, ordered command queue. Commands are persisted before they are sent, delivered one at a time in
// the order they happened, and retried with the same idempotency key until the backend acknowledges them.
// A command the backend rejects outright (validation, conflict, permission) is moved to `rejected` and kept on
// this device for review — it is never silently dropped and never retried blindly. (Showing rejected commands
// to staff is pending: see docs/INTEGRATIONS.md.)
import { readJSON, writeJSON } from '../lib/storage';
import { uid } from '../lib/ids';
import { ApiError } from './http/httpClient';
import type { PosCommand } from './commands';

export class OutboxStorageError extends Error {
  constructor() {
    super('Device storage is unavailable. Changes were not saved.');
    this.name = 'OutboxStorageError';
  }
}

export interface OutboxEntry {
  /** Idempotency key. */
  id: string;
  command: PosCommand;
  /** Shown in the till's offline queue (orders and payments only). */
  label?: string;
  at: string;
  attempts: number;
  lastError?: string;
  /** A rejected prerequisite that must be reviewed before this command can be sent. */
  blockedBy?: string;
}

export interface RejectedEntry extends OutboxEntry {
  rejectedAt: string;
}

export type Transport = (command: PosCommand, idempotencyKey: string) => Promise<unknown>;

interface OutboxState {
  pending: OutboxEntry[];
  rejected: RejectedEntry[];
}

const KEY = 'outbox';
const MAX_BACKOFF_MS = 60_000;

function dependentOrderId(command: PosCommand): string | undefined {
  if ('orderId' in command) return command.orderId;
  if (command.type === 'loyalty.balance') return command.dependsOnOrderId;
  if (command.type === 'transaction.record') return command.record.orderId;
  return undefined;
}

function rejectedOrderId(command: PosCommand): string | undefined {
  if (command.type === 'order.create') return command.order.id;
  if (command.type === 'payment.record') return command.orderId;
  return undefined;
}

export class Outbox {
  private state: OutboxState;
  private online = true;
  private storageIssue = false;
  private flushing: Promise<FlushResult> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private deliveredListeners = new Set<(entry: OutboxEntry, response: unknown) => void>();
  private readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    this.state = readJSON<OutboxState>(KEY, { pending: [], rejected: [] });
  }

  get pending(): readonly OutboxEntry[] {
    return this.state.pending;
  }
  get storageError(): boolean {
    return this.storageIssue;
  }

  get rejected(): readonly RejectedEntry[] {
    return this.state.rejected;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Acknowledged responses are separate from pending/rejected queue changes. */
  onDelivered(listener: (entry: OutboxEntry, response: unknown) => void): () => void {
    this.deliveredListeners.add(listener);
    return () => this.deliveredListeners.delete(listener);
  }

  enqueue(command: PosCommand, label?: string): OutboxEntry {
    const entry: OutboxEntry = { id: uid('CMD-', 16), command, label, at: new Date().toISOString(), attempts: 0 };
    this.commit({ ...this.state, pending: [...this.state.pending, entry] });
    if (this.online) void this.flush();
    return entry;
  }

  /** Persist a group together before any command is sent. */
  enqueueBatch(commands: { command: PosCommand; label?: string }[]): OutboxEntry[] {
    if (!commands.length) return [];
    const entries = commands.map(({ command, label }) => ({
      id: uid('CMD-', 16), command, label, at: new Date().toISOString(), attempts: 0,
    }));
    const next = { ...this.state, pending: [...this.state.pending, ...entries] };
    if (!writeJSON(KEY, next)) {
      this.storageIssue = true;
      this.listeners.forEach((listener) => listener());
      throw new OutboxStorageError();
    }
    this.state = next;
    this.storageIssue = false;
    this.listeners.forEach((listener) => listener());
    if (this.online) void this.flush();
    return entries;
  }

  setOnline(online: boolean): void {
    this.online = online;
    if (online) void this.flush();
    else if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  dismissRejected(id: string): void {
    this.commit({ ...this.state, rejected: this.state.rejected.filter((r) => r.id !== id) });
  }

  /** Retry a rejected order creation with its original idempotency key after review. */
  retryRejectedOrder(id: string): boolean {
    const rejected = this.state.rejected.find((entry) => entry.id === id);
    if (!rejected || rejected.command.type !== 'order.create' || this.state.pending.some((entry) => entry.id === id)) return false;
    const { rejectedAt, ...entry } = rejected;
    void rejectedAt;
    const next = { ...this.state, pending: [entry, ...this.state.pending] };
    if (!writeJSON(KEY, next)) {
      this.storageIssue = true;
      this.listeners.forEach((listener) => listener());
      return false;
    }
    this.state = next;
    this.storageIssue = false;
    this.listeners.forEach((listener) => listener());
    if (this.online) void this.flush();
    return true;
  }

  /** Deliver pending commands in order. Resolves when the queue is empty or delivery has to wait. */
  flush(): Promise<FlushResult> {
    if (this.flushing) return this.flushing;
    this.flushing = this.run().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async run(): Promise<FlushResult> {
    let sent = 0;
    while (this.online && this.state.pending.length) {
      const entry = this.state.pending[0];
      if (entry.blockedBy) return { sent, waiting: this.state.pending.length, error: null };

      const orderId = dependentOrderId(entry.command);
      const rejectedCreate = orderId
        ? this.state.rejected.find((item) => rejectedOrderId(item.command) === orderId)
        : undefined;

      if (rejectedCreate) {
        this.commit({
          ...this.state,
          pending: this.state.pending.map((item) => item.id === entry.id ? { ...item, blockedBy: rejectedCreate.id } : item),
        });
        return { sent, waiting: this.state.pending.length, error: null };
      }

      try {
        const response = await this.transport(entry.command, entry.id);
        sent++;
        this.commit({
          pending: this.state.pending.filter((e) => e.id !== entry.id).map((e) => e.blockedBy === entry.id ? { ...e, blockedBy: undefined } : e),
          rejected: this.state.rejected.filter((e) => e.id !== entry.id),
        });
        for (const listener of this.deliveredListeners) {
          // An observer error must never turn an acknowledged payment into a rejected command.
          try { listener(entry, response); } catch (error) { console.error('Could not reconcile an acknowledged command', error); }
        }
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError('unknown', e instanceof Error ? e.message : String(e));
        const attempts = entry.attempts + 1;
        if (
          !err.retryable &&
          err.kind !== 'unauthorized' &&
          !['STAFF_SESSION_REQUIRED', 'STAFF_SESSION_MISMATCH'].includes(err.code || '')
        ) {
          const rejected: RejectedEntry = { ...entry, attempts, lastError: err.message, rejectedAt: new Date().toISOString() };
          this.commit({
            pending: this.state.pending
              .filter((x) => x.id !== entry.id)
              .map((item) => {
                const failedOrderId = rejectedOrderId(entry.command);
                return failedOrderId && dependentOrderId(item.command) === failedOrderId ? { ...item, blockedBy: entry.id } : item;
              }),
            rejected: [rejected, ...this.state.rejected.filter((item) => item.id !== entry.id)],
          });
          continue;
        }
        this.commit({
          ...this.state,
          pending: this.state.pending.map((x) => (x.id === entry.id ? { ...x, attempts, lastError: err.message } : x)),
        });
        this.scheduleRetry(attempts);
        return { sent, waiting: this.state.pending.length, error: err };
      }
    }
    return { sent, waiting: this.state.pending.length, error: null };
  }

  private scheduleRetry(attempts: number): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempts, 6));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  private commit(next: OutboxState): void {
    this.state = next;
    this.storageIssue = !writeJSON(KEY, next);
    this.listeners.forEach((l) => l());
  }
}

export interface FlushResult {
  sent: number;
  waiting: number;
  error: ApiError | null;
}
