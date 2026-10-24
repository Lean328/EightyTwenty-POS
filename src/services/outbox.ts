// Durable, ordered command queue. Commands are persisted before they are sent, delivered one at a time in
// the order they happened, and retried with the same idempotency key until the backend acknowledges them.
// A command the backend rejects outright (validation, conflict, permission) is moved to `rejected` and kept on
// this device for review — it is never silently dropped and never retried blindly. (Showing rejected commands
// to staff is pending: see docs/INTEGRATIONS.md.)
import { readJSON, writeJSON } from '../lib/storage';
import { uid } from '../lib/ids';
import { ApiError } from './http/httpClient';
import type { PosCommand } from './commands';

export interface OutboxEntry {
  /** Idempotency key. */
  id: string;
  command: PosCommand;
  /** Shown in the till's offline queue (orders and payments only). */
  label?: string;
  at: string;
  attempts: number;
  lastError?: string;
}

export interface RejectedEntry extends OutboxEntry {
  rejectedAt: string;
}

export type Transport = (command: PosCommand, idempotencyKey: string) => Promise<void>;

interface OutboxState {
  pending: OutboxEntry[];
  rejected: RejectedEntry[];
}

const KEY = 'outbox';
const MAX_BACKOFF_MS = 60_000;

export class Outbox {
  private state: OutboxState;
  private online = true;
  private flushing: Promise<FlushResult> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
    this.state = readJSON<OutboxState>(KEY, { pending: [], rejected: [] });
  }

  get pending(): readonly OutboxEntry[] {
    return this.state.pending;
  }
  get rejected(): readonly RejectedEntry[] {
    return this.state.rejected;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  enqueue(command: PosCommand, label?: string): OutboxEntry {
    const entry: OutboxEntry = { id: uid('CMD-', 16), command, label, at: new Date().toISOString(), attempts: 0 };
    this.commit({ ...this.state, pending: [...this.state.pending, entry] });
    if (this.online) void this.flush();
    return entry;
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
      try {
        await this.transport(entry.command, entry.id);
        sent++;
        this.commit({ ...this.state, pending: this.state.pending.filter((e) => e.id !== entry.id) });
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError('unknown', e instanceof Error ? e.message : String(e));
        const attempts = entry.attempts + 1;
        if (!err.retryable && err.kind !== 'unauthorized') {
          const rejected: RejectedEntry = { ...entry, attempts, lastError: err.message, rejectedAt: new Date().toISOString() };
          this.commit({
            pending: this.state.pending.filter((x) => x.id !== entry.id),
            rejected: [rejected, ...this.state.rejected].slice(0, 100),
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
    writeJSON(KEY, next);
    this.listeners.forEach((l) => l());
  }
}

export interface FlushResult {
  sent: number;
  waiting: number;
  error: ApiError | null;
}
