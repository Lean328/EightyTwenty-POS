export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        padding: '10px 16px',
        borderRadius: '10px',
        background: '#2C1A12',
        color: '#F5EDE2',
        font: '500 13px/1 Figtree',
        boxShadow: '0 8px 24px rgba(44,26,18,.25)',
        animation: 'toastIn .2s ease',
      }}
    >
      {message}
    </div>
  );
}
