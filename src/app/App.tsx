import { lazy, Suspense, useEffect } from 'react';
import { Shell } from '../features/shell/Shell';
import { loadKitchenScreen, loadOpsScreen } from '../features/shell/lazyScreens';
import { closeDialog, onRoute, requireSignIn } from '../state/actions/auth';
import { pullRemoteOrders, runSync, setOnline } from '../state/actions/sync';
import type { PosStore } from '../state/store';
import { ErrorBoundary } from './ErrorBoundary';
import { StatusScreen } from './StatusScreen';
import { StoreContext, useStore } from './storeContext';
import { BackendConnectionCheck } from './BackendConnectionCheck';

const ORDER_POLL_MS = 15_000;
/** Kitchen displays check for new and changed orders more often. */
const KITCHEN_POLL_MS = 5_000;

const KitchenDisplay = lazy(loadKitchenScreen);

/** Start trading once the snapshot is loaded: route, sign-in, and delivery of anything queued on this till. */
function start(store: PosStore): void {
  const kitchen = store.state.device.mode === 'kitchen';
  // Load the screen this device uses in the background so it is in memory before any connection drop.
  setTimeout(() => void (kitchen ? loadKitchenScreen() : loadOpsScreen()).catch(() => {}), kitchen ? 0 : 1500);
  onRoute(store);
  if (!store.signedIn || (kitchen && !store.can('kitchen'))) requireSignIn(store);
  if (store.state.online) {
    if (store.state.queue.length) void runSync(store);
    else store.outbox.setOnline(true);
  }
}

function useGlobalListeners(store: PosStore): void {
  useEffect(() => {
    const ctrl = new AbortController();
    void store.load(ctrl.signal).then(() => {
      if (!ctrl.signal.aborted && store.state.phase === 'ready') start(store);
    });

    const onHash = () => onRoute(store);
    const onResize = () => store.setState((st) => ({ narrow: innerWidth < 1080, navOpen: innerWidth < 1080 ? false : st.navOpen }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (store.state.dlg) closeDialog(store);
      else if (store.state.ops.form && !store.state.ops.form.busy) store.setOps({ form: null });
    };
    const onHide = () => store.flushPersistence();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') store.flushPersistence();
    };
    // Production follows the real network; development simulates it from the Sync dialog.
    const realNetwork = store.backend.kind === 'http';
    const onOnline = () => realNetwork && setOnline(store, true);
    const onOffline = () => realNetwork && setOnline(store, false);

    addEventListener('hashchange', onHash);
    addEventListener('resize', onResize);
    addEventListener('keydown', onKey);
    addEventListener('pagehide', onHide);
    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);

    // Website and app orders, and changes from other devices, reach this device through the backend (http provider only).
    let cursor: string | null = null;
    let lastPull = 0;
    let pulling = false;
    const poll = realNetwork
      ? setInterval(() => {
          const every = store.state.device.mode === 'kitchen' ? KITCHEN_POLL_MS : ORDER_POLL_MS;
          if (store.state.phase !== 'ready' || pulling || Date.now() - lastPull < every - 250) return;
          lastPull = Date.now();
          pulling = true;
          void pullRemoteOrders(store, cursor)
            .then((c) => (cursor = c))
            .finally(() => (pulling = false));
        }, KITCHEN_POLL_MS)
      : null;

    return () => {
      ctrl.abort();
      removeEventListener('hashchange', onHash);
      removeEventListener('resize', onResize);
      removeEventListener('keydown', onKey);
      removeEventListener('pagehide', onHide);
      removeEventListener('online', onOnline);
      removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
      if (poll) clearInterval(poll);
    };
  }, [store]);
}

function Screens() {
  const store = useStore();
  useGlobalListeners(store);
  const { phase, loadError } = store.state;
  if (phase === 'loading') return <StatusScreen title="Loading the till…" />;
  if (phase === 'error')
    return (
      <StatusScreen
        title="The till could not load"
        action={{
          label: 'Try again',
          go: () =>
            void store.load().then(() => {
              if (store.state.phase === 'ready') start(store);
            }),
        }}
      >
        {loadError || 'The EightyTwenty server did not respond.'} Nothing has been charged. Check the connection and try again.
      </StatusScreen>
    );
  // The kitchen display shows its own connection state.
  if (store.state.device.mode === 'kitchen')
    return (
      <Suspense fallback={<StatusScreen title="Opening the kitchen display…" />}>
        <KitchenDisplay />
      </Suspense>
    );
  return (
    <>
      {store.state.offlineSince ? <OfflineStartBanner since={store.state.offlineSince} /> : null}
      <Shell />
    </>
  );
}

function OfflineStartBanner({ since }: { since: string }) {
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        zIndex: 85,
        padding: '8px 12px',
        borderRadius: '10px',
        background: '#FBE9E4',
        color: '#8A2E1C',
        font: '500 12px/1.3 Figtree',
      }}
    >
      Started offline from data saved{' '}
      {new Date(since).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
    </div>
  );
}

export function App({ store }: { store: PosStore }) {
  if (import.meta.env.DEV && window.location.hash === '#backend-check') {
    return <BackendConnectionCheck store={store} />;
  }
  return (
    <ErrorBoundary onError={() => store.flushPersistence()}>
      <StoreContext.Provider value={store}>
        <Screens />
      </StoreContext.Provider>
    </ErrorBoundary>
  );
}
