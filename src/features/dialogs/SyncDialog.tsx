import type { SyncDialogView } from './money-dialogs.view';

export function SyncDialog({ d }: { d: SyncDialogView }) {
  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connection and sync"
        style={{
          position: 'fixed',
          zIndex: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(520px,calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          background: '#FFFCF7',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(44,26,18,.3)',
          animation: 'popIn .22s cubic-bezier(.22,1,.36,1)',
          padding: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>Connection &amp; sync</h2>
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
        <p style={{ margin: '12px 0 0', display: 'flex', gap: '10px', alignItems: 'flex-start', font: '500 13px/1.45 Figtree' }}>
          {d.statusLine}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: d.canToggle ? '1fr 1fr' : '1fr', gap: '8px', marginTop: '12px' }}>
          {d.canToggle ? (
            <button
              type="button"
              onClick={d.toggle}
              style={{
                height: '42px',
                borderRadius: '10px',
                border: '1px solid rgba(44,26,18,.14)',
                background: 'transparent',
                font: '500 13px/1 Figtree',
                whiteSpace: 'nowrap',
              }}
            >
              {d.toggleLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={d.syncNow}
            style={{ height: '42px', borderRadius: '10px', border: 0, background: '#2C1A12', color: '#F5EDE2', font: '600 13px/1 Figtree' }}
          >
            Retry sync now
          </button>
        </div>
        {d.hasConflicts ? (
          <>
            <h3
              style={{
                margin: '16px 0 8px',
                font: '600 12px/1 Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#9A4436',
              }}
            >
              Needs attention
            </h3>
            {d.conflicts.map((c, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: '12px', background: '#FBE9E4', marginBottom: '6px' }}>
                <p style={{ margin: 0, font: '500 13px/1.4 Figtree', color: '#8A2E1C' }}>{c.msg}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={c.keep}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: 0,
                      background: '#2C1A12',
                      color: '#F5EDE2',
                      font: '600 12px/1 Figtree',
                    }}
                  >
                    It was served
                  </button>
                  <button
                    type="button"
                    onClick={c.cancel}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(154,68,54,.4)',
                      background: 'transparent',
                      color: '#9A4436',
                      font: '500 12px/1 Figtree',
                    }}
                  >
                    Refund it
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : null}
        {d.hasQueue ? (
          <>
            <h3
              style={{
                margin: '16px 0 8px',
                font: '600 12px/1 Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#8C7A6E',
              }}
            >
              Waiting to sync
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {d.queue.map((q, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 0',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                    font: '500 13px/1.3 Figtree',
                  }}
                >
                  <span>{q.label}</span>
                  <span style={{ font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{q.at}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <h3
          style={{ margin: '16px 0 8px', font: '600 12px/1 Figtree', letterSpacing: '.06em', textTransform: 'uppercase', color: '#8C7A6E' }}
        >
          {d.devTools ? 'Devices (simulated)' : 'Devices'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {d.devices.map((dv, i) => (
            <span
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '9px',
                background: '#F7F2EA',
                font: '500 12px/1.3 Figtree',
              }}
            >
              <span>{dv.name}</span>
              <span
                style={{
                  height: '18px',
                  padding: '0 7px',
                  borderRadius: '9px',
                  background: dv.bg,
                  color: dv.fg,
                  font: '600 10px/18px Figtree',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                }}
              >
                {dv.state}
              </span>
            </span>
          ))}
        </div>
        {d.devTools ? (
          <>
            <h3
              style={{
                margin: '16px 0 8px',
                font: '600 12px/1 Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#8C7A6E',
              }}
            >
              Simulate website &amp; app orders
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={d.simWeb}
                style={{
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                New website order
              </button>
              <button
                type="button"
                onClick={d.simApp}
                style={{
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                New app order
              </button>
              <button
                type="button"
                onClick={d.simDup}
                style={{
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                Duplicate app order
              </button>
              <button
                type="button"
                onClick={d.simFail}
                style={{
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                Failed-payment order
              </button>
            </div>
          </>
        ) : null}
        {d.hasLog ? (
          <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, font: '400 12px/1.4 Figtree', color: '#574A40' }}>
            {d.log.map((lg, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '6px 0',
                  borderTop: '1px solid rgba(44,26,18,.06)',
                }}
              >
                <span>{lg.msg}</span>
                <span style={{ color: '#9A8B80', whiteSpace: 'nowrap' }}>{lg.at}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p style={{ margin: '14px 0 0', font: '400 11px/1.4 Figtree', color: '#9A8B80' }}>
          {d.devTools
            ? 'Network, devices and online orders are simulated in this development build. No real payment, printer or integration is connected.'
            : 'The card terminal, printers and cash drawer are not connected to this till yet. Changes sync to the EightyTwenty server.'}
        </p>
      </div>
    </>
  );
}
