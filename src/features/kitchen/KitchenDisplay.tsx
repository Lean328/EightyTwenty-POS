import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useStore } from '../../app/storeContext';
import { DialogLayer } from '../dialogs/DialogLayer';
import { Toast } from '../shell/Toast';
import { useNow } from './clock';
import { buildKitchenView, KDS } from './kitchen.view';
import { KitchenMonitor } from './kitchenMonitor';
import { ReadyRail, SettingsSheet } from './KitchenPanels';
import { KitchenTicket } from './KitchenTicket';

const iconBtn = {
  width: '48px',
  height: '48px',
  flex: 'none',
  borderRadius: '12px',
  border: 0,
  background: 'rgba(245,237,226,.08)',
  color: KDS.foam,
  display: 'grid',
  placeItems: 'center',
} as const;

/** Entry point of the kitchen display chunk: a full-screen ticket board for kitchen and barista staff. */
export default function KitchenDisplay() {
  const store = useStore();
  const [monitor] = useState(() => new KitchenMonitor(store));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => monitor.start(), [monitor]);
  // Browsers only allow sound after a tap; every tap keeps the audio context available.
  useEffect(() => {
    addEventListener('pointerdown', monitor.chime.unlock);
    return () => removeEventListener('pointerdown', monitor.chime.unlock);
  }, [monitor]);

  const snapshot = useSyncExternalStore(monitor.subscribe, monitor.getSnapshot);
  const subscribeOutbox = useCallback((fn: () => void) => store.outbox.subscribe(fn), [store]);
  const pending = useSyncExternalStore(subscribeOutbox, () => store.outbox.pending.length);
  const now = useNow();
  const v = buildKitchenView(store, { now, monitor: snapshot, dismissAlert: monitor.dismiss, pending });
  const narrow = store.state.narrow;

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: KDS.cream,
        color: KDS.espresso,
        fontFamily: 'Figtree,system-ui,sans-serif',
      }}
    >
      <header
        style={{
          flex: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px 14px',
          padding: '10px 16px',
          background: KDS.espresso,
          color: KDS.foam,
        }}
      >
        <div style={{ minWidth: 0, marginRight: 'auto' }}>
          <h1 style={{ margin: 0, font: '500 20px/1.1 Newsreader,serif', letterSpacing: '.02em', whiteSpace: 'nowrap' }}>
            EightyTwenty <span style={{ color: KDS.sand }}>Kitchen</span>
          </h1>
          <p
            style={{
              margin: '3px 0 0',
              font: '600 11px/1.3 Figtree',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: KDS.sand,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {v.cafeName} · {v.stationLabel}
          </p>
        </div>

        <div
          role="group"
          aria-label="Station"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            borderRadius: '14px',
            background: 'rgba(245,237,226,.08)',
            order: narrow ? 10 : 0,
          }}
        >
          {v.stations.map((st) => (
            <button
              key={st.id}
              type="button"
              aria-pressed={st.on}
              onClick={st.pick}
              style={{
                height: '44px',
                padding: '0 16px',
                borderRadius: '10px',
                border: 0,
                background: st.on ? KDS.foam : 'transparent',
                color: st.on ? KDS.espresso : KDS.foam,
                font: '700 15px/1 Figtree',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {st.label}
              <span
                style={{
                  minWidth: '22px',
                  height: '22px',
                  padding: '0 6px',
                  borderRadius: '11px',
                  background: st.on ? KDS.caramel : 'rgba(245,237,226,.16)',
                  color: st.on ? KDS.ivory : KDS.foam,
                  font: '700 12px/22px Figtree',
                }}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>

        <span
          role="status"
          style={{
            padding: '7px 12px',
            borderRadius: '999px',
            background: v.conn.bg,
            color: v.conn.fg,
            font: '700 13px/1 Figtree',
            whiteSpace: 'nowrap',
          }}
        >
          {v.conn.label}
        </span>
        <span aria-label="Time" style={{ font: '500 24px/1 Newsreader,serif', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {v.clock}
        </span>
        <button
          type="button"
          onClick={v.toggleMute}
          aria-label={v.muted ? 'Unmute new order sound' : 'Mute new order sound'}
          style={iconBtn}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5L6 9H3v6h3l5 4V5z" />
            {v.muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />}
          </svg>
        </button>
        {v.staffName ? (
          <button
            type="button"
            onClick={v.lock}
            aria-label={`Lock · signed in as ${v.staffName}`}
            title="Lock · switch staff"
            style={{ ...iconBtn, background: KDS.sand, color: KDS.espresso, font: '700 15px/1 Figtree' }}
          >
            {v.staffInitials}
          </button>
        ) : null}
        <button type="button" onClick={() => setSheetOpen(true)} aria-label="Kitchen display settings" style={iconBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
        </button>
      </header>

      {v.banner ? (
        <div
          role="alert"
          style={{
            flex: 'none',
            padding: '12px 16px',
            background: v.banner.tone === 'danger' ? KDS.red : '#FBF0E1',
            color: v.banner.tone === 'danger' ? '#FFFFFF' : KDS.caramelDark,
            font: '500 14px/1.4 Figtree',
          }}
        >
          <strong style={{ font: '700 15px/1.3 Figtree' }}>{v.banner.title}</strong> {v.banner.body}
        </div>
      ) : null}

      {v.alerts.length ? (
        <div style={{ flex: 'none', display: 'grid', gap: '1px', background: 'rgba(255,255,255,.2)' }}>
          {v.alerts.map((a) => (
            <div
              key={a.key}
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                background: a.kind === 'cancelled' ? KDS.red : KDS.caramelDark,
                color: '#FFFFFF',
                font: '700 16px/1.3 Figtree',
              }}
            >
              <span style={{ flex: 1 }}>{a.text}</span>
              <button
                type="button"
                onClick={a.dismiss}
                style={{
                  height: '44px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,.5)',
                  background: 'transparent',
                  color: '#FFFFFF',
                  font: '700 14px/1 Figtree',
                }}
              >
                Got it
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <main aria-label="Tickets" style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px' }}>
          {v.tickets.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                gap: '14px',
                alignItems: 'start',
                paddingBottom: narrow ? '76px' : 0,
              }}
            >
              {v.tickets.map((t) => (
                <KitchenTicket key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: '240px', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div>
                <p style={{ margin: 0, font: '500 26px/1.2 Newsreader,serif', color: KDS.roast }}>All caught up</p>
                <p style={{ margin: '8px 0 0', font: '400 15px/1.4 Figtree', color: KDS.muted }}>{v.emptyText}</p>
              </div>
            </div>
          )}
        </main>
        {!narrow ? (
          <aside
            aria-label="Ready and recent orders"
            style={{
              flex: 'none',
              width: '300px',
              overflowY: 'auto',
              padding: '16px 16px 16px 4px',
              borderLeft: '1px solid rgba(44,26,18,.06)',
            }}
          >
            <ReadyRail v={v} />
          </aside>
        ) : null}
      </div>

      {v.localNote && !narrow ? (
        <p style={{ flex: 'none', margin: 0, padding: '6px 16px', font: '400 11px/1.3 Figtree', color: KDS.muted, background: KDS.linen }}>
          {v.localNote}
        </p>
      ) : null}

      {narrow ? (
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          aria-label="Show ready and recent orders"
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            zIndex: 30,
            height: '56px',
            padding: '0 20px',
            borderRadius: '28px',
            border: 0,
            background: KDS.green,
            color: '#FFFFFF',
            font: '700 16px/1 Figtree',
            boxShadow: '0 10px 30px rgba(44,26,18,.25)',
          }}
        >
          Ready · {v.readyCount}
        </button>
      ) : null}
      {narrow && railOpen ? (
        <>
          <div
            onClick={() => setRailOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(44,26,18,.42)', animation: 'fadeIn .18s ease' }}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Ready and recent orders"
            style={{
              position: 'fixed',
              zIndex: 41,
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(360px, 100vw)',
              overflowY: 'auto',
              padding: '18px',
              background: KDS.cream,
              boxShadow: '-20px 0 60px rgba(44,26,18,.25)',
              animation: 'slideIn .22s cubic-bezier(.22,1,.36,1)',
            }}
          >
            <button
              type="button"
              onClick={() => setRailOpen(false)}
              style={{
                float: 'right',
                height: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: 0,
                background: KDS.linen,
                font: '600 14px/1 Figtree',
              }}
            >
              Close
            </button>
            <ReadyRail v={v} />
          </aside>
        </>
      ) : null}

      {sheetOpen ? <SettingsSheet v={v} close={() => setSheetOpen(false)} /> : null}
      <Toast message={store.state.toast} />
      <DialogLayer />
    </div>
  );
}
