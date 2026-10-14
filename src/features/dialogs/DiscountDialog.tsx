import type { DiscountDialogView } from './till-dialogs.view';

export function DiscountDialog({ d }: { d: DiscountDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Discounts"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(520px,calc(100vw - 32px))',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>Discounts &amp; redemptions</h2>
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
            }}
          >
            ×
          </button>
        </div>
        <div
          role="tablist"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: '2px',
            margin: '16px 0',
            padding: '3px',
            borderRadius: '10px',
            background: 'rgba(44,26,18,.06)',
          }}
        >
          {d.tabs.map((tb, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={tb.on}
              onClick={tb.pick}
              style={{ height: '36px', border: 0, borderRadius: '8px', background: tb.bg, color: tb.fg, font: '500 13px/1 Figtree' }}
            >
              {tb.name}
            </button>
          ))}
        </div>
        {d.isDiscount ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {d.presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={p.pick}
                  style={{
                    height: '52px',
                    borderRadius: '12px',
                    border: '1px solid rgba(44,26,18,.12)',
                    background: '#F7F2EA',
                    font: '500 14px/1.3 Figtree',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type="number"
                min="0"
                step="0.5"
                value={d.custom}
                onChange={d.setCustom}
                placeholder="Custom $ amount"
                style={{
                  flex: 1,
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />
              <button
                type="button"
                onClick={d.applyCustom}
                style={{
                  height: '44px',
                  padding: '0 18px',
                  borderRadius: '12px',
                  border: 0,
                  background: '#2C1A12',
                  color: '#F5EDE2',
                  font: '600 13px/1 Figtree',
                }}
              >
                Apply
              </button>
            </div>
          </>
        ) : null}
        {d.isPromo ? (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={d.code}
                onChange={d.setCode}
                placeholder="Promo or voucher code"
                style={{
                  flex: 1,
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="button"
                onClick={d.applyPromo}
                style={{
                  height: '44px',
                  padding: '0 18px',
                  borderRadius: '12px',
                  border: 0,
                  background: '#2C1A12',
                  color: '#F5EDE2',
                  font: '600 13px/1 Figtree',
                }}
              >
                Apply
              </button>
            </div>
            <p style={{ margin: '10px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
              Demo test codes only — not live EightyTwenty offers: WELCOME10 · LOCAL5 · KEEPCUP
            </p>
          </>
        ) : null}
        {d.isGift ? (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={d.code}
                onChange={d.setCode}
                placeholder="Gift card number or last 4 digits"
                style={{
                  flex: 1,
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />
              <button
                type="button"
                onClick={d.applyGift}
                style={{
                  height: '44px',
                  padding: '0 18px',
                  borderRadius: '12px',
                  border: 0,
                  background: '#2C1A12',
                  color: '#F5EDE2',
                  font: '600 13px/1 Figtree',
                }}
              >
                Check
              </button>
            </div>
            <p style={{ margin: '10px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
              Balance is applied to the total; the remainder is paid with another method.
            </p>
          </>
        ) : null}
        {d.isReward ? (
          <>
            <div style={{ padding: '16px', borderRadius: '12px', background: '#F7F2EA' }}>
              <p style={{ margin: 0, font: '600 14px/1.3 Figtree' }}>{d.rewardTitle}</p>
              <p style={{ margin: '6px 0 0', font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>{d.rewardBody}</p>
              <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                {d.dots.map((dot, i) => (
                  <span key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: dot }} />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={d.applyReward}
              disabled={d.rewardDisabled}
              style={{
                marginTop: '12px',
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: 0,
                background: d.rewardBtnBg,
                color: '#F5EDE2',
                font: '600 14px/1 Figtree',
              }}
            >
              Redeem free coffee
            </button>{' '}
          </>
        ) : null}
        {d.msg ? (
          <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: d.msgFg }}>
            {d.msg}
          </p>
        ) : null}
        {d.hasAny ? (
          <button
            type="button"
            onClick={d.clearAll}
            style={{
              marginTop: '14px',
              border: 0,
              background: 'transparent',
              font: '500 13px/1 Figtree',
              color: '#9A4436',
              padding: '6px 0',
            }}
          >
            Remove discount &amp; gift card from this order
          </button>
        ) : null}
      </div>
    </>
  );
}
