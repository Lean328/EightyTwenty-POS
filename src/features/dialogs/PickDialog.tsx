import type { PickDialogView } from './till-dialogs.view';

export function PickDialog({ d }: { d: PickDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={d.title}
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(460px,calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
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
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '8px' }}>
          {d.rows.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={r.pick}
              aria-pressed={r.on}
              style={{
                minHeight: '56px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1px solid ${r.border}`,
                background: r.bg,
                color: r.fg,
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'block', font: '600 13px/1.3 Figtree' }}>{r.label}</span>
              <span style={{ display: 'block', marginTop: '3px', font: '400 11px/1.3 Figtree', opacity: 0.75 }}>{r.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
