import { useEffect, useState } from 'react';
import type { PosStore } from '../state/store';
import { initialState } from '../state/snapshot';
import { clearLocalSession } from '../services/http/authSession';
import type { PosPinSession } from '../services/http/posPinAuth';
import { TillScreen } from '../features/till/TillScreen';
import { buildTillView } from '../features/till/till.view';
import { DialogLayer } from '../features/dialogs/DialogLayer';
import { Toast } from '../features/shell/Toast';
import { PosPinSignIn } from './PosPinSignIn';
import { StoreContext, useStore } from './storeContext';

function TillContent() {
  const store = useStore();
  const view = buildTillView(store);

  const unavailable = () =>
    store.say('This feature is not connected to Django yet.');

  const connectedView = {
    ...view,
    views: view.views.filter((entry) => entry.id === 'till'),
    types: view.types.filter((entry) => entry.id === 'pickup'),
    openCafe: unavailable,
    openCustomer: unavailable,
    openDiscount: unavailable,
    openTablePick: unavailable,
    holdCart: unavailable,
    sendKitchen: unavailable,
    printBill: unavailable,
    openPay: unavailable,
    openShiftDlg: unavailable,
    openSync: unavailable,
    shiftChip: 'Shifts not connected',
    netChip: 'Django catalogue',
  };

  const dialog = store.state.dlg;
  const supportedDialog =
    dialog?.kind === 'item' || dialog?.kind === 'note';

  return (
    <>
      <TillScreen v={connectedView} />
      {supportedDialog && <DialogLayer />}
      <Toast message={store.state.toast} />
    </>
  );
}

export function LiveTill({ store }: { store: PosStore }) {
  const [session, setSession] = useState<PosPinSession | null>(null);

  function lock() {
    clearLocalSession();
    store.setState(initialState({}, store.devices.initialStates()));
    setSession(null);
  }

  useEffect(() => {
    if (!session) return;
    const remaining = session.expiresAt * 1000 - Date.now();
    if (remaining <= 0) {
      clearLocalSession();
      store.setState(initialState({}, store.devices.initialStates()));
      setSession(null);
      return;
    }

    const timer = window.setTimeout(() => {
      clearLocalSession();
      store.setState(initialState({}, store.devices.initialStates()));
      setSession(null);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [session, store]);

  async function signedIn(next: PosPinSession) {
    // Do not write live catalogue/session data into the demo cache.
    store.stopPersisting();

    try {
      await store.loadBootstrap();

      if (store.state.staffId !== next.staff.id) {
        throw new Error('Staff session changed. Please sign in again.');
      }

      if (!store.can('pos')) {
        throw new Error('This staff member cannot use the front counter.');
      }

      store.setState({
        view: 'till',
        route: 'till',
        type: 'pickup',
        q: '',
        filter: 'all',
        filtersOpen: false,
        cartOpen: false,
        dlg: null,
        toast: null,
      });

      setSession(next);
    } catch (error) {
      clearLocalSession();
      store.setState(initialState({}, store.devices.initialStates()));
      throw error;
    }
  }

  if (!session) {
    return (
      <main style={{ padding: 24 }}>
        <h1>EightyTwenty POS</h1>
        <PosPinSignIn onSignedIn={signedIn} />
      </main>
    );
  }

  return (
    <StoreContext.Provider value={store}>
      <div
        style={{
          background: '#F7F2EA',
          color: '#2C1A12',
          fontFamily: 'Figtree, system-ui, sans-serif',
        }}
      >
        <header style={{ padding: '10px 24px' }}>
          <strong>{session.staff.name}</strong>
          {' — '}
          {store.location(store.state.cafe)?.name}
          {' '}
          <button type="button" onClick={lock}>
            Lock / switch staff
          </button>
          <p>
            Live menu and cart. Checkout is not connected yet.
            Cart totals are estimates until Django calculates the order.
          </p>
        </header>
        <TillContent />
      </div>
    </StoreContext.Provider>
  );
}
