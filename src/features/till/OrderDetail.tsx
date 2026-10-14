import type { TillViewModel } from './till.view';

export function OrderDetail({ v }: { v: TillViewModel }) {
  return (
    <>
      {v.noOrderSel ? (
        <p style={{ margin: 'auto', padding: '40px', textAlign: 'center', font: '400 13px/1.5 Figtree', color: '#8C7A6E' }}>
          Select an order to see its lines, status and actions.
        </p>
      ) : null}
      {v.od ? (
        <>
          <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid rgba(44,26,18,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, font: '500 20px/1 Newsreader,serif' }}>{v.od.id}</h2>
              <span
                style={{
                  height: '24px',
                  padding: '0 10px',
                  borderRadius: '12px',
                  background: v.od.stBg,
                  color: v.od.stFg,
                  font: '600 11px/24px Figtree',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.od.status}
              </span>
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
            <p style={{ margin: '8px 0 0', font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>{v.od.meta}</p>
            {v.od.customer ? <p style={{ margin: '6px 0 0', font: '500 13px/1.4 Figtree', color: '#3A2B24' }}>{v.od.customer}</p> : null}
            {v.od.incoming ? (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#E9C89E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  font: '500 13px/1.3 Figtree',
                }}
              >
                <span style={{ flex: 1 }}>New online order — accept to send it to the kitchen.</span>
                <button
                  type="button"
                  onClick={v.od.reject}
                  style={{
                    height: '32px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(44,26,18,.2)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={v.od.accept}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 12px/1 Figtree',
                  }}
                >
                  Accept
                </button>
              </div>
            ) : null}
            {v.od.isFailed ? (
              <p
                style={{
                  margin: '10px 0 0',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#FBE9E4',
                  color: '#8A2E1C',
                  font: '500 13px/1.4 Figtree',
                }}
              >
                Payment was not captured online — do not prepare. Cancel it or contact the customer.
              </p>
            ) : null}
            {v.od.docketFailed ? (
              <p
                style={{
                  margin: '10px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: '#FBE9E4',
                  color: '#8A2E1C',
                  font: '500 12px/1.4 Figtree',
                }}
              >
                Kitchen docket failed to print
                <button
                  type="button"
                  onClick={v.od.retryDocket}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '7px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 11px/1 Figtree',
                  }}
                >
                  Retry
                </button>
              </p>
            ) : null}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 18px' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {v.od.lines.map((l, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(44,26,18,.06)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      flex: 'none',
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#ECE4D7',
                      font: '600 12px/24px Figtree',
                      textAlign: 'center',
                    }}
                  >
                    {l.qty}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, font: '500 13px/1.35 Figtree' }}>
                    {l.name}
                    {l.mods ? <span style={{ display: 'block', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>{l.mods}</span> : null}
                  </span>
                  <span style={{ font: '500 13px/1 Newsreader,serif' }}>{l.totalS}</span>
                </li>
              ))}
            </ul>
            <div
              style={{
                margin: '12px 0',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#F7F2EA',
                display: 'grid',
                gap: '6px',
                font: '400 13px/1 Figtree',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span>
                <span style={{ font: '500 16px/1 Newsreader,serif' }}>{v.od.totalS}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#8C7A6E' }}>
                <span>Payment</span>
                <span style={{ textAlign: 'right' }}>{v.od.payment}</span>
              </div>
              {v.od.refundLine ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9A4436' }}>
                  <span>Refunds</span>
                  <span>{v.od.refundLine}</span>
                </div>
              ) : null}
            </div>
            <ol style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'grid', gap: '6px' }}>
              {v.od.timeline.map((s, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: '10px',
                    font: '400 12px/1 Figtree',
                    color: s.fg,
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ font: '500 11px/1 Figtree', color: '#8C7A6E' }}>{s.state}</span>
                </li>
              ))}
            </ol>
            {v.od.hasHistory ? (
              <>
                <h3
                  style={{
                    margin: '4px 0 6px',
                    font: '600 11px/1 Figtree',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: '#9A8B80',
                  }}
                >
                  Activity
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '0 0 12px',
                    padding: 0,
                    display: 'grid',
                    gap: '5px',
                    font: '400 12px/1.4 Figtree',
                    color: '#574A40',
                  }}
                >
                  {v.od.history.map((hh, i) => (
                    <li key={i}>
                      <span style={{ color: '#9A8B80' }}>{hh.at}</span> · {hh.what}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div style={{ padding: '12px 18px 18px', display: 'grid', gap: '8px' }}>
            {v.od.canAdvance ? (
              <button
                type="button"
                onClick={v.od.advance}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: 0,
                  background: '#2C1A12',
                  color: '#F5EDE2',
                  font: '600 14px/1 Figtree',
                }}
              >
                {v.od.advanceLabel}
              </button>
            ) : null}
            {v.od.canPay ? (
              <button
                type="button"
                onClick={v.od.takePay}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: 0,
                  background: '#B67A4B',
                  color: '#FFFCF7',
                  font: '600 14px/1 Figtree',
                }}
              >
                Take payment
              </button>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={v.od.reorder}
                style={{
                  height: '38px',
                  borderRadius: '9px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 12px/1 Figtree',
                }}
              >
                Reorder
              </button>
              <button
                type="button"
                onClick={v.od.print}
                style={{
                  height: '38px',
                  borderRadius: '9px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 12px/1 Figtree',
                }}
              >
                Receipt
              </button>
              {v.od.canRefund ? (
                <button
                  type="button"
                  onClick={v.od.refund}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(154,68,54,.4)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    color: '#9A4436',
                  }}
                >
                  Refund
                </button>
              ) : null}
              {v.od.canVoid ? (
                <button
                  type="button"
                  onClick={v.od.voidItems}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(154,68,54,.4)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    color: '#9A4436',
                  }}
                >
                  Void items
                </button>
              ) : null}
              {v.od.canCancel ? (
                <button
                  type="button"
                  onClick={v.od.cancel}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(154,68,54,.4)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    color: '#9A4436',
                  }}
                >
                  Cancel order
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
