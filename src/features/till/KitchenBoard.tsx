import type { TillViewModel } from './till.view';

export function KitchenBoard({ v }: { v: TillViewModel }) {
  return (
    <>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
          gap: '16px',
          paddingBottom: '24px',
        }}
      >
        {v.kitchenCols.map((col, i) => (
          <section key={i} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: '10px' }}>
            <h2
              style={{
                margin: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                font: '500 15px/1 Newsreader,serif',
                color: '#3A2B24',
                padding: '0 4px',
              }}
            >
              <span>{col.name}</span>
              <span style={{ font: '600 12px/1 Figtree', color: '#8C7A6E' }}>{col.count}</span>
            </h2>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.tickets.map((t, i1) => (
                <article
                  key={i1}
                  style={{
                    padding: '14px 14px 12px',
                    borderRadius: '14px',
                    background: '#FFFCF7',
                    border: '1px solid rgba(44,26,18,.06)',
                    borderTop: `3px solid ${t.accent}`,
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}
                  >
                    <span style={{ font: '600 14px/1 Figtree' }}>{t.id}</span>
                    <span style={{ font: '400 12px/1 Figtree', color: '#8C7A6E' }}>{t.meta}</span>
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
                    {t.lines.map((l, i2) => (
                      <li key={i2} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            flex: 'none',
                            minWidth: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: '#ECE4D7',
                            font: '600 12px/22px Figtree',
                            textAlign: 'center',
                          }}
                        >
                          {l.qty}
                        </span>
                        <span style={{ font: '500 13px/1.35 Figtree' }}>
                          {l.name}
                          {l.mods ? (
                            <span style={{ display: 'block', font: '400 12px/1.35 Figtree', color: '#8B5827' }}>{l.mods}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {t.docketFailed ? (
                    <p
                      style={{
                        margin: '10px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        font: '500 11px/1.3 Figtree',
                        color: '#9A4436',
                      }}
                    >
                      Docket not printed
                      <button
                        type="button"
                        onClick={t.retryDocket}
                        style={{
                          height: '26px',
                          padding: '0 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(154,68,54,.4)',
                          background: 'transparent',
                          color: '#9A4436',
                          font: '600 11px/1 Figtree',
                        }}
                      >
                        Retry
                      </button>
                    </p>
                  ) : null}
                  {t.incoming ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={t.reject}
                        style={{
                          height: '38px',
                          borderRadius: '9px',
                          border: '1px solid rgba(44,26,18,.16)',
                          background: 'transparent',
                          font: '500 13px/1 Figtree',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={t.accept}
                        style={{
                          height: '38px',
                          borderRadius: '9px',
                          border: 0,
                          background: '#2C1A12',
                          color: '#F5EDE2',
                          font: '600 13px/1 Figtree',
                        }}
                      >
                        Accept
                      </button>
                    </div>
                  ) : null}
                  {t.failed ? (
                    <>
                      <p style={{ margin: '10px 0 0', font: '500 12px/1.4 Figtree', color: '#8A2E1C' }}>
                        Payment not captured — do not prepare.
                      </p>
                      <button
                        type="button"
                        onClick={t.cancelFailed}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          height: '36px',
                          borderRadius: '9px',
                          border: '1px solid rgba(154,68,54,.4)',
                          background: 'transparent',
                          color: '#9A4436',
                          font: '600 12px/1 Figtree',
                        }}
                      >
                        Cancel order
                      </button>
                    </>
                  ) : null}{' '}
                  {t.normal ? (
                    <button
                      type="button"
                      onClick={t.bump}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        height: '38px',
                        borderRadius: '9px',
                        border: 0,
                        background: t.btnBg,
                        color: t.btnFg,
                        font: '600 13px/1 Figtree',
                      }}
                    >
                      {t.btn}
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
