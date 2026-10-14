import type { TillViewModel } from './till.view';

export function LiveOrders({ v }: { v: TillViewModel }) {
  return (
    <>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {v.chanFilters.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={f.pick}
            aria-pressed={f.on}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '18px',
              border: `1px solid ${f.border}`,
              background: f.bg,
              color: f.fg,
              font: '500 13px/1 Figtree',
              whiteSpace: 'nowrap',
            }}
          >
            {f.name}
          </button>
        ))}
        <span style={{ width: '1px', height: '22px', background: 'rgba(44,26,18,.12)', margin: '0 4px' }} />
        {v.statusFilters.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={f.pick}
            aria-pressed={f.on}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '18px',
              border: `1px solid ${f.border}`,
              background: f.bg,
              color: f.fg,
              font: '500 13px/1 Figtree',
              whiteSpace: 'nowrap',
            }}
          >
            {f.name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', font: '400 12px/1 Figtree', color: '#8C7A6E' }}>
          Today · {v.orderCount} orders · live from POS, website and app
        </span>
      </div>
      <div
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {v.orderRows.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={o.pick}
            aria-pressed={o.on}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 112px 72px 1fr auto auto',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '14px',
              background: o.bg,
              border: `1px solid ${o.border}`,
            }}
          >
            <span style={{ font: '500 14px/1 Newsreader,serif', color: '#8C7A6E' }}>{o.time}</span>
            <span style={{ font: '600 14px/1 Figtree' }}>{o.id}</span>
            <span
              style={{
                height: '22px',
                padding: '0 8px',
                borderRadius: '6px',
                background: o.chanBg,
                color: o.chanFg,
                font: '600 11px/22px Figtree',
                letterSpacing: '.04em',
                textAlign: 'center',
              }}
            >
              {o.chan}
            </span>
            <span
              style={{
                font: '400 13px/1.3 Figtree',
                color: '#3A2B24',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {o.summary}
            </span>
            <span style={{ font: '500 15px/1 Newsreader,serif' }}>{o.totalS}</span>
            <span
              style={{
                height: '24px',
                padding: '0 10px',
                borderRadius: '12px',
                background: o.stBg,
                color: o.stFg,
                font: '600 11px/24px Figtree',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                minWidth: '92px',
                textAlign: 'center',
              }}
            >
              {o.status}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
