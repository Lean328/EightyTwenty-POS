import { Fragment } from 'react';
import type { CateringView } from './bookings.view';

export function Catering({ o }: { o: CateringView }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px' }}>
        {o.packages.map((p, i) => (
          <div
            key={i}
            style={{ padding: '16px 18px', borderRadius: '14px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}
          >
            <p style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>{p.id}</p>
            <p style={{ margin: '6px 0 0', font: '500 13px/1 Figtree', color: '#8B5827' }}>
              {p.price} {p.unit}
            </p>
            <p style={{ margin: '8px 0 0', font: '400 12px/1.45 Figtree', color: '#8C7A6E' }}>{p.blurb}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `minmax(0,1fr) ${o.detailCol}`, gap: '16px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {o.catRows.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={c.pick}
              style={{
                display: 'grid',
                gridTemplateColumns: '92px 1fr auto auto',
                gap: '14px',
                alignItems: 'center',
                textAlign: 'left',
                padding: '14px 18px',
                borderRadius: '14px',
                background: c.bg,
                border: `1px solid ${c.border}`,
              }}
            >
              <span>
                <span style={{ display: 'block', font: '500 15px/1 Newsreader,serif' }}>{c.date}</span>
                <span style={{ display: 'block', marginTop: '4px', font: '400 11px/1 Figtree', color: '#8C7A6E' }}>{c.time}</span>
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 14px/1.3 Figtree' }}>{c.name}</span>
                <span style={{ display: 'block', marginTop: '3px', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{c.meta}</span>
              </span>
              <span style={{ font: '500 16px/1 Newsreader,serif' }}>{c.quoteS}</span>
              <span
                style={{
                  height: '22px',
                  padding: '0 9px',
                  borderRadius: '11px',
                  background: c.stBg,
                  color: c.stFg,
                  font: '600 10px/22px Figtree',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                }}
              >
                {c.status}
              </span>
            </button>
          ))}
        </div>
        {o.cd ? (
          <aside
            style={{
              position: 'sticky',
              top: '84px',
              padding: '18px',
              borderRadius: '16px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.06)',
              animation: 'slideIn .2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, font: '500 20px/1 Newsreader,serif' }}>{o.cd.name}</h2>
              <button
                type="button"
                onClick={o.cd.close}
                aria-label="Close"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: 'transparent',
                  font: '400 18px/1 Figtree',
                }}
              >
                ×
              </button>
            </div>
            <dl
              style={{
                margin: '12px 0 0',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '6px 14px',
                font: '400 13px/1.4 Figtree',
              }}
            >
              {o.cd.rows.map((r, i) => (
                <Fragment key={i}>
                  <dt style={{ color: '#8C7A6E' }}>{r.k}</dt>
                  <dd style={{ margin: 0 }}>{r.v}</dd>
                </Fragment>
              ))}
            </dl>
            <div
              style={{ margin: '14px 0', padding: '12px 14px', borderRadius: '12px', background: '#F7F2EA', font: '400 13px/1 Figtree' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quote</span>
                <span style={{ font: '500 18px/1 Newsreader,serif' }}>{o.cd.quoteS}</span>
              </div>
              <p style={{ margin: '8px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{o.cd.quoteNote}</p>
            </div>
            <ol style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'flex', gap: '4px' }}>
              {o.cd.steps.map((s, i) => (
                <li key={i} title={s.label} style={{ flex: 1, height: '5px', borderRadius: '3px', background: s.bg }} />
              ))}
            </ol>
            <div style={{ display: 'grid', gap: '8px' }}>
              {o.cd.nextLabel ? (
                <button
                  type="button"
                  onClick={o.cd.advance}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 13px/1 Figtree',
                  }}
                >
                  {o.cd.nextLabel}
                </button>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={o.cd.edit}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(44,26,18,.14)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Edit
                </button>
                {o.cd.canCancel ? (
                  <button
                    type="button"
                    onClick={o.cd.cancel}
                    style={{
                      height: '38px',
                      borderRadius: '9px',
                      border: '1px solid rgba(154,68,54,.4)',
                      background: 'transparent',
                      font: '500 12px/1 Figtree',
                      color: '#9A4436',
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}
