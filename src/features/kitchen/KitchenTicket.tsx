import type { PrepStatus } from '../../domain/types';
import { KDS, type KitchenTicketView } from './kitchen.view';

function PrepMark({ prep }: { prep: PrepStatus }) {
  const ready = prep === 'ready';
  return (
    <span
      aria-hidden="true"
      style={{
        flex: 'none',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        border: ready ? 0 : `2px solid ${prep === 'preparing' ? KDS.caramel : 'rgba(44,26,18,.25)'}`,
        background: ready ? KDS.green : prep === 'preparing' ? 'rgba(182,122,75,.12)' : 'transparent',
      }}
    >
      {ready ? (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : prep === 'preparing' ? (
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: KDS.caramel }} />
      ) : null}
    </span>
  );
}

const STATE_CHIP: Record<PrepStatus, [string, string]> = {
  new: [KDS.linen, KDS.roast],
  preparing: ['rgba(182,122,75,.16)', KDS.caramelDark],
  ready: [KDS.greenBg, KDS.greenFg],
};

export function KitchenTicket({ t }: { t: KitchenTicketView }) {
  return (
    <article
      aria-label={`Order ${t.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        background: KDS.ivory,
        overflow: 'hidden',
        border: t.fresh ? `2px solid ${KDS.caramel}` : '1px solid rgba(44,26,18,.08)',
        boxShadow: t.fresh ? '0 0 0 4px rgba(182,122,75,.22)' : '0 1px 2px rgba(44,26,18,.04)',
        animation: t.fresh ? 'kdsArrive .5s cubic-bezier(.22,1,.36,1)' : undefined,
      }}
    >
      <header style={{ padding: '12px 14px 10px', background: t.barBg, color: t.barFg }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span
            style={{
              flex: 'none',
              font: '600 26px/1 Figtree',
              letterSpacing: '-.01em',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ font: '500 14px/1 Figtree', opacity: 0.7 }}>{t.prefix}</span>
            {t.number}
          </span>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '999px',
              background: t.chanBg,
              color: t.chanFg,
              font: '700 11px/1 Figtree',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 0 1px rgba(255,252,247,.25)',
            }}
          >
            {t.source}
          </span>
          <span
            aria-label={`Waiting ${t.elapsed}`}
            style={{ marginLeft: 'auto', font: '600 22px/1 Figtree', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
          >
            {t.elapsed}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', font: '500 15px/1.2 Figtree' }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.service}</span>
          {t.fresh ? (
            <span
              style={{
                marginLeft: 'auto',
                padding: '3px 7px',
                borderRadius: '6px',
                background: KDS.sand,
                color: KDS.espresso,
                font: '800 11px/1 Figtree',
                letterSpacing: '.08em',
              }}
            >
              NEW
            </span>
          ) : t.urgencyLabel ? (
            <span style={{ marginLeft: 'auto', font: '800 12px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              {t.urgencyLabel}
            </span>
          ) : null}
        </div>
      </header>

      {t.hold ? (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            background: t.hold.danger ? KDS.redBg : '#FBF0E1',
            color: t.hold.danger ? KDS.red : KDS.caramelDark,
            font: '700 14px/1.35 Figtree',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ flex: 1 }}>{t.hold.text}</span>
          {t.hold.accept ? (
            <button
              type="button"
              onClick={t.hold.accept}
              style={{
                height: '44px',
                padding: '0 18px',
                borderRadius: '10px',
                border: 0,
                background: KDS.espresso,
                color: KDS.foam,
                font: '700 14px/1 Figtree',
              }}
            >
              Accept
            </button>
          ) : null}
        </div>
      ) : null}

      {t.alerts.length ? (
        <div
          role="note"
          aria-label={t.allergy ? 'Allergy warning' : 'Dietary requirements'}
          style={{
            padding: '10px 14px',
            background: t.allergy ? KDS.red : KDS.redBg,
            color: t.allergy ? '#FFFFFF' : KDS.red,
            font: '700 14px/1.35 Figtree',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}
        >
          <span aria-hidden="true" style={{ font: '800 16px/1.1 Figtree' }}>
            ⚠
          </span>
          <span>
            <span style={{ display: 'block', font: '800 11px/1.2 Figtree', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              {t.allergy ? 'Allergy' : 'Dietary'}
            </span>
            {t.alerts.map((a) => a.text).join(' · ')}
          </span>
        </div>
      ) : null}

      {t.note || t.removed.length || t.queued ? (
        <div style={{ padding: '10px 14px 0', display: 'grid', gap: '6px' }}>
          {t.note ? <p style={{ margin: 0, font: 'italic 500 15px/1.35 Newsreader,serif', color: KDS.caramelDark }}>“{t.note}”</p> : null}
          {t.removed.length ? (
            <p style={{ margin: 0, font: '700 13px/1.35 Figtree', color: KDS.red }}>Changed · removed {t.removed.join(', ')}</p>
          ) : null}
          {t.queued ? (
            <p style={{ margin: 0, font: '500 12px/1.3 Figtree', color: KDS.muted }}>Created offline · not yet confirmed by the server</p>
          ) : null}
        </div>
      ) : null}

      <div style={{ padding: '6px 8px 10px', display: 'grid', gap: '4px' }}>
        {t.groups.map((g) => (
          <section key={g.station} aria-label={g.label}>
            {t.showGroupHeads ? (
              <h3
                style={{
                  margin: '8px 6px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  font: '700 12px/1 Figtree',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: KDS.muted,
                }}
              >
                {g.label}
                <span
                  style={{
                    padding: '4px 7px',
                    borderRadius: '6px',
                    background: STATE_CHIP[g.state][0],
                    color: STATE_CHIP[g.state][1],
                    letterSpacing: '.04em',
                    textTransform: 'none',
                    font: '600 11px/1 Figtree',
                  }}
                >
                  {g.stateLabel}
                </span>
                {g.action ? (
                  <button
                    type="button"
                    onClick={g.action.run}
                    aria-label={`${g.label}: ${g.action.label}`}
                    style={{
                      marginLeft: 'auto',
                      height: '34px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(44,26,18,.16)',
                      background: KDS.cream,
                      font: '700 12px/1 Figtree',
                      letterSpacing: '.02em',
                      textTransform: 'none',
                    }}
                  >
                    {g.action.label}
                  </button>
                ) : null}
              </h3>
            ) : null}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '2px' }}>
              {g.lines.map((l) => (
                <li key={l.key}>
                  <button
                    type="button"
                    onClick={l.toggle}
                    disabled={!l.canToggle}
                    aria-pressed={l.prep === 'ready'}
                    aria-label={`${l.qty}× ${l.name} · ${l.prepLabel}`}
                    style={{
                      width: '100%',
                      minHeight: '56px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 8px',
                      border: 0,
                      borderRadius: '10px',
                      background: l.prep === 'ready' ? 'rgba(62,107,71,.07)' : 'transparent',
                      textAlign: 'left',
                      cursor: l.canToggle ? 'pointer' : 'default',
                    }}
                  >
                    <span
                      style={{
                        flex: 'none',
                        minWidth: '36px',
                        height: '36px',
                        padding: '0 6px',
                        borderRadius: '9px',
                        background: l.qty > 1 ? KDS.espresso : KDS.linen,
                        color: l.qty > 1 ? KDS.foam : KDS.espresso,
                        font: '700 18px/36px Figtree',
                        textAlign: 'center',
                      }}
                    >
                      {l.qty}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, opacity: l.prep === 'ready' ? 0.55 : 1 }}>
                      <span
                        style={{
                          display: 'block',
                          font: '600 18px/1.25 Figtree',
                          color: KDS.espresso,
                          textDecoration: l.prep === 'ready' ? 'line-through' : 'none',
                        }}
                      >
                        {l.name}
                        {l.added ? (
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              background: KDS.sand,
                              font: '800 10px/1.4 Figtree',
                              letterSpacing: '.08em',
                              verticalAlign: 'middle',
                            }}
                          >
                            ADDED
                          </span>
                        ) : null}
                      </span>
                      {l.mods.map((m, i) => (
                        <span key={i} style={{ display: 'block', font: '500 15px/1.35 Figtree', color: KDS.caramelDark }}>
                          {m}
                        </span>
                      ))}
                      {l.diet.map((d, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-block',
                            margin: '4px 6px 0 0',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: d.severity === 'allergy' ? KDS.red : KDS.redBg,
                            color: d.severity === 'allergy' ? '#FFFFFF' : KDS.red,
                            font: '700 13px/1.3 Figtree',
                          }}
                        >
                          ⚠ {d.text}
                        </span>
                      ))}
                      {l.note && !l.diet.some((d) => d.text === l.note) ? (
                        <span style={{ display: 'block', font: 'italic 500 15px/1.35 Newsreader,serif', color: KDS.roast }}>
                          “{l.note}”
                        </span>
                      ) : null}
                    </span>
                    <PrepMark prep={l.prep} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {t.elsewhere ? <p style={{ margin: '0 14px 10px', font: '600 13px/1.3 Figtree', color: KDS.muted }}>{t.elsewhere}</p> : null}

      {t.primary ? (
        <div style={{ marginTop: 'auto', padding: '0 12px 12px' }}>
          <button
            type="button"
            onClick={t.primary.run}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '12px',
              border: 0,
              background: t.primary.tone === 'start' ? KDS.espresso : KDS.green,
              color: '#FFFFFF',
              font: '700 18px/1 Figtree',
              letterSpacing: '.01em',
            }}
          >
            {t.primary.label}
          </button>
        </div>
      ) : null}
    </article>
  );
}
