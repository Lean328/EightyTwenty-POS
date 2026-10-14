import type { OrderActionDialogView } from './money-dialogs.view';

export function OrderActionDialog({ d }: { d: OrderActionDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order correction"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(520px,calc(100vw - 32px))',
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
        {d.block ? (
          <p
            style={{
              margin: '14px 0 0',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#FBE9E4',
              color: '#8A2E1C',
              font: '500 13px/1.4 Figtree',
            }}
          >
            {d.block}
          </p>
        ) : null}
        {d.ok ? (
          <>
            {d.isRefund ? (
              <>
                <p style={{ margin: '8px 0 12px', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
                  Paid {d.paidS} · refunded {d.refundedS} · up to {d.refundableS} left
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2px',
                    padding: '3px',
                    borderRadius: '10px',
                    background: 'rgba(44,26,18,.06)',
                  }}
                >
                  {d.byOpts.map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={b.pick}
                      style={{ height: '32px', border: 0, borderRadius: '8px', background: b.bg, color: b.fg, font: '500 12px/1 Figtree' }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {d.showItems ? (
              <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
                {d.rows.map((r, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(44,26,18,.06)',
                      opacity: r.dim,
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0, font: '500 13px/1.3 Figtree' }}>
                      {r.name}
                      <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>
                        {r.valS} each · {r.maxS}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 'none' }}>
                      <button
                        type="button"
                        onClick={r.dec}
                        aria-label="Fewer"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: '1px solid #B67A4B',
                          background: 'transparent',
                          color: '#8B5827',
                          font: '400 16px/1 Figtree',
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '16px', textAlign: 'center', font: '600 13px/1 Figtree' }}>{r.q}</span>
                      <button
                        type="button"
                        onClick={r.inc}
                        aria-label="More"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: '1px solid #B67A4B',
                          background: 'transparent',
                          color: '#8B5827',
                          font: '400 16px/1 Figtree',
                        }}
                      >
                        +
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {d.isAmount ? (
              <input
                type="number"
                min="0"
                step="0.05"
                value={d.amount}
                onChange={d.setAmount}
                placeholder="Refund amount"
                style={{
                  marginTop: '12px',
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />
            ) : null}
            <h3 style={{ margin: '16px 0 8px', font: '600 13px/1 Figtree' }}>Reason</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#F7F2EA',
                font: '400 13px/1.45 Figtree',
              }}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Refund</span>
                <span style={{ font: '500 18px/1 Newsreader,serif' }}>{d.refundS}</span>
              </span>
              <span style={{ display: 'block', marginTop: '4px', color: '#8C7A6E' }}>{d.toLine}</span>
            </div>
            {d.permNote ? <p style={{ margin: '10px 0 0', font: '500 12px/1.4 Figtree', color: '#8B5827' }}>{d.permNote}</p> : null}
            {d.err ? (
              <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
                {d.err}
              </p>
            ) : null}
            <button
              type="button"
              onClick={d.confirm}
              style={{
                marginTop: '14px',
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: 0,
                background: '#9A4436',
                color: '#FFFCF7',
                font: '600 14px/1 Figtree',
              }}
            >
              {d.cta}
            </button>{' '}
          </>
        ) : null}
      </div>
    </>
  );
}
