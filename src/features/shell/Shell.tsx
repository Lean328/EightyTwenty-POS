import { lazy, Suspense } from 'react';
import { useStore } from '../../app/storeContext';
import { DialogLayer } from '../dialogs/DialogLayer';
import { TillScreen } from '../till/TillScreen';
import { buildTillView } from '../till/till.view';
import { NavRail } from './NavRail';
import { buildNavView } from './nav.view';
import { loadOpsScreen } from './lazyScreens';
import { Toast } from './Toast';

const OpsScreen = lazy(loadOpsScreen);

/** Root layout: navigation, the till or a back-office section, toasts and dialogs. */
export function Shell() {
  const store = useStore();
  const isTill = store.state.route === 'till';
  return (
    <div
      style={{ display: 'flex', minHeight: '100vh', background: '#F7F2EA', color: '#2C1A12', fontFamily: 'Figtree,system-ui,sans-serif' }}
    >
      <NavRail v={buildNavView(store)} />
      {isTill ? (
        <TillScreen v={buildTillView(store)} />
      ) : (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={null}>
            <OpsScreen />
          </Suspense>
        </div>
      )}
      <Toast message={store.state.toast} />
      <DialogLayer />
    </div>
  );
}
