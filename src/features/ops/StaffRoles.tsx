import type { StaffView } from './staff.view';

export function StaffRoles({ o }: { o: StaffView }) {
  return (
    <>
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: '2px',
          padding: '3px',
          borderRadius: '12px',
          background: 'rgba(44,26,18,.06)',
          width: 'max-content',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        {o.staffTabs.map((tb, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={tb.on}
            onClick={tb.pick}
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
      {o.staffShifts ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '16px', alignItems: 'start' }}>
          <section
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.06)',
              display: 'grid',
              gap: '12px',
            }}
          >
            <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Current shift</h2>
            {o.noShift ? (
              <p style={{ margin: 0, font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>
                No shift is open. Cash payments are blocked on the till until a shift is opened with a float.
              </p>
            ) : null}
            {o.curShift ? (
              <>
                <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{o.curShift.line}</p>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#F7F2EA',
                    display: 'grid',
                    gap: '6px',
                    font: '400 13px/1 Figtree',
                  }}
                >
                  {o.curShift.rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#574A40' }}>{r.k}</span>
                      <span>{r.v}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <button
              type="button"
              onClick={o.manageShift}
              style={{
                height: '44px',
                borderRadius: '10px',
                border: 0,
                background: '#2C1A12',
                color: '#F5EDE2',
                font: '600 13px/1 Figtree',
              }}
            >
              Open, adjust or close shift
            </button>
          </section>
          <section style={{ padding: '18px 20px', borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)' }}>
            <h2 style={{ margin: '0 0 10px', font: '500 17px/1 Newsreader,serif' }}>Shift history</h2>
            {o.noShifts ? (
              <p style={{ margin: 0, font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>
                Closed shifts and their reconciliation appear here.
              </p>
            ) : null}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {o.shiftRows.map((x, i) => (
                <li
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '4px 12px',
                    padding: '10px 0',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                    font: '400 12px/1.4 Figtree',
                  }}
                >
                  <span style={{ font: '600 13px/1.3 Figtree' }}>
                    {x.who} · {x.cafeName}
                  </span>
                  <span style={{ font: '500 15px/1 Newsreader,serif', color: x.varFg }}>{x.varS}</span>
                  <span style={{ color: '#8C7A6E' }}>{x.when}</span>
                  <span style={{ color: '#8C7A6E', textAlign: 'right' }}>
                    exp {x.expS} · counted {x.cntS}
                  </span>
                  {x.approved ? (
                    <span style={{ gridColumn: '1/-1', color: '#8B5827' }}>
                      {x.approved}
                      {x.note}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
      {o.staffActivity ? (
        <>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              value={o.auditQ}
              onChange={o.setAuditQ}
              placeholder="Search staff, action, order or reason"
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid rgba(44,26,18,.1)',
                background: '#FFFCF7',
                width: '280px',
                maxWidth: '100%',
              }}
            />
            {o.auditFilters.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={f.pick}
                aria-pressed={f.on}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '17px',
                  border: `1px solid ${f.border}`,
                  background: f.bg,
                  color: f.fg,
                  font: '500 12px/1 Figtree',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
          <div style={{ borderRadius: '16px', background: '#FFFCF7', border: '1px solid rgba(44,26,18,.06)', overflow: 'hidden' }}>
            {o.noAudit ? (
              <p style={{ margin: 0, padding: '28px', textAlign: 'center', font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>
                No activity matches. Refunds, voids, discounts, cash movements and menu changes are recorded here.
              </p>
            ) : null}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {o.auditRows.map((e, i) => (
                <li
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px minmax(0,1fr) auto',
                    gap: '4px 14px',
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                    font: '400 12px/1.4 Figtree',
                  }}
                >
                  <span style={{ color: '#8C7A6E' }}>{e.at}</span>
                  <span>
                    <span style={{ display: 'block', font: '600 13px/1.3 Figtree' }}>{e.action}</span>
                    <span style={{ display: 'block', color: '#3A2B24' }}>{e.detail}</span>
                    {e.reason ? <span style={{ display: 'block', color: '#8B5827' }}>Reason · {e.reason}</span> : null}
                    <span style={{ display: 'block', color: '#8C7A6E' }}>
                      {e.who}
                      {e.approver ? <> · {e.approver}</> : null}
                    </span>
                  </span>
                  <span style={{ font: '500 14px/1 Newsreader,serif', color: e.amtFg }}>{e.amtS}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
      {o.staffTeam ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
          <section
            aria-label="Team members"
            style={{
              flex: '1.7 1 640px',
              minWidth: 0,
              padding: '18px 8px 6px',
              borderRadius: '16px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.06)',
            }}
          >
            <h2 style={{ margin: '0 12px 14px', font: '500 17px/1 Newsreader,serif' }}>Team members</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', font: '400 13px/1.3 Figtree' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: '0 12px 12px',
                        textAlign: 'left',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Team member
                    </th>
                    <th
                      style={{
                        padding: '0 12px 12px',
                        textAlign: 'left',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Café
                    </th>
                    <th
                      style={{
                        padding: '0 12px 12px',
                        textAlign: 'left',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        padding: '0 12px 12px',
                        textAlign: 'left',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: '#8C7A6E',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Shift
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.staffRows.map((s, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(44,26,18,.06)' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              width: '32px',
                              height: '32px',
                              flex: 'none',
                              borderRadius: '50%',
                              background: '#3A2B24',
                              color: '#F5EDE2',
                              display: 'grid',
                              placeItems: 'center',
                              font: '600 11px/1 Figtree',
                            }}
                          >
                            {s.initials}
                          </span>
                          <span style={{ fontWeight: 600, color: '#2C1A12' }}>{s.name}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#8C7A6E', whiteSpace: 'nowrap' }}>{s.cafeName}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            gap: '2px',
                            padding: '2px',
                            borderRadius: '9px',
                            background: 'rgba(44,26,18,.06)',
                          }}
                        >
                          {s.roleOpts.map((r, i1) => (
                            <button
                              key={i1}
                              type="button"
                              onClick={r.pick}
                              aria-pressed={r.on}
                              style={{
                                height: '30px',
                                padding: '0 11px',
                                border: 0,
                                borderRadius: '7px',
                                background: r.bg,
                                color: r.fg,
                                font: '500 12px/1 Figtree',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                              }}
                            >
                              {r.name}
                            </button>
                          ))}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#8C7A6E', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {s.shift}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section
            aria-label="Permissions by role"
            style={{
              flex: '1 1 380px',
              minWidth: 0,
              padding: '18px 20px',
              borderRadius: '16px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.06)',
            }}
          >
            <h2 style={{ margin: '0 0 4px', font: '500 17px/1 Newsreader,serif' }}>Permissions by role</h2>
            <p style={{ margin: '0 0 14px', font: '400 12px/1.4 Figtree', color: '#8C7A6E', textWrap: 'pretty' }}>
              Admin always has everything. The till asks for a PIN whenever an action needs a higher role.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '340px', borderCollapse: 'collapse', font: '400 13px/1.35 Figtree' }}>
                <thead>
                  <tr style={{ color: '#8C7A6E', font: '600 11px/1 Figtree', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '0 0 10px' }}>Permission</th>
                    <th style={{ width: '72px', padding: '0 4px 10px', textAlign: 'center' }}>Cashier</th>
                    <th style={{ width: '72px', padding: '0 4px 10px', textAlign: 'center' }}>Manager</th>
                    <th style={{ width: '64px', padding: '0 0 10px 4px', textAlign: 'center' }}>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {o.permRows.map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(44,26,18,.06)' }}>
                      <td style={{ padding: '10px 12px 10px 0', color: '#2C1A12', textWrap: 'pretty' }}>{p.label}</td>
                      {p.cells.map((c, i1) => (
                        <td key={i1} style={{ padding: '10px 4px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={c.toggle}
                            disabled={c.locked}
                            aria-pressed={c.on}
                            aria-label={c.aria}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              border: `1px solid ${c.border}`,
                              background: c.bg,
                              color: '#F5EDE2',
                              font: '600 12px/1 Figtree',
                              opacity: c.opacity,
                            }}
                          >
                            {c.mark}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
