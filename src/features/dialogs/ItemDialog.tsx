import type { ItemDialogView } from './till-dialogs.view';

export function ItemDialog({ d }: { d: ItemDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={d.name}
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(620px,calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', padding: '22px 22px 14px', borderBottom: '1px solid rgba(44,26,18,.06)' }}>
          <div
            style={{
              position: 'relative',
              width: '84px',
              height: '84px',
              borderRadius: '14px',
              background: '#ECE4D7',
              flex: 'none',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
            }}
          >
            {d.img ? (
              <div
                role="img"
                aria-label={d.name}
                style={{ position: 'absolute', inset: 0, background: `#ECE4D7 url('${d.img}') center / ${d.fit} no-repeat` }}
              />
            ) : null}
            {d.noImg ? (
              <span
                aria-hidden="true"
                style={{
                  font: '600 8px/1.2 ui-monospace,Menlo,monospace',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: '#9A8B80',
                  textAlign: 'center',
                }}
              >
                No photo
              </span>
            ) : null}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, font: '500 22px/1.15 Newsreader,serif' }}>{d.name}</h2>
              <span style={{ font: '500 18px/1 Newsreader,serif' }}>{d.priceS}</span>
            </div>
            <p
              style={{
                margin: '6px 0 0',
                font: '400 13px/1.45 Figtree',
                color: '#8C7A6E',
                display: '-webkit-box',
                WebkitLineClamp: '3',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {d.desc}
            </p>
          </div>
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
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '6px 22px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {d.groups.map((g, i) => (
            <section key={i}>
              <h3 style={{ margin: '14px 0 10px', display: 'flex', alignItems: 'baseline', gap: '8px', font: '600 13px/1 Figtree' }}>
                <span>{g.name}</span>
                <span style={{ font: '400 12px/1 Figtree', color: g.hintFg }}>{g.hint}</span>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {g.options.map((o, i1) => (
                  <button
                    key={i1}
                    type="button"
                    onClick={o.pick}
                    aria-pressed={o.on}
                    disabled={o.disabled}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '19px',
                      border: `1px solid ${o.border}`,
                      background: o.bg,
                      color: o.fg,
                      font: '500 13px/1 Figtree',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      opacity: o.op,
                    }}
                  >
                    <span>{o.label}</span>
                    {o.priceS ? <span style={{ font: '400 12px/1 Figtree', opacity: 0.75 }}>{o.priceS}</span> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
          <section>
            <h3 style={{ margin: '14px 0 10px', font: '600 13px/1 Figtree' }}>
              Dietary adjustments <span style={{ font: '400 12px/1 Figtree', color: '#9A8B80' }}>optional</span>
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {d.adjust.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={o.pick}
                  aria-pressed={o.on}
                  style={{
                    height: '38px',
                    padding: '0 14px',
                    borderRadius: '19px',
                    border: `1px solid ${o.border}`,
                    background: o.bg,
                    color: o.fg,
                    font: '500 13px/1 Figtree',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', margin: '0 0 8px', font: '600 13px/1 Figtree' }}>Note for kitchen</span>
            <textarea
              rows={2}
              value={d.note}
              onChange={d.setNote}
              placeholder="e.g. sauce on the side"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(44,26,18,.12)',
                background: '#F7F2EA',
                resize: 'none',
                fontSize: '13px',
              }}
            />
          </label>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 22px 20px',
            borderTop: '1px solid rgba(44,26,18,.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={d.dec}
              aria-label="Decrease"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid #B67A4B',
                background: 'transparent',
                color: '#8B5827',
                font: '400 20px/1 Figtree',
              }}
            >
              −
            </button>
            <span style={{ minWidth: '22px', textAlign: 'center', font: '600 16px/1 Figtree' }}>{d.qty}</span>
            <button
              type="button"
              onClick={d.inc}
              aria-label="Increase"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid #B67A4B',
                background: 'transparent',
                color: '#8B5827',
                font: '400 20px/1 Figtree',
              }}
            >
              +
            </button>
          </div>
          {d.isEdit ? (
            <button
              type="button"
              onClick={d.remove}
              style={{
                height: '46px',
                padding: '0 14px',
                borderRadius: '12px',
                border: '1px solid rgba(154,68,54,.4)',
                background: 'transparent',
                font: '500 13px/1 Figtree',
                color: '#9A4436',
              }}
            >
              Remove
            </button>
          ) : null}
          <button
            type="button"
            onClick={d.add}
            disabled={d.disabled}
            style={{
              flex: 1,
              height: '50px',
              borderRadius: '12px',
              border: 0,
              background: d.btnBg,
              color: '#F5EDE2',
              font: '600 15px/1 Figtree',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
            }}
          >
            <span>{d.btn}</span>
            <span style={{ font: '500 17px/1 Newsreader,serif' }}>{d.totalS}</span>
          </button>
        </div>
      </div>
    </>
  );
}
