import { useRef, useState } from 'react';
import { config } from '../config/env';
import { getAccessToken } from '../services/http/authSession';
import { ApiError, createHttpClient } from '../services/http/httpClient';

interface Payment {
  id: string;
  orderId: string;
  amountCents: number;
  tenderedCents: number;
  changeCents: number;
  created: boolean;
}

interface PendingPayment {
  key: string;
  tenderedCents: number;
}

const money = (cents: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);

export function CashPaymentPanel({ slug, orderId, totalCents }: { slug: string; orderId: string; totalCents: number }) {
  const storageKey = `pos-pending-cash:${config.apiBaseUrl}:${config.terminalId}:${orderId}`;

  const [pending, setPending] = useState<PendingPayment | null>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as PendingPayment) : null;
    } catch {
      return null;
    }
  });
  const [tendered, setTendered] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  async function pay() {
    if (inFlight.current || payment) return;
    setError('');

    let request = pending;

    if (!request) {
      const value = tendered.trim();
      if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) {
        setError('Enter an AUD amount such as 30.00.');
        return;
      }

      const [whole, fraction = ''] = value.split('.');
      const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

      if (cents < totalCents || cents > 100_000_000) {
        setError('Cash must cover the order total and be within the allowed limit.');
        return;
      }

      request = { key: crypto.randomUUID(), tenderedCents: cents };
    }

    inFlight.current = true;
    setBusy(true);

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(request));
      setPending(request);

      const client = createHttpClient({
        baseUrl: config.apiBaseUrl,
        timeoutMs: config.apiTimeoutMs,
        terminalId: config.terminalId,
        getAccessToken,
      });

      const result = await client.post<Payment>(
        `/api/v1/pos/locations/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}/payments/cash`,
        { tenderedCents: request.tenderedCents },
        { idempotencyKey: request.key },
      );

      setPayment(result);
      sessionStorage.removeItem(storageKey);
      setPending(null);
    } catch (err) {
      // A validation rejection means no payment was recorded by this endpoint.
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        sessionStorage.removeItem(storageKey);
        setPending(null);
      }
      setError(err instanceof Error ? err.message : 'Could not record cash payment.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  if (payment) {
    return (
      <section>
        <h4>Cash payment recorded</h4>
        <p>Paid: {money(payment.amountCents)}</p>
        <p>Cash received: {money(payment.tenderedCents)}</p>
        <p>
          <strong>Change: {money(payment.changeCents)}</strong>
        </p>
        <p>Payment ID: {payment.id}</p>
      </section>
    );
  }

  return (
    <section>
      <h4>Cash payment</h4>
      <p>Only confirm after receiving the cash.</p>
      <label>
        Cash received (AUD){' '}
        <input
          type="text"
          inputMode="decimal"
          placeholder="30.00"
          value={pending ? (pending.tenderedCents / 100).toFixed(2) : tendered}
          disabled={busy || pending !== null}
          onChange={(event) => setTendered(event.target.value)}
        />
      </label>
      {pending && <p>The previous request has no confirmed result. Retry uses the same amount and payment key.</p>}
      <button type="button" disabled={busy} onClick={() => void pay()}>
        {busy ? 'Recording…' : pending ? 'Retry cash payment' : 'Confirm cash received'}
      </button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
