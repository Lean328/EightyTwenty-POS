import type { NavView } from './nav.view';

export function NavRail({ v }: { v: NavView }) {
  return (
    <>
      {v.navBackdrop ? (
        <div
          onClick={v.closeNav}
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(44,26,18,.42)', animation: 'fadeIn .18s ease' }}
        />
      ) : null}
      <div style={{ flex: 'none', width: v.navSpace, transition: 'width .2s ease' }}>
        <nav
          aria-label="POS navigation"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: v.navZ,
            width: v.navW,
            display: 'flex',
            flexDirection: 'column',
            background: '#2C1A12',
            color: '#F5EDE2',
            transition: 'width .2s ease',
            boxShadow: v.navShadow,
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '12px', height: '76px', padding: '0 13px' }}>
            <button
              type="button"
              onClick={v.toggleNav}
              aria-label={v.navToggleLabel}
              aria-expanded={v.navExpanded}
              style={{
                width: '46px',
                height: '46px',
                flex: 'none',
                border: 0,
                borderRadius: '12px',
                background: 'rgba(245,237,226,.07)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '20px', height: '2px', borderRadius: '1px', background: '#F5EDE2' }} />
              <span style={{ width: '20px', height: '2px', borderRadius: '1px', background: '#F5EDE2' }} />
              <span style={{ width: '20px', height: '2px', borderRadius: '1px', background: '#F5EDE2' }} />
            </button>
            {v.navExpanded ? (
              <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span style={{ display: 'block', font: '500 16px/1.1 Newsreader,serif', letterSpacing: '.02em', color: '#F5EDE2' }}>
                  EightyTwenty
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: '2px',
                    font: '500 10px/1.4 Figtree',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: '#E9C89E',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  POS · {v.cafeName}
                </span>
              </span>
            ) : null}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '2px 13px 12px' }}>
            {v.navGroups.map((g, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                {v.navExpanded ? (
                  <p
                    style={{
                      margin: '10px 0 6px',
                      padding: '0 13px',
                      font: '600 10px/1 Figtree',
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(245,237,226,.45)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {g.name}
                  </p>
                ) : null}
                {g.divider ? (
                  <span style={{ display: 'block', height: '1px', margin: '8px 10px 10px', background: 'rgba(245,237,226,.1)' }} />
                ) : null}
                {g.items.map((n, i1) => (
                  <a
                    key={i1}
                    href={n.href}
                    aria-label={n.label}
                    aria-current={n.cur}
                    onMouseEnter={n.tipOn}
                    onMouseLeave={v.hideTip}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      height: '44px',
                      padding: '0 13px',
                      marginBottom: '2px',
                      borderRadius: '11px',
                      background: n.bg,
                      color: n.fg,
                      font: `${n.weight} 13px/1 Figtree`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span aria-hidden="true" style={{ width: '22px', height: '22px', flex: 'none', display: 'grid', placeItems: 'center' }}>
                      {n.img ? (
                        <img
                          src={n.img}
                          alt=""
                          width={22}
                          height={22}
                          draggable={false}
                          style={{ width: 22, height: 22, display: 'block', objectFit: 'contain', opacity: n.cur ? 1 : 0.88 }}
                        />
                      ) : (
                        <StaffIcon />
                      )}
                    </span>
                    {v.navExpanded ? (
                      <>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</span>
                        {n.locked ? (
                          <span style={{ font: '600 9px/1 Figtree', letterSpacing: '.1em', color: 'rgba(245,237,226,.5)' }}>PIN</span>
                        ) : null}
                        {n.count ? (
                          <span
                            style={{
                              minWidth: '20px',
                              height: '20px',
                              padding: '0 6px',
                              borderRadius: '10px',
                              background: '#B67A4B',
                              color: '#FFFCF7',
                              font: '600 10px/20px Figtree',
                              textAlign: 'center',
                            }}
                          >
                            {n.count}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                    {n.dot ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '29px',
                          minWidth: '16px',
                          height: '16px',
                          padding: '0 4px',
                          borderRadius: '8px',
                          background: '#B67A4B',
                          color: '#FFFCF7',
                          border: '2px solid #2C1A12',
                          font: '700 9px/12px Figtree',
                          textAlign: 'center',
                        }}
                      >
                        {n.count}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 13px 16px',
              borderTop: '1px solid rgba(245,237,226,.1)',
            }}
          >
            <button
              type="button"
              onClick={v.openStaff}
              aria-label={`Switch staff · ${v.navStaffName}`}
              onMouseEnter={v.staffTip}
              onMouseLeave={v.hideTip}
              style={{
                width: '46px',
                height: '46px',
                flex: 'none',
                borderRadius: '50%',
                border: '1px solid rgba(245,237,226,.25)',
                background: '#3A2B24',
                color: '#F5EDE2',
                font: '600 12px/1 Figtree',
              }}
            >
              {v.navStaffInitials}
            </button>
            {v.navExpanded ? (
              <>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <span style={{ display: 'block', font: '600 13px/1.3 Figtree', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.navStaffName}
                  </span>
                  <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: 'rgba(245,237,226,.6)' }}>{v.navStaffRole}</span>
                </span>
                <button
                  type="button"
                  onClick={v.openStaff}
                  style={{
                    height: '30px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245,237,226,.22)',
                    background: 'transparent',
                    color: '#F5EDE2',
                    font: '500 11px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Switch
                </button>
              </>
            ) : null}
          </div>
        </nav>
      </div>
      {v.tip ? (
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: '82px',
            top: `${v.tip.y}px`,
            zIndex: 95,
            transform: 'translateY(-50%)',
            padding: '8px 11px',
            borderRadius: '8px',
            background: '#FFFCF7',
            color: '#2C1A12',
            font: '500 12px/1 Figtree',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(44,26,18,.22)',
            pointerEvents: 'none',
            animation: 'fadeIn .12s ease',
          }}
        >
          {v.tip.label}
        </div>
      ) : null}
    </>
  );
}

/** Line icon for Staff & roles (the only section without a raster icon). */
function StaffIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {['M9 4.5a3 3 0 1 1 0 6a3 3 0 1 1 0-6z', 'M3 19a6 6 0 0 1 12 0', 'M16 5a3 3 0 0 1 0 6', 'M18 19a6 6 0 0 0-3-5.2'].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
