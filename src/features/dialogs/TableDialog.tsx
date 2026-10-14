import type { TableDialogView } from './money-dialogs.view';

export function TableDialog({ d }: { d: TableDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Table"
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
        <p style={{ margin: '6px 0 0', font: '500 13px/1.4 Figtree', color: '#3A2B24' }}>{d.meta}</p>
        {d.stateLine ? <p style={{ margin: '4px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{d.stateLine}</p> : null}
        {d.hasOrder ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
              {d.canPay ? (
                <>
                  <button
                    type="button"
                    onClick={d.pay}
                    style={{
                      height: '44px',
                      borderRadius: '10px',
                      border: 0,
                      background: '#B67A4B',
                      color: '#FFFCF7',
                      font: '600 13px/1 Figtree',
                    }}
                  >
                    Take payment
                  </button>
                  <button
                    type="button"
                    onClick={d.split}
                    style={{
                      height: '44px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Split bill by item
                  </button>
                </>
              ) : null}
              {d.canClear ? (
                <button
                  type="button"
                  onClick={d.clear}
                  style={{
                    gridColumn: '1/-1',
                    height: '46px',
                    borderRadius: '12px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 14px/1 Figtree',
                  }}
                >
                  Mark table available
                </button>
              ) : null}
              <button
                type="button"
                onClick={d.view}
                style={{
                  gridColumn: '1/-1',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                Open order
              </button>
            </div>
            <h3
              style={{
                margin: '16px 0 8px',
                font: '600 12px/1 Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#8C7A6E',
              }}
            >
              Move to
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {d.moveTo.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={c.go}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    borderRadius: '17px',
                    border: '1px solid rgba(44,26,18,.14)',
                    background: '#F7F2EA',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <h3
              style={{
                margin: '14px 0 8px',
                font: '600 12px/1 Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#8C7A6E',
              }}
            >
              Join another table
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {d.joinWith.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={c.go}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    borderRadius: '17px',
                    border: '1px solid rgba(44,26,18,.14)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + {c.label}
                </button>
              ))}
            </div>
            {d.hasJoined ? (
              <>
                <h3
                  style={{
                    margin: '14px 0 8px',
                    font: '600 12px/1 Figtree',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: '#8C7A6E',
                  }}
                >
                  Separate
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {d.joined.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={c.go}
                      style={{
                        height: '34px',
                        padding: '0 12px',
                        borderRadius: '17px',
                        border: '1px solid rgba(154,68,54,.4)',
                        background: 'transparent',
                        color: '#9A4436',
                        font: '500 12px/1 Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Separate {c.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
        {d.hasRes ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={d.seat}
              style={{
                height: '46px',
                borderRadius: '12px',
                border: 0,
                background: '#2C1A12',
                color: '#F5EDE2',
                font: '600 14px/1 Figtree',
              }}
            >
              Seat reservation
            </button>
            <button
              type="button"
              onClick={d.walkIn}
              style={{
                height: '46px',
                borderRadius: '10px',
                border: '1px solid rgba(44,26,18,.14)',
                background: 'transparent',
                font: '500 13px/1 Figtree',
                whiteSpace: 'nowrap',
              }}
            >
              Walk-in order
            </button>
          </div>
        ) : null}
        {d.isFree ? (
          <button
            type="button"
            onClick={d.start}
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
            Start dine-in order
          </button>
        ) : null}
      </div>
    </>
  );
}
