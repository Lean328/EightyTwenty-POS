import type { OrdersView } from './orders.view';

export function OrdersBoard({ o }: { o: OrdersView }) {
  return (
    <>
      <div style={{ display: 'grid', gap: '10px' }}>
        <div
          role="tablist"
          aria-label="Order source"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: '4px',
            maxWidth: '560px',
            padding: '4px',
            borderRadius: '14px',
            background: 'rgba(44,26,18,.06)',
          }}
        >
          {o.orderSources.map((sr, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={sr.on}
              onClick={sr.pick}
              style={{
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 0,
                borderRadius: '11px',
                background: sr.bg,
                color: sr.fg,
                boxShadow: sr.shadow,
                font: `${sr.weight} 14px/1 Figtree`,
                cursor: 'pointer',
              }}
            >
              <span>{sr.name}</span>
              {sr.hasCount ? (
                <span
                  aria-label={sr.countLabel}
                  style={{
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    background: '#B67A4B',
                    color: '#FFFCF7',
                    font: '600 11px/20px Figtree',
                    textAlign: 'center',
                  }}
                >
                  {sr.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div
          role="tablist"
          aria-label="Order status"
          style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid rgba(44,26,18,.08)' }}
        >
          {o.orderFilters.map((f, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={f.on}
              onClick={f.pick}
              style={{
                height: '40px',
                padding: '0 12px',
                border: 0,
                borderBottom: `2px solid ${f.border}`,
                marginBottom: '-1px',
                background: 'transparent',
                color: f.fg,
                font: `${f.weight} 13px/1 Figtree`,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
        {o.srcNote ? <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#9A8B80' }}>{o.srcNote}</p> : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `minmax(0,1fr) ${o.detailCol}`, gap: '16px', alignItems: 'start' }}>
        <div style={{ borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: '400 13px/1.35 Figtree' }}>
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  color: '#8C7A6E',
                  font: '600 11px/1 Figtree',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}
              >
                <th style={{ padding: '12px 16px' }}>Time</th>
                <th style={{ padding: '12px 8px' }}>Order</th>
                <th style={{ padding: '12px 8px' }}>Customer</th>
                <th style={{ padding: '12px 8px' }}>Café</th>
                <th style={{ padding: '12px 8px' }}>Items</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '12px 8px' }}>Fulfilment</th>
                <th style={{ padding: '12px 16px 12px 8px' }}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {o.orderRows.map((row, i) => (
                <tr
                  key={i}
                  onClick={row.pick}
                  style={{ cursor: 'pointer', background: row.bg, borderTop: '1px solid rgba(44,26,18,.06)', verticalAlign: 'top' }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'Newsreader,serif', color: '#8C7A6E', whiteSpace: 'nowrap' }}>
                    {row.time}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.id}</td>
                  <td style={{ padding: '12px 8px', minWidth: '120px' }}>
                    <span style={{ display: 'block', fontWeight: 500 }}>{row.who}</span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#8C7A6E' }}>{row.type}</span>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#8C7A6E', whiteSpace: 'nowrap' }}>{row.cafeName}</td>
                  <td style={{ padding: '12px 8px', minWidth: '180px', maxWidth: '320px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {row.items}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      textAlign: 'right',
                      fontFamily: 'Newsreader,serif',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.totalS}
                  </td>
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', fontWeight: 500, color: row.fulFg }}>{row.fulfil}</td>
                  <td style={{ padding: '12px 16px 12px 8px', whiteSpace: 'nowrap', color: row.payFg }}>{row.pay}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {o.noOrders ? (
            <p
              style={{
                margin: 0,
                padding: '28px 16px',
                textAlign: 'center',
                font: '400 14px/1.4 Figtree',
                color: '#8C7A6E',
                borderTop: '1px solid rgba(44,26,18,.06)',
              }}
            >
              {o.ordersEmpty}
            </p>
          ) : null}
        </div>
        {o.od ? (
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
              <h2 style={{ margin: 0, font: '500 20px/1 Newsreader,serif' }}>{o.od.id}</h2>
              <button
                type="button"
                onClick={o.od.close}
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
            <p style={{ margin: '8px 0 0', font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>{o.od.meta}</p>
            {o.od.customer ? (
              <a href={o.od.customerHref} style={{ display: 'block', margin: '6px 0 0', font: '500 13px/1.4 Figtree', color: '#8B5827' }}>
                {o.od.customer} →
              </a>
            ) : null}
            <ul style={{ listStyle: 'none', margin: '12px 0', padding: 0 }}>
              {o.od.lines.map((l, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px 0',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                    font: '400 13px/1.35 Figtree',
                  }}
                >
                  <span
                    style={{
                      minWidth: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: '#ECE4D7',
                      font: '600 11px/22px Figtree',
                      textAlign: 'center',
                    }}
                  >
                    {l.qty}
                  </span>
                  <span style={{ flex: 1 }}>
                    {l.name}
                    {l.mods ? <span style={{ display: 'block', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>{l.mods}</span> : null}
                  </span>
                  <span style={{ fontFamily: 'Newsreader,serif' }}>{l.totalS}</span>
                </li>
              ))}
            </ul>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total (GST incl.)</span>
                <span style={{ font: '500 16px/1 Newsreader,serif' }}>{o.od.totalS}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8C7A6E' }}>
                <span>Payment</span>
                <span style={{ textAlign: 'right' }}>{o.od.payment}</span>
              </div>
              {o.od.refundLine ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9A4436' }}>
                  <span>Refunds</span>
                  <span>{o.od.refundLine}</span>
                </div>
              ) : null}
            </div>
            <p
              style={{
                margin: '10px 0 0',
                font: '600 10px/1 Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#8B5827',
              }}
            >
              {o.od.status}
            </p>
            {o.od.incoming ? (
              <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={o.od.reject}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(44,26,18,.14)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={o.od.accept}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 12px/1 Figtree',
                  }}
                >
                  Accept order
                </button>
              </div>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              {o.od.canAdvance ? (
                <button
                  type="button"
                  onClick={o.od.advance}
                  style={{
                    gridColumn: '1/-1',
                    height: '42px',
                    borderRadius: '10px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 13px/1 Figtree',
                  }}
                >
                  {o.od.advanceLabel}
                </button>
              ) : null}
              <button
                type="button"
                onClick={o.od.print}
                style={{
                  height: '38px',
                  borderRadius: '9px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 12px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                Receipt
              </button>
              {o.od.canRefund ? (
                <button
                  type="button"
                  onClick={o.od.refund}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(154,68,54,.4)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    color: '#9A4436',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Refund
                </button>
              ) : null}
              {o.od.canVoid ? (
                <button
                  type="button"
                  onClick={o.od.voidItems}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(154,68,54,.4)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    color: '#9A4436',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Void items
                </button>
              ) : null}
              {o.od.canCancel ? (
                <button
                  type="button"
                  onClick={o.od.cancel}
                  style={{
                    height: '38px',
                    borderRadius: '9px',
                    border: '1px solid rgba(154,68,54,.4)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    color: '#9A4436',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancel order
                </button>
              ) : null}
            </div>
            {o.od.hasHistory ? (
              <>
                <h3
                  style={{
                    margin: '14px 0 6px',
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
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gap: '5px',
                    font: '400 12px/1.4 Figtree',
                    color: '#574A40',
                  }}
                >
                  {o.od.history.map((hh, i) => (
                    <li key={i}>
                      <span style={{ color: '#9A8B80' }}>{hh.at}</span> · {hh.what}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </>
  );
}
