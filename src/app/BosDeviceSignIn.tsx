import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { config } from '../config/env';
import { getAccessToken, signIn } from '../services/http/authSession';
import { createHttpClient } from '../services/http/httpClient';

interface Location {
  slug: string;
  name: string;
}

interface Props {
  onReady: (cafe: string, account: string) => Promise<void>;
}

export function BosDeviceSignIn({ onReady }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [cafe, setCafe] = useState('');
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');

    try {
      if (!account) {
        await signIn(config.apiBaseUrl, email, password);
        setPassword('');

        const client = createHttpClient({
          baseUrl: config.apiBaseUrl,
          timeoutMs: config.apiTimeoutMs,
          terminalId: config.terminalId,
          getAccessToken,
        });
        const result = await client.get<{ results: Location[] }>('/api/v1/pos/locations');
        if (!result.results.length) throw new Error('This account has no assigned cafes.');

        setLocations(result.results);
        setCafe(result.results[0].slug);
        setAccount(email.trim().toLowerCase());
      } else {
        await onReady(cafe, account);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open this till.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', padding: 24 }}>
      <h1>EightyTwenty POS</h1>
      <p>Terminal: {config.terminalId}</p>
      <form onSubmit={(event) => void submit(event)}>
        {!account ? (
          <>
            <h2>Device account sign in</h2>
            <p>Sign in with the cafe account. Staff enter their PIN next.</p>
            <label style={{ display: 'block', marginBottom: 16 }}>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
                style={{ display: 'block', width: '100%', padding: 10 }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 16 }}>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
                style={{ display: 'block', width: '100%', padding: 10 }}
              />
            </label>
          </>
        ) : (
          <label style={{ display: 'block', marginBottom: 16 }}>
            Cafe
            <select
              value={cafe}
              disabled={busy}
              onChange={(event) => setCafe(event.target.value)}
              style={{ display: 'block', width: '100%', padding: 10 }}
            >
              {locations.map((location) => (
                <option key={location.slug} value={location.slug}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : account ? 'Open till' : 'Sign in and load cafes'}
        </button>
      </form>
    </main>
  );
}
