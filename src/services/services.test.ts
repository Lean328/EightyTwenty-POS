import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PosCommand } from './commands';
import { ApiError, createHttpClient } from './http/httpClient';
import { Outbox } from './outbox';

const cmd = (orderId: string): PosCommand => ({ type: 'order.accept', orderId });

describe('Outbox', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('delivers in order with a stable idempotency key per command', async () => {
    const seen: [string, string][] = [];
    const ob = new Outbox(async (c, key) => {
      seen.push([(c as { orderId: string }).orderId, key]);
    });
    ob.setOnline(false);
    ob.enqueue(cmd('a'));
    ob.enqueue(cmd('b'));
    expect(ob.pending).toHaveLength(2);
    ob.setOnline(true);
    await ob.flush();
    expect(seen.map((s) => s[0])).toEqual(['a', 'b']);
    expect(new Set(seen.map((s) => s[1])).size).toBe(2);
    expect(ob.pending).toHaveLength(0);
  });

  it('keeps a command queued (same key) after a retryable failure', async () => {
    vi.useFakeTimers();
    const keys: string[] = [];
    let fail = true;
    const ob = new Outbox(async (_c, key) => {
      keys.push(key);
      if (fail) throw new ApiError('network', 'down');
    });
    ob.setOnline(false);
    ob.enqueue(cmd('a'));
    ob.setOnline(true);
    const r = await ob.flush();
    expect(r.error?.kind).toBe('network');
    expect(ob.pending[0].attempts).toBe(1);
    fail = false;
    await vi.advanceTimersByTimeAsync(2000);
    expect(ob.pending).toHaveLength(0);
    expect(keys[0]).toBe(keys[1]);
  });

  it('moves a rejected command aside instead of retrying it forever', async () => {
    const ob = new Outbox(async (c) => {
      if ((c as { orderId: string }).orderId === 'bad') throw new ApiError('validation', 'Order total mismatch', 422);
    });
    ob.setOnline(false);
    ob.enqueue(cmd('bad'));
    ob.enqueue(cmd('good'));
    ob.setOnline(true);
    await ob.flush();
    expect(ob.pending).toHaveLength(0);
    expect(ob.rejected).toHaveLength(1);
    expect(ob.rejected[0].lastError).toBe('Order total mismatch');
  });

  it('survives a reload', () => {
    const ob = new Outbox(async () => {});
    ob.setOnline(false);
    ob.enqueue(cmd('a'), 'label');
    const again = new Outbox(async () => {});
    expect(again.pending[0]).toMatchObject({ command: cmd('a'), label: 'label' });
  });
});

describe('http client', () => {
  const ok = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('sends JSON with idempotency and terminal headers', async () => {
    const fetchImpl = vi.fn(async () => ok({ ok: true }));
    const http = createHttpClient({ baseUrl: 'https://api.test', timeoutMs: 1000, terminalId: 'TILL-9', fetchImpl, isOnline: () => true });
    await expect(http.post('/x', { a: 1 }, { idempotencyKey: 'k1' })).resolves.toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/x');
    expect(init.headers).toMatchObject({ 'Idempotency-Key': 'k1', 'X-Terminal-Id': 'TILL-9', 'Content-Type': 'application/json' });
    expect(init.credentials).toBe('omit');
  });

  it('classifies server responses', async () => {
    const make = (status: number) =>
      createHttpClient({
        baseUrl: '',
        timeoutMs: 1000,
        terminalId: 't',
        fetchImpl: async () => ok({ message: 'nope', code: 'x' }, status),
        isOnline: () => true,
      });
    await expect(make(422).get('/')).rejects.toMatchObject({ kind: 'validation', retryable: false, message: 'nope', code: 'x' });
    await expect(make(409).get('/')).rejects.toMatchObject({ kind: 'conflict', retryable: false });
    await expect(make(503).get('/')).rejects.toMatchObject({ kind: 'server', retryable: true });
    await expect(make(401).get('/')).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('fails fast offline and maps network errors', async () => {
    const offline = createHttpClient({ baseUrl: '', timeoutMs: 1000, terminalId: 't', fetchImpl: vi.fn(), isOnline: () => false });
    await expect(offline.get('/')).rejects.toMatchObject({ kind: 'offline', retryable: true });
    const broken = createHttpClient({
      baseUrl: '',
      timeoutMs: 1000,
      terminalId: 't',
      fetchImpl: async () => {
        throw new TypeError('Failed to fetch');
      },
      isOnline: () => true,
    });
    await expect(broken.get('/')).rejects.toMatchObject({ kind: 'network' });
  });

  it('times out slow requests', async () => {
    const slow = createHttpClient({
      baseUrl: '',
      timeoutMs: 20,
      terminalId: 't',
      isOnline: () => true,
      fetchImpl: (_u, init) =>
        new Promise((_r, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    });
    await expect(slow.get('/')).rejects.toMatchObject({ kind: 'timeout' });
  });
});
