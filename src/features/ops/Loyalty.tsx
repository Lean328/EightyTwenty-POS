import type { LoyaltyView } from './guests.view';

export function Loyalty({ o }: { o: LoyaltyView }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '12px' }}>
        {o.loyKpis.map((k, i) => (
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: '16px', alignItems: 'start' }}>
        <section style={{ padding: '18px 20px', borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}>
          <h2 style={{ margin: '0 0 4px', font: '500 17px/1 Newsreader,serif' }}>Members</h2>
          <p style={{ margin: '0 0 10px', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
            Tap a member to add a stamp or redeem at the counter. Scanning the Apple Wallet pass does the same on the till.
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {o.loyRows.map((c, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '8px 12px',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(44,26,18,.06)',
                }}
              >
                <span style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <a href={c.href} style={{ display: 'block', font: '600 13px/1.3 Figtree' }}>
                    {c.name}
                  </a>
                  <span style={{ display: 'block', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{c.meta}</span>
                </span>
                <span role="img" aria-label={c.stampsLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 'none' }}>
                  {c.dots.map((d, i1) => (
                    <img
                      key={i1}
                      src="assets/nav/loyalty.png"
                      alt=""
                      width="17"
                      height="17"
                      draggable="false"
                      style={{
                        display: 'block',
                        width: '17px',
                        height: '17px',
                        objectFit: 'contain',
                        opacity: d.op,
                        transition: 'opacity .3s ease',
                      }}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  onClick={c.stamp}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(44,26,18,.14)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Stamp
                </button>
                <button
                  type="button"
                  onClick={c.redeem}
                  disabled={c.noReward}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: 0,
                    background: c.redeemBg,
                    color: '#F5EDE2',
                    font: '600 12px/1 Figtree',
                  }}
                >
                  Redeem
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: '#FFFCF7',
            border: '1px solid rgba(44,26,18,.06)',
            display: 'grid',
            gap: '12px',
          }}
        >
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Programme rules</h2>
          <p style={{ margin: 0, font: '400 12px/1.45 Figtree', color: '#8C7A6E' }}>Shared with the app and website.</p>
          <label
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', font: '500 13px/1 Figtree' }}
          >
            <span>Stamps per reward</span>
            <input
              type="number"
              min="4"
              max="12"
              value={o.loy.per}
              readOnly={o.loy.perReadOnly}
              onChange={o.loy.setPer}
              style={{
                width: '70px',
                height: '36px',
                padding: '0 10px',
                borderRadius: '9px',
                border: '1px solid rgba(44,26,18,.12)',
                background: '#F7F2EA',
                textAlign: 'center',
              }}
            />
          </label>
          <p style={{ margin: 0, padding: '10px 12px', borderRadius: '10px', background: '#F7F2EA', font: '400 13px/1.45 Figtree' }}>
            {o.loy.reward}
            <br />
            <span style={{ color: '#8C7A6E' }}>{o.loy.eligible}</span>
          </p>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '500 13px/1 Figtree' }}>
            <span>Apple Wallet / Google Wallet pass</span>
            <button
              type="button"
              role="switch"
              aria-checked={o.loy.wallet}
              onClick={o.loy.toggleWallet}
              style={{ width: '44px', height: '26px', borderRadius: '13px', border: 0, background: o.loy.walletBg, position: 'relative' }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: o.loy.walletKnob,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#FFFCF7',
                  transition: 'left .15s ease',
                }}
              />
            </button>
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '500 13px/1 Figtree' }}>
            <span>Stamps on app &amp; web orders</span>
            <button
              type="button"
              role="switch"
              aria-checked={o.loy.online}
              onClick={o.loy.toggleOnline}
              style={{ width: '44px', height: '26px', borderRadius: '13px', border: 0, background: o.loy.onlineBg, position: 'relative' }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: o.loy.onlineKnob,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#FFFCF7',
                  transition: 'left .15s ease',
                }}
              />
            </button>
          </label>
          <h3
            style={{ margin: '8px 0 0', font: '600 12px/1 Figtree', letterSpacing: '.06em', textTransform: 'uppercase', color: '#8C7A6E' }}
          >
            Recent activity
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, font: '400 12px/1.4 Figtree' }}>
            {o.loyHistory.map((h, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '6px 0',
                  borderTop: '1px solid rgba(44,26,18,.06)',
                }}
              >
                <span>{h.what}</span>
                <span style={{ color: '#8C7A6E', whiteSpace: 'nowrap' }}>{h.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
