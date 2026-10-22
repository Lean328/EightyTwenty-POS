import { useRef, useState } from 'react';
import { config } from '../config/env';
import { PinDialog } from '../features/dialogs/PinDialog';
import { createPosPinAuth } from '../services/http/posPinAuth';
import type { PosPinSession } from '../services/http/posPinAuth';

/** Uses Thịnh's actual PIN keypad. Pairing is a one-device setup, not a staff password. */
export function PosPinSignIn({ onSignedIn }: { onSignedIn: (session: PosPinSession) => Promise<void> }) {
  const storageKey = `pos-device:${config.apiBaseUrl}:${config.terminalId}`;
  const [credential, setCredential] = useState(() => sessionStorage.getItem(storageKey) ?? '');
  const [paired, setPaired] = useState(Boolean(credential));
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const [auth] = useState(() =>
    createPosPinAuth({
      baseUrl: config.apiBaseUrl,
      terminalId: config.terminalId,
      getDeviceCredential: () => sessionStorage.getItem(storageKey),
    }),
  );

  async function key(value: string) {
    if (lock.current) return;
    if (value === '⌫') {
      setPin(pin.slice(0, -1));
      setError('');
      return;
    }
    const next = value === 'OK' ? pin : pin + value;
    if (next.length < 4) {
      setPin(next);
      return;
    }
    lock.current = true;
    setPin(next);
    setBusy(true);
    setError('');
    try {
      const session = await auth.signIn(next);
      await onSignedIn(session);
    } catch (err) {
      auth.signOut();
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      lock.current = false;
      setBusy(false);
      setPin('');
    }
  }

  if (!paired)
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = credential.trim();
          if (!value.startsWith(config.terminalId + ':') || value.length < config.terminalId.length + 30) {
            setError('Use the device credential generated for ' + config.terminalId);
            return;
          }
          sessionStorage.setItem(storageKey, value);
          setError('');
          setPaired(true);
        }}
      >
        <h2>Pair this POS device</h2>
        <p>Terminal: {config.terminalId}. Enter the device credential from the Django setup command.</p>
        <input
          aria-label="Device credential"
          type="password"
          autoComplete="off"
          required
          value={credential}
          onChange={(event) => setCredential(event.target.value)}
        />
        <button type="submit">Continue to staff PIN</button>
        {error && <p role="alert">{error}</p>}
      </form>
    );

  return (
    <>
      <div style={{ minHeight: 480 }}>
        <PinDialog
          d={{
            title: busy ? 'Signing in…' : 'Sign in',
            body: 'Enter your 4-digit staff PIN. Verified by Django.',
            err: error,
            hint: '',
            dots: [0, 1, 2, 3].map((index) => (index < pin.length ? '#2C1A12' : 'rgba(44,26,18,.15)')),
            keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((value) => ({
              label: value,
              bg: /[0-9]/.test(value) ? '#F7F2EA' : 'transparent',
              // eslint-disable-next-line react-hooks/refs -- PinDialog invokes pick only in its onClick handler.
              pick: () => void key(value),
            })),
          }}
        />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          auth.signOut();
          sessionStorage.removeItem(storageKey);
          setCredential('');
          setPaired(false);
          setPin('');
          setError('');
        }}
      >
        Change paired device
      </button>
    </>
  );
}
