import type { StaffDialogView } from './till-dialogs.view';

export function StaffDialog({ d }: { d: StaffDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Staff"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(420px,calc(100vw - 32px))',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '24px',
        }}
      >
        <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>On shift · {d.cafeName}</h2>
        <p style={{ margin: '6px 0 14px', font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>
          Switch user with their PIN. Role controls refunds, discounts and back-office access.
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
          {d.rows.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={s.pick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${s.border}`,
                  background: s.bg,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#3A2B24',
                    color: '#F5EDE2',
                    display: 'grid',
                    placeItems: 'center',
                    font: '600 12px/1 Figtree',
                  }}
                >
                  {s.initials}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', font: '600 14px/1.3 Figtree' }}>{s.name}</span>
                  <span style={{ display: 'block', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{s.meta}</span>
                </span>
                <span style={{ font: '600 11px/1 Figtree', letterSpacing: '.05em', textTransform: 'uppercase', color: '#8B5827' }}>
                  {s.role}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
