import type { GiftView } from './guests.view';

export function GiftCards({ o }: { o: GiftView }) {
  if (o.liveGift) return (
    <section style={{ padding: '20px', borderRadius: '16px', background: '#FFFCF7' }}>
      <h2 style={{ marginTop: 0 }}>Use a customer's gift card</h2>
      <p>Select the customer on the till, open Payment, choose Gift card, then check the current balance.</p>
      <p>For refunds, open the original order. Funds return to the card used for that payment.</p>
      <p>Issue and top up gift cards in BOS.</p>
    </section>
  );
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '12px' }}>
        {o.giftKpis.map((k, i) => (
          <div
            key={i}
            style={{ padding: '16px 18px', borderRadius: '14px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}
          >
            <p style={{ margin: 0, font: '500 12px/1 Figtree', color: '#8C7A6E' }}>{k.label}</p>
            <p style={{ margin: '10px 0 0', font: '500 26px/1 Newsreader,serif' }}>{k.value}</p>
            <p style={{ margin: '8px 0 0', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{k.delta}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `minmax(0,1fr) ${o.detailCol}`, gap: '16px', alignItems: 'start' }}>
        <div style={{ borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', font: '400 13px/1.3 Figtree' }}>
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
                <th style={{ padding: '12px 16px' }}>Card</th>
                <th style={{ padding: '12px 8px' }}>Holder</th>
                <th style={{ padding: '12px 8px' }}>Issued</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Value</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {o.giftRows.map((g, i) => (
                <tr key={i} onClick={g.pick} style={{ cursor: 'pointer', background: g.bg, borderTop: '1px solid rgba(44,26,18,.06)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>···· {g.last4}</td>
                  <td style={{ padding: '12px 8px' }}>{g.holder}</td>
                  <td style={{ padding: '12px 8px', color: '#8C7A6E' }}>{g.issuedOn}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'Newsreader,serif' }}>{g.issuedS}</td>
                  <td
                    style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'Newsreader,serif', fontSize: '14px', color: g.balFg }}
                  >
                    {g.balanceS}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {o.gd ? (
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
            <div
              style={{
                padding: '18px',
                borderRadius: '14px',
                background: '#24150E',
                color: '#F5EDE2',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <img src="assets/brand/wordmark-white.png" alt="EightyTwenty" style={{ height: '14px', objectFit: 'contain' }} />
                <span style={{ font: '500 11px/1 Figtree', opacity: 0.7 }}>GIFT CARD</span>
              </div>
              <span style={{ font: '500 15px/1 Newsreader,serif', letterSpacing: '.08em' }}>{o.gd.code}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '400 12px/1 Figtree', opacity: 0.7 }}>Balance</span>
                <span style={{ font: '500 26px/1 Newsreader,serif' }}>{o.gd.balanceS}</span>
              </div>
            </div>
            <p style={{ margin: '12px 0 0', font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>{o.gd.meta}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="number"
                min="1"
                step="0.5"
                value={o.gd.amt}
                onChange={o.gd.setAmt}
                placeholder="Amount"
                style={{
                  flex: 1,
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />
              <button
                type="button"
                onClick={o.gd.redeem}
                style={{
                  height: '40px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: 0,
                  background: '#2C1A12',
                  color: '#F5EDE2',
                  font: '600 12px/1 Figtree',
                }}
              >
                Redeem
              </button>
              <button
                type="button"
                onClick={o.gd.topup}
                style={{
                  height: '40px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 12px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                Top up
              </button>
            </div>
            <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, font: '400 12px/1.4 Figtree' }}>
              {o.gd.history.map((h, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '7px 0',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                  }}
                >
                  <span>
                    <span style={{ color: '#8C7A6E', marginRight: '8px' }}>{h.d}</span>
                    {h.what}
                  </span>
                  <span style={{ fontFamily: 'Newsreader,serif', color: h.fg }}>{h.amtS}</span>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </>
  );
}
