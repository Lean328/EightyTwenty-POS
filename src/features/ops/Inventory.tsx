import type { InventoryView } from './inventory.view';

export function Inventory({ o }: { o: InventoryView }) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '2px',
          padding: '3px',
          borderRadius: '12px',
          background: 'rgba(44,26,18,.06)',
          width: 'max-content',
        }}
      >
        {o.invTabs.map((tb, i) => (
          <button
            key={i}
            type="button"
            onClick={tb.pick}
            aria-pressed={tb.on}
            style={{
              height: '36px',
              padding: '0 16px',
              border: 0,
              borderRadius: '9px',
              background: tb.bg,
              color: tb.fg,
              font: '500 13px/1 Figtree',
              whiteSpace: 'nowrap',
            }}
          >
            {tb.name}
          </button>
        ))}
      </div>
      {o.invItems ? (
        <>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              value={o.invQ}
              onChange={o.setInvQ}
              placeholder="Search items"
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid rgba(44,26,18,.1)',
                background: '#FFFCF7',
                width: '220px',
              }}
            />
            <span style={{ marginLeft: 'auto', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>
              Prices are GST-inclusive and shared with the app and website. Availability is per café.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {o.invCatChips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={c.pick}
                aria-pressed={c.on}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '16px',
                  border: `1px solid ${c.border}`,
                  background: c.bg,
                  color: c.fg,
                  font: '500 12px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div style={{ borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', font: '400 13px/1.3 Figtree' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    color: '#8C7A6E',
                    font: '600 11px/1 Figtree',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Item</th>
                  <th style={{ padding: '12px 8px' }}>Category</th>
                  <th style={{ padding: '12px 8px' }}>Modifiers</th>
                  <th style={{ padding: '12px 8px' }}>Price</th>
                  <th style={{ padding: '12px 16px 12px 8px' }}>Available · {o.invCafeName}</th>
                </tr>
              </thead>
              <tbody>
                {o.invRows.map((m, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(44,26,18,.06)', opacity: m.opacity }}>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            position: 'relative',
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#ECE4D7',
                            flex: 'none',
                            overflow: 'hidden',
                          }}
                        >
                          {m.img ? (
                            <span
                              role="img"
                              aria-label={m.name}
                              style={{ position: 'absolute', inset: 0, background: `#ECE4D7 url('${m.img}') center / ${m.fit} no-repeat` }}
                            />
                          ) : null}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 600 }}>{m.name}</span>
                          <span style={{ display: 'block', color: '#8C7A6E', fontSize: '12px' }}>{m.diet}</span>
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8C7A6E' }}>{m.catName}</td>
                    <td style={{ padding: '10px 8px', color: '#8C7A6E' }}>{m.mods}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={m.price}
                          disabled={!m.canEditPrice}
                          title={m.canEditPrice ? 'Edit branch price' : 'Owner/admin access required'}
                          onChange={m.setPrice}
                          onBlur={m.logPrice}
                          aria-label="Price"
                          style={{
                            width: '70px',
                            height: '32px',
                            padding: '0 8px',
                            borderRadius: '8px',
                            border: '1px solid rgba(44,26,18,.12)',
                            background: '#F7F2EA',
                            fontFamily: 'Newsreader,serif',
                            fontSize: '14px',
                          }}
                        />
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={m.on}
                        onClick={m.toggle}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: 0,
                          background: 'transparent',
                          padding: 0,
                          font: '500 12px/1 Figtree',
                          color: m.availFg,
                        }}
                      >
                        <span
                          style={{
                            width: '38px',
                            height: '22px',
                            borderRadius: '11px',
                            background: m.swBg,
                            position: 'relative',
                            display: 'inline-block',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: m.knob,
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#FFFCF7',
                              transition: 'left .15s ease',
                            }}
                          />
                        </span>
                        <span>{m.availLabel}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {o.invCats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '10px' }}>
          {o.catCards.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#FFFCF7',
                border: '1px solid rgba(44,26,18,.06)',
              }}
            >
              <span style={{ font: '500 18px/1 Newsreader,serif', color: '#9A8B80', width: '26px' }}>{c.n}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 14px/1.3 Figtree' }}>{c.name}</span>
                <span style={{ display: 'block', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{c.meta}</span>
              </span>
              <span style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={c.up}
                  aria-label="Move up"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    border: '1px solid rgba(44,26,18,.12)',
                    background: 'transparent',
                    font: '400 14px/1 Figtree',
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={c.down}
                  aria-label="Move down"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    border: '1px solid rgba(44,26,18,.12)',
                    background: 'transparent',
                    font: '400 14px/1 Figtree',
                  }}
                >
                  ↓
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {o.invMods ? (
        <>
          <p style={{ margin: 0, font: '400 12px/1.45 Figtree', color: '#8C7A6E' }}>
            Tap an option to switch it off on the till, app and website. {o.syncNote}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '12px' }}>
            {o.modGroups.map((g, i) => (
              <section
                key={i}
                style={{ padding: '16px 18px', borderRadius: '14px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h2 style={{ margin: 0, font: '500 16px/1 Newsreader,serif' }}>{g.name}</h2>
                  <span style={{ font: '400 11px/1 Figtree', color: '#8C7A6E' }}>{g.meta}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                  {g.opts.map((opt, i1) => (
                    <button
                      key={i1}
                      type="button"
                      onClick={opt.toggle}
                      title={opt.title}
                      aria-pressed={opt.off}
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        borderRadius: '15px',
                        background: opt.bg,
                        color: opt.fg,
                        border: '1px solid rgba(44,26,18,.08)',
                        font: '500 12px/1 Figtree',
                        textDecoration: opt.deco,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '10px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>Used by {g.used}</p>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
