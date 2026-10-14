import type { PinDialogView } from './till-dialogs.view';

export function PinDialog({ d }: { d: PinDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manager PIN"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(380px,calc(100vw - 32px))',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>{d.title}</h2>
        <p style={{ margin: '8px 0 16px', font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>{d.body}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          {d.dots.map((dot, i) => (
            <span key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: dot }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {d.keys.map((k, i) => (
            <button
              key={i}
              type="button"
              onClick={k.pick}
              style={{
                height: '52px',
                borderRadius: '12px',
                border: '1px solid rgba(44,26,18,.1)',
                background: k.bg,
                font: '500 18px/1 Newsreader,serif',
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
        {d.err ? (
          <p role="alert" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
            {d.err}
          </p>
        ) : null}
        {d.hint ? <p style={{ margin: '14px 0 0', font: '400 11px/1.4 Figtree', color: '#9A8B80' }}>{d.hint}</p> : null}
      </div>
    </>
  );
}
