import type { CustomerDialogView } from './till-dialogs.view';

export function CustomerDialog({ d }: { d: CustomerDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Attach customer"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(520px,calc(100vw - 32px))',
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
        <div style={{ padding: '22px 22px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>Customer</h2>
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
          <input
            type="search"
            value={d.q}
            onChange={d.setQ}
            placeholder="Search name, phone or scan loyalty card…"
            autoFocus={true}
            style={{
              height: '44px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.12)',
              background: '#F7F2EA',
            }}
          />
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: '0 22px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {d.rows.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={c.pick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  border: 0,
                  borderBottom: '1px solid rgba(44,26,18,.06)',
                  background: 'transparent',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#ECE4D7',
                    display: 'grid',
                    placeItems: 'center',
                    font: '600 12px/1 Figtree',
                    color: '#3A2B24',
                    flex: 'none',
                  }}
                >
                  {c.initials}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', font: '600 14px/1.3 Figtree' }}>{c.name}</span>
                  <span style={{ display: 'block', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>{c.meta}</span>
                </span>
                <span aria-label={c.stampsLabel} style={{ display: 'flex', gap: '3px', flex: 'none' }}>
                  {c.dots.map((dot, i1) => (
                    <span key={i1} style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot }} />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div style={{ padding: '12px 22px 20px', display: 'flex', gap: '8px' }}>
          {d.hasCustomer ? (
            <button
              type="button"
              onClick={d.detachCustomer}
              style={{
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid rgba(44,26,18,.14)',
                background: 'transparent',
                font: '500 13px/1 Figtree',
                color: '#9A4436',
              }}
            >
              Detach
            </button>
          ) : null}
          <button
            type="button"
            onClick={d.walkin}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
            }}
          >
            Continue as walk-in
          </button>
        </div>
      </div>
    </>
  );
}
