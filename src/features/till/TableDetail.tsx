import type { TillViewModel } from './till.view';

export function TableDetail({ v }: { v: TillViewModel }) {
  return (
    <>
      <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid rgba(44,26,18,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, font: '500 20px/1 Newsreader,serif' }}>Today at {v.cafeName}</h2>
          {v.narrow ? (
            <button
              type="button"
              onClick={v.closeCart}
              aria-label="Close"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(44,26,18,.12)',
                background: 'transparent',
                font: '400 18px/1 Figtree',
                flex: 'none',
              }}
            >
              ×
            </button>
          ) : null}
        </div>
        <p style={{ margin: '6px 0 0', font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>{v.resSummary}</p>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 18px 18px' }}>
        {v.noRes ? (
          <p style={{ margin: '24px 0', textAlign: 'center', font: '400 13px/1.5 Figtree', color: '#8C7A6E' }}>No bookings today.</p>
        ) : null}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {v.todayRes.map((r, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: '1px solid rgba(44,26,18,.06)',
              }}
            >
              <span style={{ flex: 'none', width: '58px', font: '500 15px/1 Newsreader,serif' }}>{r.time}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 13px/1.3 Figtree' }}>{r.name}</span>
                <span style={{ display: 'block', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>{r.meta}</span>
              </span>
              <span
                style={{
                  height: '22px',
                  padding: '0 8px',
                  borderRadius: '11px',
                  background: r.bg,
                  color: r.fg,
                  font: '600 10px/22px Figtree',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                }}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
        <a
          href="#reservations"
          style={{ display: 'block', marginTop: '16px', textAlign: 'center', font: '500 13px/1 Figtree', color: '#8B5827' }}
        >
          Manage reservations →
        </a>
      </div>
    </>
  );
}
