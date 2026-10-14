import type { DashboardView } from './dashboard.view';

export function Dashboard({ o }: { o: DashboardView }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '12px' }}>
        {o.kpis.map((k, i) => (
          <div
            key={i}
            style={{ padding: '16px 18px', borderRadius: '14px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}
          >
            <p style={{ margin: 0, font: '500 12px/1 Figtree', color: '#8C7A6E' }}>{k.label}</p>
            <p style={{ margin: '10px 0 0', font: '500 26px/1 Newsreader,serif' }}>{k.value}</p>
            <p style={{ margin: '8px 0 0', font: '400 12px/1.3 Figtree', color: k.deltaFg }}>{k.delta}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '16px' }}>
        <section style={{ padding: '18px 20px', borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Live orders</h2>
            <a href="#orders" style={{ font: '500 12px/1 Figtree', color: '#8B5827' }}>
              All orders →
            </a>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {o.liveOrders.map((row, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 0',
                  borderBottom: '1px solid rgba(44,26,18,.06)',
                  font: '400 13px/1.3 Figtree',
                }}
              >
                <span style={{ font: '500 13px/1 Newsreader,serif', color: '#8C7A6E', width: '56px' }}>{row.time}</span>
                <span
                  style={{
                    height: '20px',
                    padding: '0 7px',
                    borderRadius: '5px',
                    background: row.chanBg,
                    color: row.chanFg,
                    font: '600 10px/20px Figtree',
                    letterSpacing: '.04em',
                  }}
                >
                  {row.chan}
                </span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.summary}
                </span>
                <span
                  style={{
                    height: '20px',
                    padding: '0 8px',
                    borderRadius: '10px',
                    background: row.stBg,
                    color: row.stFg,
                    font: '600 10px/20px Figtree',
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section style={{ padding: '18px 20px', borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Today’s bookings</h2>
            <a href="#reservations" style={{ font: '500 12px/1 Figtree', color: '#8B5827' }}>
              Reservations →
            </a>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {o.dashRes.map((r, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 0',
                  borderBottom: '1px solid rgba(44,26,18,.06)',
                  font: '400 13px/1.3 Figtree',
                }}
              >
                <span style={{ font: '500 13px/1 Newsreader,serif', color: '#8C7A6E', width: '56px' }}>{r.time}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {r.name} · {r.guests} guests · {r.cafeName}
                </span>
                <span
                  style={{
                    height: '20px',
                    padding: '0 8px',
                    borderRadius: '10px',
                    background: r.bg,
                    color: r.fg,
                    font: '600 10px/20px Figtree',
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section style={{ padding: '18px 20px', borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Needs attention</h2>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
            {o.attention.map((a, i) => (
              <li key={i}>
                <a
                  href={a.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#F7F2EA',
                    font: '400 13px/1.35 Figtree',
                  }}
                >
                  <span style={{ flex: 1 }}>{a.text}</span>
                  <span style={{ font: '500 12px/1 Figtree', color: '#8B5827' }}>{a.cta}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
