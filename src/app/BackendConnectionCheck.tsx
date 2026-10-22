import { PosPinSignIn } from './PosPinSignIn';
import type { PosPinSession } from '../services/http/posPinAuth';
import type { PosStore } from '../state/store';
import { PosMenuPreview } from './PosMenuPreview';
import { loadPosCatalog } from '../services/http/posCatalog';
import type { MenuCategory } from '../domain/types';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { loadPosBootstrap } from '../services/http/posBootstrap';

import { config } from '../config/env';
import { clearLocalSession, getAccessToken, signIn } from '../services/http/authSession';
import { ApiError, createHttpClient } from '../services/http/httpClient';
import type { MenuItem } from '../domain/types';
interface Location {
  id: string;
  slug: string;
  name: string;
}

interface LocationsResponse {
  results: Location[];
}

export function BackendConnectionCheck({ store }: { store: PosStore }) {
  const [usePin, setUsePin] = useState(true);
  const [signedInName, setSignedInName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuBusy, setMenuBusy] = useState(false);
  const [menuLocation, setMenuLocation] = useState('');
  const [unavailableItemIds, setUnavailableItemIds] = useState<string[]>([]);

  async function pinSignedIn(session: PosPinSession) {
    setBusy(true);
    setError('');
    setConnected(false);
    setLocations([]);
    setMenu([]);
    setCategories([]);
    setUnavailableItemIds([]);
    setMenuLocation('');
    setSignedInName('');
  
    try {
      const data = await loadPosBootstrap();
  
      if (data.session.staff.id !== session.staff.id) {
        throw new Error('Staff session changed. Please sign in again.');
      }
  
      setLocations([data.location]);
      setSignedInName(data.session.staff.name);
      setMenu(data.menu);
      setCategories(data.categories);
      setUnavailableItemIds(data.unavailableItemIds);
      setMenuLocation(data.location.slug);
      setConnected(true);
    } catch (err) {
      clearLocalSession();
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');
    setConnected(false);
    setLocations([]);
    setMenu([]);
    setCategories([]);
    setMenuLocation('');

    try {
      if (!config.apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is missing.');
      }

      await signIn(config.apiBaseUrl, email, password);
      setPassword('');

      const client = createHttpClient({
        baseUrl: config.apiBaseUrl,
        timeoutMs: config.apiTimeoutMs,
        terminalId: config.terminalId,
        getAccessToken,
      });

      const response = await client.get<LocationsResponse>('/api/v1/pos/locations');

      setLocations(response.results);
      setConnected(true);
    } catch (err) {
      clearLocalSession();
      setError(err instanceof Error ? err.message : 'Connection failed.');
    } finally {
      setBusy(false);
    }
  }

  async function loadMenu(slug: string) {
    if (menuBusy) return;

    setMenuBusy(true);
    setError('');
    setMenu([]);
    setCategories([]);
    setUnavailableItemIds([]);
    setMenuLocation('');

    try {
      const catalog = await loadPosCatalog(slug);

      setMenu(catalog.menu);
      setCategories(catalog.categories);
      setUnavailableItemIds(catalog.unavailableItemIds);
      setMenuLocation(slug);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearLocalSession();
        setConnected(false);
        setLocations([]);
        setSignedInName('');
      }
      setError(err instanceof Error ? err.message : 'Could not load menu.');
    } finally {
      setMenuBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', padding: 24 }}>
      <h1>Backend connection check</h1>
      <p>Staff PIN is verified by Django. Email login is available for diagnostics.</p>

      <button
        type="button"
        disabled={busy || menuBusy}
        onClick={() => {
          clearLocalSession();
          setConnected(false);
          setLocations([]);
          setMenu([]);
          setCategories([]);
          setMenuLocation('');
          setUsePin(!usePin);
          setError('');
          setSignedInName('');
        }}
      >
        {usePin ? 'Use email diagnostics' : 'Use staff PIN'}
      </button>
      {usePin ? (
        !connected && <PosPinSignIn onSignedIn={pinSignedIn} />
      ) : (
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={busy}
              style={{ display: 'block', width: '100%', marginBottom: 16 }}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={busy}
              style={{ display: 'block', width: '100%', marginBottom: 16 }}
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? 'Connecting…' : 'Sign in and load locations'}
          </button>
        </form>
      )}

      {error && <p role="alert">{error}</p>}

      {connected && (
        <>
          <p role="status">Connected to Django successfully. {signedInName && `Signed in as ${signedInName}.`}</p>
          <button
            type="button"
            disabled={busy || menuBusy}
            onClick={() => {
              clearLocalSession();
              setConnected(false);
              setLocations([]);
              setMenu([]);
              setCategories([]);
              setMenuLocation('');
              setSignedInName('');
            }}
          >
            Lock / switch staff
          </button>
          <ul>
            {locations.map((location) => (
              <li key={location.id}>
                {location.name} — {location.slug}{' '}
                <button type="button" disabled={busy || menuBusy} onClick={() => void loadMenu(location.slug)}>
                  Load menu
                </button>
              </li>
            ))}
          </ul>
          {!locations.length && <p>No accessible locations found.</p>}
        </>
      )}

      {menuBusy && <p role="status">Loading menu…</p>}

      {menuLocation && (
        <section>
          <h2>Menu — {menuLocation}</h2>
          <PosMenuPreview store={store} slug={menuLocation} menu={menu} categories={categories} unavailableItemIds={unavailableItemIds} />

          <p>Categories: {categories.map((category) => category.name).join(', ')}</p>
          <ul>
            {menu.map((item) => (
              <li key={item.id}>
                {item.name} —{' '}
                {new Intl.NumberFormat('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                }).format(item.price)}
                {unavailableItemIds.includes(item.id) && ' — Sold out'}
                <ul>
                  {item.mods.map((group) => (
                    <li key={group.id}>
                      {group.name}
                      <ul>
                        {group.options.map(([name, price]) => (
                          <li key={name}>
                            {name} —{' '}
                            {new Intl.NumberFormat('en-AU', {
                              style: 'currency',
                              currency: 'AUD',
                            }).format(price)}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {!menu.length && <p>No menu items found.</p>}
        </section>
      )}
    </main>
  );
}
