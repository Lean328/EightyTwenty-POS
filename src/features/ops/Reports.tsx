import { Fragment } from 'react';
import type { ReportsView } from './reports.view';

export function Reports({ o }: { o: ReportsView }) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section
          aria-label="Summary"
          style={{
            borderRadius: '18px',
            background: '#FFFCF7',
            border: '1px solid rgba(44,26,18,.07)',
            minWidth: 0,
            padding: '26px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px 40px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
              {o.repLead.label}
            </p>
            <p style={{ margin: '12px 0 0', font: '400 50px/1 Newsreader,serif', letterSpacing: '-.02em', color: '#2C1A12' }}>
              {o.repLead.value}
            </p>
            <p style={{ margin: '10px 0 0', font: '500 13px/1.3 Figtree', color: '#5E6754' }}>{o.repLead.delta}</p>
          </div>
          <div style={{ flex: '3 1 440px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '22px 28px' }}>
            {o.repSub.map((k, i) => (
              <div key={i} style={{ minWidth: 0, paddingTop: '14px', borderTop: '1px solid rgba(44,26,18,.08)' }}>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  {k.label}
                </p>
                <p style={{ margin: '12px 0 0', font: '400 26px/1 Newsreader,serif', color: '#2C1A12' }}>{k.value}</p>
                <p style={{ margin: '8px 0 0', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>{k.delta}</p>
              </div>
            ))}
          </div>
        </section>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
          <section
            style={{
              padding: '24px 26px',
              borderRadius: '18px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.07)',
              minWidth: 0,
              flex: '2 1 480px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '8px 16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  Revenue
                </p>
                <h2 style={{ margin: '8px 0 0', font: '400 24px/1.1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                  Daily sales
                </h2>
              </div>
              <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E', textAlign: 'right' }}>{o.daily.summary}</p>
            </div>
            <div onMouseLeave={o.daily.leave} style={{ position: 'relative', height: '264px' }}>
              <div style={{ position: 'absolute', left: '52px', right: '8px', top: '28px', bottom: '32px' }}>
                {o.daily.grid.map((g, i) => (
                  <div
                    key={i}
                    style={{ position: 'absolute', left: 0, right: 0, top: g.top, height: 0, borderTop: '1px solid rgba(44,26,18,.07)' }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        right: 'calc(100% + 12px)',
                        top: '-7px',
                        font: '500 11px/14px Figtree',
                        color: '#8C7A6E',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {g.label}
                    </span>
                  </div>
                ))}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                >
                  <path d={o.daily.area} style={{ fill: '#77816B', fillOpacity: '.09', stroke: 'none' }} />
                  <path
                    d={o.daily.line}
                    style={{
                      fill: 'none',
                      stroke: '#77816B',
                      strokeWidth: '2',
                      strokeLinejoin: 'round',
                      strokeLinecap: 'round',
                      vectorEffect: 'non-scaling-stroke',
                    }}
                  />
                  <path
                    d={o.daily.dash}
                    style={{
                      fill: 'none',
                      stroke: '#77816B',
                      strokeWidth: '2',
                      strokeDasharray: '4 5',
                      strokeLinecap: 'round',
                      vectorEffect: 'non-scaling-stroke',
                    }}
                  />
                </svg>{' '}
                {o.daily.tip ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-28px',
                      bottom: 0,
                      left: o.daily.tip.left,
                      width: 0,
                      borderLeft: '1px dashed rgba(44,26,18,.28)',
                      pointerEvents: 'none',
                    }}
                  />
                ) : null}{' '}
                {o.daily.pts.map((p, i) => (
                  <Fragment key={i}>
                    <span
                      style={{
                        position: 'absolute',
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        transform: 'translate(-50%,-50%)',
                        boxSizing: 'border-box',
                        borderRadius: '50%',
                        background: p.bg,
                        border: '2px solid #77816B',
                        transition: 'width .15s ease,height .15s ease',
                        pointerEvents: 'none',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: p.left,
                        top: 'calc(100% + 12px)',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        font: `${p.labW} 11px/1 Figtree`,
                        color: p.labFg,
                      }}
                    >
                      {p.d} {p.dateS}
                    </span>
                    <button
                      type="button"
                      aria-label={p.aria}
                      onMouseEnter={p.enter}
                      onFocus={p.enter}
                      onBlur={o.daily.leave}
                      style={{
                        position: 'absolute',
                        top: '-28px',
                        bottom: '-32px',
                        left: p.zoneLeft,
                        width: p.zoneW,
                        padding: 0,
                        border: 0,
                        background: 'transparent',
                        cursor: 'crosshair',
                      }}
                    />
                  </Fragment>
                ))}
                {o.daily.tip ? (
                  <div
                    role="status"
                    style={{
                      position: 'absolute',
                      zIndex: 2,
                      left: o.daily.tip.left,
                      top: o.daily.tip.top,
                      transform: o.daily.tip.tf,
                      minWidth: '184px',
                      padding: '13px 15px',
                      borderRadius: '12px',
                      background: '#2C1A12',
                      color: '#F7F2EA',
                      boxShadow: '0 12px 32px rgba(44,26,18,.16)',
                      pointerEvents: 'none',
                    }}
                  >
                    <p style={{ margin: 0, font: '500 12px/1.2 Figtree', color: 'rgba(247,242,234,.72)' }}>{o.daily.tip.title}</p>
                    <p style={{ margin: '7px 0 0', font: '400 26px/1 Newsreader,serif' }}>{o.daily.tip.value}</p>
                    <p style={{ margin: '7px 0 0', font: '400 12px/1.35 Figtree', color: 'rgba(247,242,234,.82)' }}>{o.daily.tip.sub}</p>
                    <p style={{ margin: '3px 0 0', font: '500 12px/1.35 Figtree', color: o.daily.tip.chFg }}>{o.daily.tip.chS}</p>
                  </div>
                ) : null}
              </div>
            </div>
            <p
              style={{
                margin: '14px 0 0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 18px',
                font: '400 12px/1.3 Figtree',
                color: '#8C7A6E',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '18px', height: 0, borderTop: '2px solid #77816B' }} />
                Completed day
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '18px', height: 0, borderTop: '2px dashed #77816B' }} />
                Today, trading in progress
              </span>
              <span>GST incl.</span>
            </p>
          </section>
          <section
            style={{
              padding: '24px 26px',
              borderRadius: '18px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.07)',
              minWidth: 0,
              flex: '1 1 320px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '8px 16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  Revenue
                </p>
                <h2 style={{ margin: '8px 0 0', font: '400 24px/1.1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                  Weekly sales
                </h2>
              </div>
              <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E', textAlign: 'right' }}>{o.weekAvgS}</p>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {o.weekRows.map((w, i) => (
                <li
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px minmax(0,1fr) auto',
                    gap: '14px',
                    alignItems: 'center',
                    padding: '15px 0',
                    borderTop: '1px solid rgba(44,26,18,.07)',
                  }}
                >
                  <span style={{ font: '600 13px/1.2 Figtree', color: '#2C1A12' }}>{w.w}</span>
                  <span
                    style={{ position: 'relative', display: 'block', height: '8px', borderRadius: '4px', background: 'rgba(44,26,18,.06)' }}
                  >
                    <span
                      style={{
                        display: 'block',
                        height: '100%',
                        width: w.pct,
                        borderRadius: '4px',
                        background: w.bar,
                        transition: 'width .6s ease',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        bottom: '-5px',
                        left: w.avgPct,
                        borderLeft: '1px dashed rgba(44,26,18,.4)',
                      }}
                    />
                  </span>
                  <span style={{ minWidth: '84px', textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'block',
                        font: '400 17px/1.1 Newsreader,serif',
                        color: '#2C1A12',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {w.valueS}
                    </span>
                    <span style={{ display: 'block', marginTop: '4px', font: '500 11px/1 Figtree', color: w.chFg }}>{w.chS}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p style={{ margin: '12px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
              Dashed marker shows the 5-week average. The current week is shown in champagne.
            </p>
          </section>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
          <section
            style={{
              padding: '24px 26px',
              borderRadius: '18px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.07)',
              minWidth: 0,
              flex: '1.5 1 440px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '8px 16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  Products
                </p>
                <h2 style={{ margin: '8px 0 0', font: '400 24px/1.1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                  Best sellers
                </h2>
              </div>
              <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E', textAlign: 'right' }}>This week</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  font: '400 14px/1.3 Figtree',
                  color: '#2C1A12',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'left',
                        width: '34px',
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'left',
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'right',
                        paddingLeft: '12px',
                      }}
                    >
                      Sold
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'right',
                        paddingLeft: '12px',
                      }}
                    >
                      Avg price
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'right',
                        paddingLeft: '12px',
                      }}
                    >
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.bestRows.map((b, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(44,26,18,.07)' }}>
                      <td style={{ padding: '14px 0', font: '400 17px/1 Newsreader,serif', color: '#8C7A6E' }}>{b.rank}</td>
                      <td style={{ padding: '14px 0' }}>
                        <span style={{ display: 'block', fontWeight: 600 }}>{b.name}</span>
                        <span style={{ display: 'block', marginTop: '3px', font: '400 12px/1.2 Figtree', color: '#8C7A6E' }}>
                          {b.share} of best-seller revenue
                        </span>
                      </td>
                      <td style={{ padding: '14px 0 14px 12px', textAlign: 'right' }}>{b.qtyS}</td>
                      <td style={{ padding: '14px 0 14px 12px', textAlign: 'right', color: '#8C7A6E' }}>{b.avgS}</td>
                      <td style={{ padding: '14px 0 14px 12px', textAlign: 'right', font: '400 17px/1 Newsreader,serif' }}>{b.revS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section
            style={{
              padding: '24px 26px',
              borderRadius: '18px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.07)',
              minWidth: 0,
              flex: '1 1 320px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '8px 16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  Takings
                </p>
                <h2 style={{ margin: '8px 0 0', font: '400 24px/1.1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                  Payment types
                </h2>
              </div>
              <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E', textAlign: 'right' }}>Week to date</p>
            </div>
            <p style={{ margin: 0, font: '400 36px/1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>{o.payTotal}</p>
            <div aria-hidden="true" style={{ display: 'flex', gap: '3px', height: '10px', margin: '18px 0 8px' }}>
              {o.payMix.map((p, i) => (
                <span key={i} style={{ width: p.pct, borderRadius: '3px', background: p.bg }} />
              ))}
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                font: '400 14px/1.3 Figtree',
                color: '#2C1A12',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {o.payMix.map((p, i) => (
                <li
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '10px minmax(0,1fr) 44px 84px',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '11px 0',
                    borderTop: '1px solid rgba(44,26,18,.07)',
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: p.bg }} />
                  <span>{p.m}</span>
                  <span style={{ textAlign: 'right', color: '#8C7A6E' }}>{p.pct}</span>
                  <span style={{ textAlign: 'right', font: '400 16px/1 Newsreader,serif' }}>{p.amtS}</span>
                </li>
              ))}
            </ul>
            <p
              style={{
                margin: 0,
                font: '600 11px/1 Figtree',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: '#8C7A6E',
                marginTop: '22px',
              }}
            >
              Sales by channel
            </p>
            <div aria-hidden="true" style={{ display: 'flex', gap: '3px', height: '6px', margin: '12px 0 10px' }}>
              {o.chanMix.map((p, i) => (
                <span key={i} style={{ width: p.pct, borderRadius: '3px', background: p.bg }} />
              ))}
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 18px',
                font: '400 13px/1.3 Figtree',
                color: '#2C1A12',
              }}
            >
              {o.chanMix.map((p, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: p.bg }} />
                  <span>{p.c}</span>
                  <span style={{ color: '#8C7A6E' }}>{p.pct}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
          <section
            style={{
              padding: '24px 26px',
              borderRadius: '18px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.07)',
              minWidth: 0,
              flex: '1 1 340px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '8px 16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  Guests
                </p>
                <h2 style={{ margin: '8px 0 0', font: '400 24px/1.1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                  Top customers
                </h2>
              </div>
              <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E', textAlign: 'right' }}>By spend · recent orders</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  font: '400 14px/1.3 Figtree',
                  color: '#2C1A12',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'left',
                        width: '34px',
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'left',
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'right',
                        paddingLeft: '12px',
                      }}
                    >
                      Orders
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'right',
                        paddingLeft: '12px',
                      }}
                    >
                      Avg
                    </th>
                    <th
                      style={{
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        padding: '0 0 12px',
                        textAlign: 'right',
                        paddingLeft: '12px',
                      }}
                    >
                      Spend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.topCust.map((c, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(44,26,18,.07)' }}>
                      <td style={{ padding: '14px 0', font: '400 17px/1 Newsreader,serif', color: '#8C7A6E' }}>{c.n}</td>
                      <td style={{ padding: '14px 0' }}>
                        <a href={c.href} style={{ fontWeight: 600, color: '#2C1A12', textDecoration: 'none' }} className="hover-underline">
                          {c.name}
                        </a>
                      </td>
                      <td style={{ padding: '14px 0 14px 12px', textAlign: 'right' }}>{c.orders}</td>
                      <td style={{ padding: '14px 0 14px 12px', textAlign: 'right', color: '#8C7A6E' }}>{c.avgS}</td>
                      <td style={{ padding: '14px 0 14px 12px', textAlign: 'right', font: '400 17px/1 Newsreader,serif' }}>{c.spendS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section
            style={{
              padding: '24px 26px',
              borderRadius: '18px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.07)',
              minWidth: 0,
              flex: '1.6 1 520px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '8px 16px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: 0, font: '600 11px/1 Figtree', letterSpacing: '.08em', textTransform: 'uppercase', color: '#8C7A6E' }}>
                  Guests &amp; events
                </p>
                <h2 style={{ margin: '8px 0 0', font: '400 24px/1.1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                  Loyalty, reservations &amp; catering
                </h2>
              </div>
              <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E', textAlign: 'right' }}>This week</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '24px 32px' }}>
              {o.repGroups.map((g, i) => (
                <div key={i}>
                  <p style={{ margin: 0, font: '600 13px/1 Figtree', color: '#2C1A12' }}>{g.name}</p>
                  <p style={{ margin: '14px 0 0', font: '400 34px/1 Newsreader,serif', letterSpacing: '-.01em', color: '#2C1A12' }}>
                    {g.lead}
                  </p>
                  <p style={{ margin: '6px 0 14px', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{g.leadK}</p>
                  <dl style={{ margin: 0, display: 'grid' }}>
                    {g.rows.map((r, i1) => (
                      <div
                        key={i1}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: '12px',
                          padding: '10px 0',
                          borderTop: '1px solid rgba(44,26,18,.07)',
                        }}
                      >
                        <dt style={{ font: '400 13px/1.3 Figtree', color: '#8C7A6E' }}>{r.k}</dt>
                        <dd style={{ margin: 0, font: '500 14px/1.3 Figtree', color: '#2C1A12', fontVariantNumeric: 'tabular-nums' }}>
                          {r.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
