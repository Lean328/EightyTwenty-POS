import type { ReservationsView } from './bookings.view';

export function Reservations({ o }: { o: ReservationsView }) {
  return (
    <>
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {o.resDays.map((dy, i) => (
          <button
            key={i}
            type="button"
            onClick={dy.pick}
            aria-pressed={dy.on}
            style={{
              flex: 'none',
              minWidth: '88px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: `1px solid ${dy.border}`,
              background: dy.bg,
              color: dy.fg,
              textAlign: 'left',
            }}
          >
            <span
              style={{ display: 'block', font: '600 11px/1 Figtree', letterSpacing: '.06em', textTransform: 'uppercase', opacity: 0.7 }}
            >
              {dy.dow}
            </span>
            <span style={{ display: 'block', marginTop: '6px', font: '500 18px/1 Newsreader,serif' }}>{dy.day}</span>
            <span style={{ display: 'block', marginTop: '6px', font: '400 11px/1 Figtree', opacity: 0.8 }}>{dy.meta}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '16px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {o.resClosed ? (
            <p
              style={{
                margin: 0,
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#FBE9E4',
                color: '#8A2E1C',
                font: '500 13px/1.4 Figtree',
              }}
            >
              {o.resClosed}
            </p>
          ) : null}
          {o.noResRows ? (
            <p style={{ margin: '30px 0', textAlign: 'center', color: '#8C7A6E', font: '400 13px/1.5 Figtree' }}>
              No bookings for this day.
            </p>
          ) : null}
          {o.resRows.map((r, i) => (
            <article
              key={i}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px 14px',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: '14px',
                background: '#FFFCF7',
                border: '1px solid rgba(44,26,18,.06)',
              }}
            >
              <span style={{ flex: 'none', width: '72px', font: '500 17px/1 Newsreader,serif' }}>{r.time}</span>
              <span style={{ flex: '1 1 220px', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '600 14px/1.3 Figtree' }}>
                  <span>{r.name}</span>
                  <span
                    style={{
                      height: '20px',
                      padding: '0 8px',
                      borderRadius: '10px',
                      background: r.bg,
                      color: r.fg,
                      font: '600 10px/20px Figtree',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {r.status}
                  </span>
                </span>
                <span style={{ display: 'block', marginTop: '4px', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{r.meta}</span>
              </span>
              <span style={{ flex: 'none', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                {r.actions.map((a, i1) => (
                  <button
                    key={i1}
                    type="button"
                    onClick={a.go}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: `1px solid ${a.border}`,
                      background: a.bg,
                      color: a.fg,
                      font: '500 12px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </span>
            </article>
          ))}
        </div>
        <aside style={{ padding: '18px', borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}>
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Availability · {o.resCafeName}</h2>
          <p style={{ margin: '6px 0 12px', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
            {o.resHours} · last booking 30 min before close · 16 covers per 30 min
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
            {o.resSlots.map((sl, i) => (
              <span
                key={i}
                title={sl.title}
                style={{
                  height: '34px',
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  font: '500 12px/1 Figtree',
                  background: sl.bg,
                  color: sl.fg,
                  textDecoration: sl.deco,
                }}
              >
                {sl.label}
              </span>
            ))}
          </div>
          {o.resNoSlots ? <p style={{ margin: 0, font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>Closed — no slots.</p> : null}
        </aside>
      </div>
    </>
  );
}
