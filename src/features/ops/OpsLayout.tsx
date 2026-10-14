import { FormDrawer } from './FormDrawer';
import { OpsSection } from './OpsSection';
import type { OpsShellView } from './ops.view';

export function OpsLayout({ v }: { v: OpsShellView }) {
  return (
    <>
      {/* ===== OPERATIONS ===== */}
      <div
        style={{ display: 'flex', minHeight: '100vh', background: '#F7F2EA', color: '#2C1A12', fontFamily: 'Figtree,system-ui,sans-serif' }}
      >
        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '18px 28px 14px',
              background: 'rgba(247,242,234,.92)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <h1 style={{ margin: 0, font: '500 26px/1.1 Newsreader,serif', letterSpacing: '-.01em' }}>{v.title}</h1>
            <span style={{ font: '400 13px/1 Figtree', color: '#8C7A6E' }}>{v.subtitle}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={v.toggleCafeMenu}
                  aria-haspopup="listbox"
                  aria-expanded={v.cafeMenu}
                  style={{
                    height: '40px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(44,26,18,.1)',
                    background: '#FFFCF7',
                    font: '500 13px/1 Figtree',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{v.scopeName}</span>
                  <span style={{ font: '400 11px/1 Figtree', color: '#9A8B80' }}>▾</span>
                </button>
                {v.cafeMenu ? (
                  <div
                    role="listbox"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      zIndex: 20,
                      width: '220px',
                      padding: '6px',
                      borderRadius: '12px',
                      background: '#FFFCF7',
                      border: '1px solid rgba(44,26,18,.08)',
                      boxShadow: '0 16px 40px rgba(44,26,18,.14)',
                      display: 'grid',
                      gap: '2px',
                      animation: 'fadeIn .15s ease',
                    }}
                  >
                    {v.cafes.map((l, i) => (
                      <button
                        key={i}
                        type="button"
                        role="option"
                        aria-selected={l.on}
                        onClick={l.pick}
                        style={{
                          height: '36px',
                          padding: '0 10px',
                          border: 0,
                          borderRadius: '8px',
                          background: l.bg,
                          color: l.fg,
                          font: '500 13px/1 Figtree',
                          textAlign: 'left',
                        }}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {v.simActions.map((sa, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={sa.go}
                  title="Mock intake — no real website or app is connected"
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px dashed rgba(44,26,18,.3)',
                    background: 'transparent',
                    color: '#4B2E26',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sa.label}
                </button>
              ))}
              {v.primaryAction ? (
                <button
                  type="button"
                  onClick={v.primaryAction.go}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '10px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 13px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {v.primaryAction.label}
                </button>
              ) : null}
            </div>
          </header>
          <div style={{ flex: 1, padding: '6px 28px 40px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <OpsSection route={v.route} />
          </div>
        </main>
        {/* Drawer forms */}
        {v.form ? <FormDrawer f={v.form} /> : null}
      </div>
    </>
  );
}
