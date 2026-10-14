import type { TillViewModel } from './till.view';

export function HeldOrders({ v }: { v: TillViewModel }) {
  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '24px' }}>
        {v.noHeld ? (
          <p style={{ margin: '40px 0', textAlign: 'center', color: '#8C7A6E' }}>
            No held orders. Use <strong>Hold</strong> on the cart to park an order and come back to it.
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '14px' }}>
          {v.heldRows.map((h, i) => (
            <article
              key={i}
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: '#FFFCF7',
                border: '1px solid rgba(44,26,18,.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '600 14px/1 Figtree' }}>{h.label}</span>
                <span style={{ font: '400 12px/1 Figtree', color: '#8C7A6E' }}>{h.time}</span>
              </div>
              <p style={{ margin: 0, font: '400 13px/1.4 Figtree', color: '#3A2B24' }}>{h.summary}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ font: '500 16px/1 Newsreader,serif' }}>{h.totalS}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={h.drop}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 12px/1 Figtree',
                      color: '#9A4436',
                    }}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={h.reopen}
                    style={{
                      height: '34px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: 0,
                      background: '#2C1A12',
                      color: '#F5EDE2',
                      font: '600 12px/1 Figtree',
                    }}
                  >
                    Reopen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
