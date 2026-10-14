import { Fragment } from 'react';
import type { ShiftDialogView } from './money-dialogs.view';

export function ShiftDialog({ d }: { d: ShiftDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shift"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(480px,calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>{d.title}</h2>
          <button
            type="button"
            onClick={d.close}
            aria-label="Close"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(44,26,18,.12)',
              background: 'transparent',
              font: '400 20px/1 Figtree',
              flex: 'none',
            }}
          >
            ×
          </button>
        </div>
        {d.isOpen ? (
          <>
            <p style={{ margin: '8px 0 14px', font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>
              Count the opening float into the drawer. Cash sales, refunds and movements are tracked against it until you close the shift.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {d.presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={p.pick}
                  aria-pressed={p.on}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '18px',
                    border: `1px solid ${p.border}`,
                    background: p.bg,
                    color: p.fg,
                    font: '500 13px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label}
                </button>
              ))}
              <input
                type="number"
                min="0"
                step="0.05"
                value={d.float}
                onChange={d.setFloat}
                aria-label="Opening float"
                style={{
                  width: '120px',
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />
            </div>
            {d.err ? (
              <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
                {d.err}
              </p>
            ) : null}
            <button
              type="button"
              onClick={d.open}
              style={{
                marginTop: '16px',
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: 0,
                background: '#2C1A12',
                color: '#F5EDE2',
                font: '600 14px/1 Figtree',
              }}
            >
              Open shift
            </button>{' '}
          </>
        ) : null}
        {d.isManage ? (
          <>
            <p style={{ margin: '6px 0 12px', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{d.meta}</p>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#F7F2EA',
                display: 'grid',
                gap: '6px',
                font: '400 13px/1 Figtree',
              }}
            >
              {d.rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#574A40' }}>{r.k}</span>
                  <span>{r.v}</span>
                </div>
              ))}
              <div style={{ height: '1px', borderTop: '1px dashed rgba(44,26,18,.18)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600 }}>Expected in drawer</span>
                <span style={{ font: '500 20px/1 Newsreader,serif' }}>{d.expectedS}</span>
              </div>
            </div>
            {d.isIdle ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={d.goIn}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Cash in
                  </button>
                  <button
                    type="button"
                    onClick={d.goOut}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Cash out
                  </button>
                  <button
                    type="button"
                    onClick={d.noSale}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open drawer
                  </button>
                </div>
                {d.hasMoves ? (
                  <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
                    {d.moves.map((m, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '8px 0',
                          borderTop: '1px solid rgba(44,26,18,.06)',
                          font: '500 13px/1.3 Figtree',
                        }}
                      >
                        <span>
                          {m.label}
                          <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{m.sub}</span>
                        </span>
                        <span style={{ fontFamily: 'Newsreader,serif' }}>{m.amtS}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={d.goClose}
                  style={{
                    marginTop: '14px',
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 14px/1 Figtree',
                  }}
                >
                  Count drawer &amp; close shift
                </button>{' '}
              </>
            ) : null}
            {d.isMove ? (
              <>
                <h3 style={{ margin: '16px 0 8px', font: '600 13px/1 Figtree' }}>{d.moveTitle}</h3>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  value={d.amt}
                  onChange={d.setAmt}
                  placeholder="Amount"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(44,26,18,.12)',
                    background: '#F7F2EA',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {d.reasons.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={r.pick}
                      aria-pressed={r.on}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: '18px',
                        border: `1px solid ${r.border}`,
                        background: r.bg,
                        color: r.fg,
                        font: '500 13px/1 Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {d.err ? (
                  <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
                    {d.err}
                  </p>
                ) : null}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={d.back}
                    style={{
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={d.confirmMove}
                    style={{
                      flex: 1,
                      height: '46px',
                      borderRadius: '12px',
                      border: 0,
                      background: '#2C1A12',
                      color: '#F5EDE2',
                      font: '600 14px/1 Figtree',
                    }}
                  >
                    Record {d.moveTitle}
                  </button>
                </div>
              </>
            ) : null}
            {d.isClose ? (
              <>
                <h3 style={{ margin: '16px 0 8px', font: '600 13px/1 Figtree' }}>Counted cash</h3>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  value={d.counted}
                  onChange={d.setCounted}
                  placeholder="Total counted in drawer"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(44,26,18,.12)',
                    background: '#F7F2EA',
                  }}
                />
                <p style={{ margin: '10px 0 0', display: 'flex', justifyContent: 'space-between', font: '600 13px/1 Figtree' }}>
                  <span>Variance</span>
                  <span style={{ font: '500 18px/1 Newsreader,serif', color: d.varFg }}>{d.varianceS}</span>
                </p>
                {d.bigNote ? <p style={{ margin: '8px 0 0', font: '500 12px/1.4 Figtree', color: '#9A4436' }}>{d.bigNote}</p> : null}
                <textarea
                  rows={2}
                  value={d.noteText}
                  onChange={d.setNote}
                  placeholder="Note (required if the variance is over $5)"
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(44,26,18,.12)',
                    background: '#F7F2EA',
                    resize: 'none',
                    fontSize: '13px',
                  }}
                />
                {d.err ? (
                  <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
                    {d.err}
                  </p>
                ) : null}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={d.back}
                    style={{
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={d.confirmClose}
                    style={{
                      flex: 1,
                      height: '46px',
                      borderRadius: '12px',
                      border: 0,
                      background: '#2C1A12',
                      color: '#F5EDE2',
                      font: '600 14px/1 Figtree',
                    }}
                  >
                    Close shift
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : null}
        {d.isSummary ? (
          <>
            <dl
              style={{
                margin: '14px 0 0',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 16px',
                font: '400 13px/1.4 Figtree',
              }}
            >
              {d.rows.map((r, i) => (
                <Fragment key={i}>
                  <dt style={{ color: '#8C7A6E' }}>{r.k}</dt>
                  <dd style={{ margin: 0, textAlign: 'right' }}>{r.v}</dd>
                </Fragment>
              ))}
            </dl>
            <button
              type="button"
              onClick={d.close}
              style={{
                marginTop: '18px',
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: 0,
                background: '#2C1A12',
                color: '#F5EDE2',
                font: '600 14px/1 Figtree',
              }}
            >
              Done
            </button>{' '}
          </>
        ) : null}
      </div>
    </>
  );
}
