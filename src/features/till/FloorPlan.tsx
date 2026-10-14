import type { TillViewModel } from './till.view';

export function FloorPlan({ v }: { v: TillViewModel }) {
  return (
    <>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', font: '400 12px/1 Figtree', color: '#8C7A6E' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.2)' }}
          />
          Free
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#2C1A12' }} />
          Seated · open tab
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#E9C89E' }} />
          Reserved today
        </span>
        <span style={{ marginLeft: 'auto' }}>Tap a free table to start a dine-in order</span>
      </div>
      <div
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}
      >
        {v.zones.map((z, i) => (
          <section key={i}>
            <h2 style={{ margin: '0 0 10px', font: '500 15px/1 Newsreader,serif', color: '#8C7A6E', letterSpacing: '.02em' }}>{z.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '12px' }}>
              {z.tables.map((t, i1) => (
                <button
                  key={i1}
                  type="button"
                  onClick={t.pick}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '8px',
                    minHeight: '104px',
                    padding: '14px',
                    borderRadius: '14px',
                    textAlign: 'left',
                    background: t.bg,
                    color: t.fg,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', font: '600 16px/1 Figtree' }}>
                    <span>{t.id}</span>
                    <span style={{ font: '400 12px/1 Figtree', opacity: 0.7 }}>{t.seats} seats</span>
                  </span>
                  <span style={{ font: '400 12px/1.35 Figtree', opacity: 0.85 }}>{t.line1}</span>
                  <span style={{ marginTop: 'auto', font: '500 13px/1 Figtree' }}>{t.line2}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
