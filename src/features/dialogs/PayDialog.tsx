import type { PayDialogView } from './money-dialogs.view';

export function PayDialog({ d }: { d: PayDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Payment"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(600px,calc(100vw - 32px))',
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
        <div
          style={{
            margin: '14px 0',
            padding: '16px',
            borderRadius: '14px',
            background: '#2C1A12',
            color: '#F5EDE2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '12px',
          }}
        >
          <span style={{ font: '400 12px/1.5 Figtree', opacity: 0.8 }}>
            Total {d.totalS} · GST incl. {d.gstS}
            {d.hasPaid ? (
              <>
                <br />
                Paid so far {d.paidS}
              </>
            ) : null}
          </span>
          <span style={{ textAlign: 'right' }}>
            <span
              style={{ display: 'block', font: '500 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.65 }}
            >
              Still due
            </span>
            <span style={{ display: 'block', marginTop: '6px', font: '500 30px/1 Newsreader,serif' }}>{d.remainingS}</span>
          </span>
        </div>
        {d.hasPaid ? (
          <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'grid', gap: '4px' }}>
            {d.ledger.map((p, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: '#EEF1E4',
                  font: '500 13px/1.3 Figtree',
                  color: '#3A2B24',
                }}
              >
                <span>
                  {p.label}
                  <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{p.sub}</span>
                </span>
                <span style={{ font: '500 15px/1 Newsreader,serif' }}>{p.amtS}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div
          role="tablist"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: '2px',
            padding: '3px',
            borderRadius: '10px',
            background: 'rgba(44,26,18,.06)',
          }}
        >
          {d.modes.map((m, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={m.on}
              onClick={m.pick}
              style={{
                height: '34px',
                border: 0,
                borderRadius: '8px',
                background: m.bg,
                color: m.fg,
                font: '500 12px/1 Figtree',
                whiteSpace: 'nowrap',
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
        {d.isEqual ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ font: '600 13px/1 Figtree' }}>Guests</span>
            <div style={{ display: 'flex', gap: '2px', padding: '3px', borderRadius: '10px', background: 'rgba(44,26,18,.06)' }}>
              {d.nOpts.map((k, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={k.pick}
                  style={{
                    width: '36px',
                    height: '30px',
                    border: 0,
                    borderRadius: '8px',
                    background: k.bg,
                    color: k.fg,
                    font: '500 13px/1 Figtree',
                  }}
                >
                  {k.k}
                </button>
              ))}
            </div>
            <span style={{ font: '500 13px/1 Figtree', color: '#8B5827' }}>{d.shareLabel}</span>
          </div>
        ) : null}
        {d.isItems ? (
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
            {d.itemRows.map((r, i) => (
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
                    {r.valS} each · {r.leftS}
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
            value={d.amountStr}
            onChange={d.setAmount}
            placeholder="Amount for this payment"
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
        <p style={{ margin: '14px 0 10px', display: 'flex', justifyContent: 'space-between', font: '600 13px/1 Figtree' }}>
          <span>This payment</span>
          <span style={{ font: '500 18px/1 Newsreader,serif' }}>{d.thisS}</span>
        </p>
        <div role="radiogroup" aria-label="Payment method" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
          {d.methods.map((m, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={m.on}
              onClick={m.pick}
              disabled={m.disabled}
              style={{
                height: '60px',
                borderRadius: '12px',
                border: `1px solid ${m.border}`,
                background: m.bg,
                color: m.fg,
                font: '600 13px/1.3 Figtree',
                opacity: m.opacity,
              }}
            >
              {m.name}
              <span style={{ display: 'block', font: '400 11px/1.3 Figtree', opacity: 0.75 }}>{m.sub}</span>
            </button>
          ))}
        </div>
        {d.isCash ? (
          <>
            {d.noShift ? (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#FBE9E4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  font: '500 13px/1.4 Figtree',
                  color: '#8A2E1C',
                }}
              >
                <span>No cash shift is open on this till.</span>
                <button
                  type="button"
                  onClick={d.openShift}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '9px',
                    border: 0,
                    background: '#2C1A12',
                    color: '#F5EDE2',
                    font: '600 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Open shift
                </button>
              </div>
            ) : null}
            {d.shiftOk ? (
              <>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {d.quick.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={q.pick}
                      style={{
                        height: '40px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,26,18,.12)',
                        background: '#F7F2EA',
                        font: '500 13px/1 Figtree',
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={d.tender}
                    onChange={d.setTender}
                    placeholder="Tendered"
                    style={{
                      width: '120px',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.12)',
                      background: '#F7F2EA',
                    }}
                  />
                </div>
                <p style={{ margin: '10px 0 0', display: 'flex', justifyContent: 'space-between', font: '500 13px/1.3 Figtree' }}>
                  <span>
                    Cash due {d.cashDueS} <span style={{ color: '#8C7A6E', fontWeight: 400 }}>{d.roundingS}</span>
                  </span>
                  <span>
                    Change <span style={{ font: '500 18px/1 Newsreader,serif', marginLeft: '6px' }}>{d.changeS}</span>
                  </span>
                </p>
              </>
            ) : null}
          </>
        ) : null}
        {d.isCard ? (
          <>
            {d.tipsOn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <span style={{ font: '600 13px/1 Figtree' }}>Tip</span>
                <div style={{ display: 'flex', gap: '2px', padding: '3px', borderRadius: '10px', background: 'rgba(44,26,18,.06)' }}>
                  {d.tips.map((tp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={tp.pick}
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        border: 0,
                        borderRadius: '8px',
                        background: tp.bg,
                        color: tp.fg,
                        font: '500 12px/1 Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
                <span style={{ font: '500 13px/1 Figtree', color: '#8B5827' }}>{d.tipS}</span>
              </div>
            ) : null}
            <p style={{ margin: '12px 0 0', font: '400 12px/1.45 Figtree', color: '#8C7A6E' }}>
              Card surcharge 2.95%: <strong style={{ color: '#2C1A12' }}>{d.surchargeS}</strong> · charged on the terminal.
              {d.canSimulateDecline ? (
                <>
                  {' '}
                  Simulated terminal — no real payment is taken.{' '}
                  <button
                    type="button"
                    onClick={d.declineNext}
                    style={{
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      font: '500 12px/1 Figtree',
                      color: '#8B5827',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    Simulate a decline
                  </button>
                </>
              ) : null}
            </p>
          </>
        ) : null}
        {d.isGift ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {d.liveGift ? <p style={{ flex: 1, margin: 0, alignSelf: 'center', font: '500 13px/1.4 Figtree' }}>{d.giftCustomerLabel}</p> : <input
                type="text"
                value={d.giftCode}
                onChange={d.setGiftCode}
                placeholder="Gift card number or last 4"
                style={{
                  flex: 1,
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />}
              <button
                type="button"
                disabled={d.processing || d.giftBlocked}
                onClick={d.checkGift}
                style={{
                  height: '42px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.giftChecking ? 'Checking…' : 'Check balance'}
              </button>
            </div>
            {d.giftLine ? <p style={{ margin: '8px 0 0', font: '500 13px/1.4 Figtree', color: '#3E6B47' }}>{d.giftLine}</p> : null}
          </>
        ) : null}
        {d.err ? (
          <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
            {d.err}
          </p>
        ) : null}
        <button
          type="button"
          onClick={d.confirm}
          disabled={d.confirmDisabled}
          style={{
            marginTop: '16px',
            width: '100%',
            height: '52px',
            borderRadius: '12px',
            border: 0,
            background: d.confirmBg,
            color: '#FFFCF7',
            font: '600 15px/1 Figtree',
          }}
        >
          {d.confirmLabel}
        </button>
        {d.closeNote ? (
          <p style={{ margin: '10px 0 0', textAlign: 'center', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{d.closeNote}</p>
        ) : null}
      </div>
    </>
  );
}
