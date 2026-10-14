import type { TillViewModel } from './till.view';

export function CartBar({ v }: { v: TillViewModel }) {
  return (
    <>
      <button
        type="button"
        onClick={v.openCart}
        style={{
          position: 'fixed',
          left: '88px',
          right: '16px',
          bottom: '16px',
          zIndex: 25,
          height: '54px',
          borderRadius: '14px',
          border: 0,
          background: '#2C1A12',
          color: '#F5EDE2',
          font: '600 14px/1 Figtree',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          boxShadow: '0 10px 30px rgba(44,26,18,.25)',
        }}
      >
        <span>{v.barLabel}</span>
        <span style={{ font: '500 17px/1 Newsreader,serif' }}>{v.barValue}</span>
      </button>
    </>
  );
}
