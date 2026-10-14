import type { ReceiptDialogView } from './money-dialogs.view';

export function ReceiptDialog({ d }: { d: ReceiptDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paid"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(440px,calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '26px 24px 22px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '56px',
            height: '56px',
            margin: '0 auto',
            borderRadius: '50%',
            background: '#EEF1E4',
            color: '#3E6B47',
            font: '600 26px/1 Figtree',
          }}
        >
          ✓
        </span>
        <h2 style={{ margin: '14px 0 2px', font: '500 24px/1.1 Newsreader,serif' }}>Paid · {d.totalS}</h2>
        <p style={{ margin: 0, font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>{d.meta}</p>
        {d.changeS ? <p style={{ margin: '10px 0 0', font: '500 16px/1 Newsreader,serif' }}>{d.changeS}</p> : null}
        {d.loyalty ? (
          <p
            style={{
              margin: '12px 0 0',
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#F7F2EA',
              font: '500 13px/1.4 Figtree',
              color: '#8B5827',
            }}
          >
            {d.loyalty}
          </p>
        ) : null}
        <ul
          style={{
            listStyle: 'none',
            margin: '16px 0 0',
            padding: '14px 0 0',
            borderTop: '1px dashed rgba(44,26,18,.2)',
            textAlign: 'left',
            display: 'grid',
            gap: '6px',
            font: '400 13px/1.3 Figtree',
          }}
        >
          {d.lines.map((l, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <span>
                {l.qty} × {l.name}
              </span>
              <span style={{ fontFamily: 'Newsreader,serif' }}>{l.totalS}</span>
            </li>
          ))}
        </ul>
        <ul
          style={{
            listStyle: 'none',
            margin: '10px 0 0',
            padding: '10px 0 0',
            borderTop: '1px dashed rgba(44,26,18,.2)',
            textAlign: 'left',
            display: 'grid',
            gap: '6px',
            font: '500 13px/1.3 Figtree',
          }}
        >
          {d.pays.map((p, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <span>
                {p.label}
                <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{p.sub}</span>
              </span>
              <span style={{ fontFamily: 'Newsreader,serif' }}>{p.amtS}</span>
            </li>
          ))}
        </ul>
        {d.printState ? (
          <p role="status" style={{ margin: '12px 0 0', font: '500 13px/1.4 Figtree', color: d.printFg }}>
            {d.printState}
          </p>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '18px' }}>
          <button
            type="button"
            onClick={d.print}
            style={{
              height: '46px',
              borderRadius: '10px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              whiteSpace: 'nowrap',
            }}
          >
            {d.printLabel}
          </button>
          <button
            type="button"
            onClick={d.close}
            style={{
              height: '46px',
              borderRadius: '12px',
              border: 0,
              background: '#2C1A12',
              color: '#F5EDE2',
              font: '600 14px/1 Figtree',
              fontSize: '13px',
            }}
          >
            New order
          </button>
        </div>
      </div>
    </>
  );
}
