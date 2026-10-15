import { KDS, type KitchenView } from './kitchen.view';

const railHeading = { margin: '0 0 10px', font: '500 17px/1.1 Newsreader,serif', color: KDS.espresso } as const;

/** Orders ready for pickup (or done at this station) and the most recent collected orders. */
export function ReadyRail({ v }: { v: KitchenView }) {
  return (
    <div style={{ display: 'grid', gap: '20px', alignContent: 'start' }}>
      <section aria-label="Ready">
        <h2 style={railHeading}>
          Ready <span style={{ font: '600 13px/1 Figtree', color: KDS.muted }}>{v.readyRows.length}</span>
        </h2>
        {v.readyRows.length ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
            {v.readyRows.map((r) => (
              <li
                key={r.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: r.waiting ? KDS.ivory : KDS.greenBg,
                  border: `1px solid ${r.waiting ? 'rgba(44,26,18,.08)' : 'rgba(62,107,71,.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', font: '700 18px/1.1 Figtree', color: KDS.espresso }}>
                    <span style={{ font: '500 12px/1 Figtree', color: KDS.muted }}>{r.prefix}</span>
                    {r.number}
                  </span>
                  <span style={{ display: 'block', marginTop: '3px', font: '500 13px/1.3 Figtree', color: KDS.roast }}>{r.service}</span>
                  <span style={{ display: 'block', font: '600 12px/1.3 Figtree', color: r.waiting ? KDS.caramelDark : KDS.greenFg }}>
                    {r.label}
                  </span>
                </span>
                {r.recall ? (
                  <button
                    type="button"
                    onClick={r.recall}
                    aria-label={`Recall ${r.id}`}
                    style={{
                      flex: 'none',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.16)',
                      background: KDS.ivory,
                      font: '700 13px/1 Figtree',
                    }}
                  >
                    Recall
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, font: '400 13px/1.4 Figtree', color: KDS.muted }}>Nothing waiting for pickup.</p>
        )}
      </section>
      <section aria-label="Recently collected">
        <h2 style={railHeading}>Recently collected</h2>
        {v.recentRows.length ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
            {v.recentRows.map((r) => (
              <li key={r.id} style={{ padding: '8px 2px', borderBottom: '1px solid rgba(44,26,18,.07)' }}>
                <span style={{ font: '600 14px/1.2 Figtree', color: KDS.roast }}>{r.id}</span>
                <span style={{ display: 'block', font: '400 12px/1.35 Figtree', color: KDS.muted }}>
                  {r.service} — {r.summary}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, font: '400 13px/1.4 Figtree', color: KDS.muted }}>No collected orders yet today.</p>
        )}
      </section>
    </div>
  );
}

const sheetSection = { display: 'grid', gap: '10px', paddingBottom: '18px', borderBottom: '1px solid rgba(44,26,18,.08)' } as const;
const sheetLabel = { margin: 0, font: '700 11px/1 Figtree', letterSpacing: '.1em', textTransform: 'uppercase', color: KDS.muted } as const;

/** Station, sound, staff and device options for this kitchen screen. */
export function SettingsSheet({ v, close }: { v: KitchenView; close: () => void }) {
  return (
    <>
      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(44,26,18,.42)', animation: 'fadeIn .18s ease' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Kitchen display settings"
        style={{
          position: 'fixed',
          zIndex: 46,
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(400px, 100vw)',
          overflowY: 'auto',
          padding: '22px 22px 28px',
          background: KDS.ivory,
          boxShadow: '-20px 0 60px rgba(44,26,18,.25)',
          animation: 'slideIn .22s cubic-bezier(.22,1,.36,1)',
          display: 'grid',
          gap: '18px',
          alignContent: 'start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>Kitchen display</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{ width: '44px', height: '44px', borderRadius: '12px', border: 0, background: KDS.cream, font: '500 20px/1 Figtree' }}
          >
            ×
          </button>
        </div>

        <section style={sheetSection}>
          <p style={sheetLabel}>Station shown on this screen</p>
          {v.stations.map((st) => (
            <button
              key={st.id}
              type="button"
              aria-pressed={st.on}
              onClick={st.pick}
              style={{
                height: '52px',
                padding: '0 16px',
                borderRadius: '12px',
                border: `1px solid ${st.on ? KDS.espresso : 'rgba(44,26,18,.14)'}`,
                background: st.on ? KDS.espresso : 'transparent',
                color: st.on ? KDS.foam : KDS.espresso,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                font: '600 15px/1 Figtree',
              }}
            >
              {st.id === 'all' ? 'All stations' : st.id === 'kitchen' ? 'Food · Kitchen' : 'Drinks · Barista'}
              <span style={{ font: '600 13px/1 Figtree', opacity: 0.75 }}>{st.count}</span>
            </button>
          ))}
        </section>

        <section style={sheetSection}>
          <p style={sheetLabel}>Sound</p>
          <button
            type="button"
            role="switch"
            aria-checked={!v.muted}
            onClick={v.toggleMute}
            style={{
              height: '52px',
              padding: '0 16px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              font: '600 15px/1 Figtree',
            }}
          >
            New order sound
            <span style={{ font: '700 13px/1 Figtree', color: v.muted ? KDS.red : KDS.greenFg }}>{v.muted ? 'Muted' : 'On'}</span>
          </button>
        </section>

        <section style={sheetSection}>
          <p style={sheetLabel}>Signed in</p>
          <p style={{ margin: 0, font: '500 15px/1.3 Figtree' }}>{v.staffName ? `${v.staffName} · ${v.staffRole}` : 'Nobody signed in'}</p>
          <button
            type="button"
            onClick={() => {
              close();
              v.lock();
            }}
            style={{
              height: '48px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.16)',
              background: KDS.cream,
              font: '600 14px/1 Figtree',
            }}
          >
            Lock · switch staff
          </button>
        </section>

        <section style={sheetSection}>
          <p style={sheetLabel}>This device</p>
          <p style={{ margin: 0, font: '400 13px/1.5 Figtree', color: KDS.roast }}>
            Kitchen display · {v.cafeName} · {v.terminalId}
            {v.deviceSetBy ? <span style={{ display: 'block', color: KDS.muted }}>{v.deviceSetBy}</span> : null}
          </p>
          <button
            type="button"
            onClick={() => {
              close();
              v.switchToCounter();
            }}
            style={{
              height: '48px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.16)',
              background: 'transparent',
              font: '600 14px/1 Figtree',
            }}
          >
            Switch to front counter
          </button>
          <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: KDS.muted }}>Needs a manager PIN. The device remembers its setup.</p>
        </section>

        {v.localNote ? <p style={{ margin: 0, font: '400 12px/1.45 Figtree', color: KDS.muted }}>{v.localNote}</p> : null}

        {v.devTools ? (
          <section style={{ display: 'grid', gap: '8px' }}>
            <p style={sheetLabel}>Development simulators</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {v.sims.map((sim) => (
                <button
                  key={sim.label}
                  type="button"
                  onClick={sim.run}
                  style={{
                    height: '44px',
                    borderRadius: '10px',
                    border: '1px dashed rgba(44,26,18,.25)',
                    background: 'transparent',
                    font: '600 13px/1 Figtree',
                  }}
                >
                  {sim.label}
                </button>
              ))}
            </div>
            <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: KDS.muted }}>
              Simulated in this development build only. No website, app or other device is connected.
            </p>
          </section>
        ) : null}
      </aside>
    </>
  );
}
