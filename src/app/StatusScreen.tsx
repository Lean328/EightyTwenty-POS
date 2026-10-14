// Full-screen states shown before the till is ready: loading, failed to load, misconfigured, crashed.
import type { ReactNode } from 'react';

export function StatusScreen({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: { label: string; go: () => void };
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#F7F2EA',
        color: '#2C1A12',
        fontFamily: 'Figtree,system-ui,sans-serif',
      }}
    >
      <div style={{ width: 'min(460px,100%)', display: 'grid', gap: '14px', textAlign: 'center' }}>
        <p style={{ margin: 0, font: '500 12px/1 Figtree', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8B5827' }}>
          EightyTwenty POS
        </p>
        <h1 style={{ margin: 0, font: '500 26px/1.15 Newsreader,serif', letterSpacing: '-.01em' }}>{title}</h1>
        {children ? <div style={{ font: '400 14px/1.5 Figtree', color: '#574A40' }}>{children}</div> : null}
        {action ? (
          <button
            type="button"
            onClick={action.go}
            style={{
              justifySelf: 'center',
              height: '44px',
              padding: '0 20px',
              borderRadius: '12px',
              border: 0,
              background: '#2C1A12',
              color: '#F5EDE2',
              font: '600 14px/1 Figtree',
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </main>
  );
}
