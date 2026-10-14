import type { TillViewModel } from './till.view';

export function MenuGrid({ v }: { v: TillViewModel }) {
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          role="tablist"
          aria-label="Categories"
          style={{ flex: 1, minWidth: 0, display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}
        >
          {v.rail.map((c, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              onClick={c.pick}
              aria-selected={c.on}
              style={{
                flex: 'none',
                height: '38px',
                padding: '0 14px',
                borderRadius: '10px',
                border: 0,
                background: c.chipBg,
                color: c.chipFg,
                font: `${c.weight} 13px/1 Figtree`,
                whiteSpace: 'nowrap',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={v.toggleFilters}
          aria-expanded={v.filtersOpen}
          style={{
            flex: 'none',
            height: '38px',
            padding: '0 14px',
            borderRadius: '10px',
            border: `1px solid ${v.filterBorder}`,
            background: '#FFFCF7',
            color: '#2C1A12',
            font: '500 13px/1 Figtree',
            whiteSpace: 'nowrap',
          }}
        >
          {v.filterLabel}
        </button>
        {v.filtersOpen ? (
          <div
            role="menu"
            style={{
              position: 'absolute',
              right: 0,
              top: '46px',
              zIndex: 20,
              width: '220px',
              padding: '6px',
              borderRadius: '12px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.08)',
              boxShadow: '0 16px 40px rgba(44,26,18,.14)',
              display: 'grid',
              gap: '2px',
              animation: 'fadeIn .15s ease',
            }}
          >
            {v.filters.map((f, i) => (
              <button
                key={i}
                type="button"
                role="menuitemradio"
                aria-checked={f.on}
                onClick={f.pick}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: '38px',
                  padding: '0 12px',
                  border: 0,
                  borderRadius: '8px',
                  background: f.bg,
                  color: '#2C1A12',
                  font: '500 13px/1 Figtree',
                  textAlign: 'left',
                }}
              >
                <span>{f.name}</span>
                <span style={{ color: '#8B5827' }}>{f.mark}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 2px 24px' }}>
        {v.noResults ? (
          <div
            style={{
              margin: '40px 0',
              display: 'grid',
              justifyItems: 'center',
              gap: '12px',
              textAlign: 'center',
              color: '#8C7A6E',
              font: '400 14px/1.5 Figtree',
            }}
          >
            <span>{v.emptyMsg}</span>
            {v.hasFilter ? (
              <button
                type="button"
                onClick={v.clearFilter}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '9px',
                  border: '1px solid rgba(44,26,18,.16)',
                  background: 'transparent',
                  font: '500 13px/1 Figtree',
                }}
              >
                Clear filter
              </button>
            ) : null}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(178px,1fr))', gap: '12px' }}>
          {v.products.map((p, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={p.open}
              aria-label={p.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '14px',
                background: '#FFFCF7',
                border: '1px solid rgba(44,26,18,.07)',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: p.opacity,
              }}
              className="hover-accent-border"
            >
              {p.showMedia ? (
                <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#ECE4D7', display: 'grid', placeItems: 'center' }}>
                  {p.img ? (
                    <div
                      role="img"
                      aria-label={p.name}
                      style={{ position: 'absolute', inset: 0, background: `#ECE4D7 url('${p.img}') center / ${p.fit} no-repeat` }}
                    />
                  ) : null}
                  {p.noImg ? (
                    <span aria-hidden="true" style={{ font: '500 11px/1.3 Figtree', color: '#9A8B80' }}>
                      Photo to come
                    </span>
                  ) : null}
                  {p.soldOut ? (
                    <span
                      style={{
                        position: 'absolute',
                        inset: 'auto 0 0 0',
                        padding: '6px',
                        textAlign: 'center',
                        background: 'rgba(44,26,18,.8)',
                        color: '#F5EDE2',
                        font: '600 12px/1 Figtree',
                      }}
                    >
                      Sold out
                    </span>
                  ) : null}
                  {p.inCart ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        minWidth: '24px',
                        height: '24px',
                        padding: '0 7px',
                        borderRadius: '12px',
                        background: '#2C1A12',
                        color: '#F5EDE2',
                        font: '600 12px/24px Figtree',
                        textAlign: 'center',
                      }}
                    >
                      {p.inCart}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div style={{ padding: '10px 12px 12px', display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ font: '600 14px/1.25 Figtree', minWidth: 0 }}>{p.name}</span>
                  <span style={{ font: '600 14px/1 Figtree', flex: 'none' }}>{p.priceS}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ display: 'flex', gap: '4px', minHeight: '20px', alignItems: 'center' }}>
                    {p.tags.map((tg, i1) => (
                      <span
                        key={i1}
                        style={{
                          height: '20px',
                          padding: '0 6px',
                          borderRadius: '5px',
                          background: '#EEF1E4',
                          color: '#4E6538',
                          font: '600 10px/20px Figtree',
                        }}
                      >
                        {tg}
                      </span>
                    ))}
                    {p.compactCount ? <span style={{ font: '500 12px/1 Figtree', color: '#8B5827' }}>{p.inCart} in order</span> : null}
                  </span>
                  {p.canQuick ? (
                    <button
                      type="button"
                      onClick={p.quick}
                      aria-label={`Add ${p.name}`}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: 0,
                        background: '#2C1A12',
                        color: '#F5EDE2',
                        font: '600 12px/1 Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + Add
                    </button>
                  ) : null}
                  {p.needsOpts ? (
                    <span
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(44,26,18,.18)',
                        color: '#2C1A12',
                        font: '600 12px/30px Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Customise
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
