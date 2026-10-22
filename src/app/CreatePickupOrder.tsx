import { CashPaymentPanel } from './CashPaymentPanel';
import { useRef, useState } from 'react';
import type { ModSelection } from '../domain/types';
import { config } from '../config/env';
import { getAccessToken } from '../services/http/authSession';
import { createHttpClient } from '../services/http/httpClient';

interface Line {
  itemId: string;
  qty: number;
  selections: ModSelection;
}

interface PendingOrder {
  key: string;
  body: {
    method: 'pickup';
    lines: Line[];
  };
}

interface OrderResult {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  created: boolean;
}

export function CreatePickupOrder({ slug, line }: { slug: string; line: Line }) {
  const storageKey = `pos-pending-create:${config.apiBaseUrl}:${config.terminalId}:${slug}`;
  const [pending, setPending] = useState<PendingOrder | null>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as PendingOrder) : null;
    } catch {
      return null;
    }
  });
  const [result, setResult] = useState<OrderResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  async function create() {
    if (inFlight.current || result) return;
    inFlight.current = true;
    setBusy(true);
    setError('');

    try {
      const request: PendingOrder = pending ?? {
        key: crypto.randomUUID(),
        body: {
          method: 'pickup',
          lines: [
            {
              itemId: line.itemId,
              qty: line.qty,
              selections: structuredClone(line.selections),
            },
          ],
        },
      };

      // Persist before sending. Retries reuse this exact body and key.
      sessionStorage.setItem(storageKey, JSON.stringify(request));
      setPending(request);

      const client = createHttpClient({
        baseUrl: config.apiBaseUrl,
        timeoutMs: config.apiTimeoutMs,
        terminalId: config.terminalId,
        getAccessToken,
      });

      const order = await client.post<OrderResult>(`/api/v1/pos/locations/${encodeURIComponent(slug)}/orders`, request.body, {
        idempotencyKey: request.key,
      });

      setResult(order);
      sessionStorage.removeItem(storageKey);
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create order.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      {!result && (
        <>
          {pending && (
            <div>
              <p>A previous request is pending. Retry sends the original items below, even if the current selection has changed.</p>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(pending.body.lines, null, 2)}</pre>
            </div>
          )}
          <button type="button" disabled={busy} onClick={() => void create()}>
            {busy ? 'Creating order…' : pending ? 'Retry original order' : 'Create pickup order'}
          </button>
        </>
      )}

      {error && <p role="alert">{error}</p>}

      {result && (
        <div role="status">
          <p>
            Order: <strong>{result.number}</strong>
          </p>
          <p>ID: {result.id}</p>
          <p>Status: {result.status}</p>
          <p>
            Server total:{' '}
            {new Intl.NumberFormat('en-AU', {
              style: 'currency',
              currency: 'AUD',
            }).format(result.totalCents / 100)}
          </p>
          <p>Order saved. Payment details are shown below.</p>
          <CashPaymentPanel key={result.id} slug={slug} orderId={result.id} totalCents={result.totalCents} />
        </div>
      )}
    </section>
  );
}
