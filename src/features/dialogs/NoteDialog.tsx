import type { NoteDialogView } from './till-dialogs.view';

export function NoteDialog({ d }: { d: NoteDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order note"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(440px,calc(100vw - 32px))',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 12px', font: '500 22px/1 Newsreader,serif' }}>Order note</h2>
        <textarea
          rows={3}
          value={d.text}
          onChange={d.set}
          placeholder="e.g. Allergy — coeliac at table. Bring cutlery for 4."
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(44,26,18,.12)',
            background: '#F7F2EA',
            resize: 'none',
          }}
        />{' '}
        <button
          type="button"
          onClick={d.close}
          style={{
            marginTop: '12px',
            width: '100%',
            height: '46px',
            borderRadius: '12px',
            border: 0,
            background: '#2C1A12',
            color: '#F5EDE2',
            font: '600 14px/1 Figtree',
          }}
        >
          Done
        </button>
      </div>
    </>
  );
}
