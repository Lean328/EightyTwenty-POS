import type { CustomersView } from './guests.view';

export function Customers({ o }: { o: CustomersView }) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ position: 'relative', display: 'block', maxWidth: '560px' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'grid',
                placeItems: 'center',
                color: '#9A8B80',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
            <input
              type="search"
              aria-label="Search customers"
              value={o.custQ}
              onChange={o.setCustQ}
              placeholder="Search by name, phone, email or dietary note"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px 0 40px',
                borderRadius: '12px',
                border: '1px solid rgba(44,26,18,.1)',
                background: '#FFFCF7',
                font: '400 14px/1 Figtree',
                color: '#2C1A12',
              }}
            />
          </label>
          <div role="group" aria-label="Filter customers" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {o.custFilters.map((f, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={f.on}
                onClick={f.pick}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '16px',
                  border: `1px solid ${f.border}`,
                  background: f.bg,
                  color: f.fg,
                  font: '500 12px/1 Figtree',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{f.name}</span>
                <span style={{ font: '500 11px/1 Figtree', color: f.nFg }}>{f.n}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'flex-start' }}>
          <section
            aria-label="Customer list"
            style={{
              flex: '1 1 290px',
              minWidth: 0,
              borderRadius: '16px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.06)',
              overflow: 'hidden',
            }}
          >
            {o.custEmpty ? (
              <div style={{ padding: '44px 24px', textAlign: 'center' }}>
                <p style={{ margin: 0, font: '400 19px/1.3 Newsreader,serif', color: '#2C1A12' }}>No customers match</p>
                <p style={{ margin: '6px 0 0', font: '400 13px/1.45 Figtree', color: '#8C7A6E' }}>Try another name or clear the filter.</p>
              </div>
            ) : null}
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px' }}>
              {o.custRows.map((c, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={c.pick}
                    aria-current={c.on}
                    style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: '40px minmax(0,1fr) auto',
                      gap: '14px',
                      alignItems: 'start',
                      padding: '14px 14px',
                      border: 0,
                      borderRadius: '12px',
                      background: c.bg,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#2C1A12',
                    }}
                  >
                    <span
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: c.avBg,
                        color: c.avFg,
                        display: 'grid',
                        placeItems: 'center',
                        font: '600 13px/1 Figtree',
                        letterSpacing: '.02em',
                      }}
                    >
                      {c.initials}
                    </span>
                    <span style={{ minWidth: 0, display: 'grid', gap: '4px' }}>
                      <span style={{ font: '600 15px/1.25 Figtree', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                      <span
                        style={{
                          font: '400 12px/1.35 Figtree',
                          color: '#8C7A6E',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.contact}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '6px 10px',
                          marginTop: '4px',
                          font: '400 12px/1.2 Figtree',
                          color: '#8C7A6E',
                        }}
                      >
                        <span style={{ color: '#3A2B24' }}>{c.cafeName}</span>
                        <span>{c.visitsS}</span>
                        <span>{c.lastS}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>Since {c.since}</span>
                        {c.diet.map((d, i1) => (
                          <span
                            key={i1}
                            style={{
                              height: '22px',
                              padding: '0 9px',
                              borderRadius: '11px',
                              background: '#F1E8DC',
                              color: '#6B4A2E',
                              font: '500 11px/22px Figtree',
                            }}
                          >
                            {d.label}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span aria-label={c.stampsLabel} style={{ display: 'grid', justifyItems: 'end', gap: '6px', paddingTop: '2px' }}>
                      <span style={{ font: '400 17px/1 Newsreader,serif', color: '#2C1A12' }}>{c.stampsS}</span>
                      <span
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={c.pct}
                        style={{
                          display: 'block',
                          width: '64px',
                          height: '4px',
                          borderRadius: '2px',
                          background: 'rgba(44,26,18,.1)',
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            height: '100%',
                            width: c.pctS,
                            borderRadius: '2px',
                            background: '#B67A4B',
                            transition: 'width .7s cubic-bezier(.22,1,.36,1)',
                          }}
                        />
                      </span>
                      {c.hasReward ? (
                        <span style={{ font: '500 11px/1 Figtree', color: '#8B5827', whiteSpace: 'nowrap' }}>{c.rewardS}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {o.cp ? (
            <article
              aria-label="Customer details"
              style={{
                flex: '1.7 1 390px',
                minWidth: 0,
                position: 'sticky',
                top: '84px',
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
                borderRadius: '16px',
                background: '#FFFCF7',
                border: '1px solid rgba(44,26,18,.06)',
              }}
            >
              <header style={{ padding: '26px 24px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      width: '60px',
                      height: '60px',
                      flex: 'none',
                      borderRadius: '50%',
                      background: '#2C1A12',
                      color: '#F5EDE2',
                      display: 'grid',
                      placeItems: 'center',
                      font: '500 20px/1 Newsreader,serif',
                      letterSpacing: '.02em',
                    }}
                  >
                    {o.cp.initials}
                  </span>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h2 style={{ margin: 0, font: '400 30px/1.05 Newsreader,serif', letterSpacing: '-.01em' }}>{o.cp.name}</h2>
                    <p style={{ margin: '6px 0 0', font: '400 13px/1.4 Figtree', color: '#8C7A6E' }}>
                      Member since {o.cp.since} · {o.cp.cafeName}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={o.cp.addStamp}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: 0,
                      background: '#2C1A12',
                      color: '#F5EDE2',
                      font: '600 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    Add loyalty stamp
                  </button>
                  <button
                    type="button"
                    onClick={o.cp.toggleNote}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      color: '#2C1A12',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {o.cp.noteLabel}
                  </button>
                  <button
                    type="button"
                    onClick={o.cp.sendGift}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      color: '#2C1A12',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    Send gift card
                  </button>
                  <button
                    type="button"
                    onClick={o.cp.toggleEdit}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.14)',
                      background: 'transparent',
                      color: '#2C1A12',
                      font: '500 13px/1 Figtree',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {o.cp.editLabel}
                  </button>
                </div>
              </header>
              {o.cp.editing ? (
                <div
                  style={{
                    padding: '20px 24px',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                    gap: '12px',
                  }}
                >
                  <label style={{ display: 'grid', gap: '6px', font: '600 12px/1 Figtree', color: '#3A2B24' }}>
                    Full name
                    <input
                      type="text"
                      value={o.cp.name}
                      onChange={o.cp.setName}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,26,18,.12)',
                        background: '#F7F2EA',
                        font: '400 13px/1 Figtree',
                        color: '#2C1A12',
                      }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px', font: '600 12px/1 Figtree', color: '#3A2B24' }}>
                    Phone
                    <input
                      type="tel"
                      value={o.cp.phone}
                      onChange={o.cp.setPhone}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,26,18,.12)',
                        background: '#F7F2EA',
                        font: '400 13px/1 Figtree',
                        color: '#2C1A12',
                      }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px', font: '600 12px/1 Figtree', color: '#3A2B24' }}>
                    Email
                    <input
                      type="email"
                      value={o.cp.email}
                      onChange={o.cp.setEmail}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,26,18,.12)',
                        background: '#F7F2EA',
                        font: '400 13px/1 Figtree',
                        color: '#2C1A12',
                      }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px', font: '600 12px/1 Figtree', color: '#3A2B24' }}>
                    Home café
                    <select
                      value={o.cp.homeCafe}
                      onChange={o.cp.setCafe}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,26,18,.12)',
                        background: '#F7F2EA',
                        font: '400 13px/1 Figtree',
                        color: '#2C1A12',
                      }}
                    >
                      {o.cp.cafeOpts.map((cafe, i) => (
                        <option key={i} value={cafe.id}>
                          {cafe.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ gridColumn: '1 / -1', display: 'grid', gap: '6px', font: '600 12px/1 Figtree', color: '#3A2B24' }}>
                    Dietary &amp; allergies
                    <input
                      type="text"
                      value={o.cp.dietText}
                      onChange={o.cp.setDiet}
                      placeholder="Comma separated — e.g. Coeliac, Nut allergy"
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,26,18,.12)',
                        background: '#F7F2EA',
                        font: '400 13px/1 Figtree',
                        color: '#2C1A12',
                      }}
                    />
                  </label>
                </div>
              ) : null}
              {o.cp.notEditing ? (
                <div
                  style={{
                    padding: '20px 24px',
                    borderTop: '1px solid rgba(44,26,18,.06)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                    gap: '18px',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#9A8B80',
                      }}
                    >
                      Contact
                    </p>
                    <p style={{ margin: 0, font: '500 14px/1.5 Figtree', color: '#2C1A12' }}>{o.cp.phone}</p>
                    <p style={{ margin: 0, font: '400 13px/1.5 Figtree', color: '#8C7A6E', overflowWrap: 'anywhere' }}>{o.cp.email}</p>
                  </div>
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#9A8B80',
                      }}
                    >
                      Dietary &amp; allergies
                    </p>
                    {o.cp.hasDiet ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {o.cp.diet.map((d, i) => (
                          <span
                            key={i}
                            style={{
                              height: '26px',
                              padding: '0 11px',
                              borderRadius: '13px',
                              background: '#F1E8DC',
                              color: '#6B4A2E',
                              font: '500 12px/26px Figtree',
                            }}
                          >
                            {d.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {o.cp.noDiet ? <p style={{ margin: 0, font: '400 13px/1.5 Figtree', color: '#9A8B80' }}>None noted</p> : null}
                  </div>
                </div>
              ) : null}
              <div
                style={{
                  padding: '0 24px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
                  gap: 0,
                  borderTop: '1px solid rgba(44,26,18,.06)',
                }}
              >
                {o.cp.stats.map((st, i) => (
                  <div key={i} style={{ padding: '18px 16px 0 0' }}>
                    <p
                      style={{
                        margin: '0 0 10px',
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: '#9A8B80',
                        marginBottom: '8px',
                      }}
                    >
                      {st.k}
                    </p>
                    <p style={{ margin: 0, font: '400 24px/1 Newsreader,serif', color: '#2C1A12' }}>{st.v}</p>
                    <p style={{ margin: '6px 0 0', font: '400 12px/1.3 Figtree', color: '#8C7A6E' }}>{st.sub}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 24px 22px' }}>
                <div style={{ padding: '20px 22px', borderRadius: '14px', background: '#2C1A12', color: '#F5EDE2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                    <p
                      style={{
                        margin: 0,
                        font: '600 11px/1 Figtree',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: 'rgba(245,237,226,.7)',
                      }}
                    >
                      Coffee card
                    </p>
                    <p style={{ margin: 0, font: '400 12px/1 Figtree', color: 'rgba(245,237,226,.7)' }}>{o.cp.walletLine}</p>
                  </div>
                  <p style={{ margin: '14px 0 0', font: '400 26px/1.1 Newsreader,serif' }}>{o.cp.cardHead}</p>
                  <div
                    role="progressbar"
                    aria-label="Coffee card progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={o.cp.pct}
                    style={{ position: 'relative', margin: '46px 0 20px' }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '17px',
                        left: o.cp.pctS,
                        transform: `translateX(-${o.cp.pctS})`,
                        transition: 'left .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)',
                        height: '24px',
                        padding: '0 9px',
                        borderRadius: '7px',
                        background: '#F0E4D4',
                        color: '#2C1A12',
                        font: '600 12px/24px Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {o.cp.pctS}
                      <span
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: o.cp.arrowS,
                          transform: 'translateX(-50%)',
                          transition: 'left .7s cubic-bezier(.22,1,.36,1)',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '5px solid #F0E4D4',
                        }}
                      />
                    </span>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(245,237,226,.14)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: o.cp.pctS,
                          borderRadius: '4px',
                          background: '#E9C89E',
                          transition: 'width .7s cubic-bezier(.22,1,.36,1)',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, font: '500 14px/1.35 Figtree', color: o.cp.cardLineFg }}>{o.cp.cardLine}</p>
                    {o.cp.hasReward ? (
                      <button
                        type="button"
                        onClick={o.cp.redeem}
                        style={{
                          height: '36px',
                          padding: '0 14px',
                          borderRadius: '9px',
                          border: 0,
                          background: '#E9C89E',
                          color: '#2C1A12',
                          font: '600 12px/1 Figtree',
                          cursor: 'pointer',
                        }}
                      >
                        Redeem reward
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(44,26,18,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                  <p
                    style={{
                      margin: '0 0 10px',
                      font: '600 11px/1 Figtree',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#9A8B80',
                    }}
                  >
                    Internal notes
                  </p>
                  <button
                    type="button"
                    onClick={o.cp.toggleNote}
                    style={{
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      font: '500 12px/1 Figtree',
                      color: '#8B5827',
                      cursor: 'pointer',
                    }}
                  >
                    {o.cp.noteLabel}
                  </button>
                </div>
                {o.cp.editingNote ? (
                  <textarea
                    rows={3}
                    value={o.cp.notes}
                    onChange={o.cp.setNotes}
                    placeholder="Usual order, preferences, anything the team should know"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.12)',
                      background: '#F7F2EA',
                      resize: 'vertical',
                      font: '400 14px/1.5 Figtree',
                      color: '#2C1A12',
                    }}
                  />
                ) : null}
                {o.cp.showNote ? (
                  <p style={{ margin: 0, font: 'italic 400 17px/1.45 Newsreader,serif', color: '#3A2B24', textWrap: 'pretty' }}>
                    {o.cp.notes}
                  </p>
                ) : null}
                {o.cp.noteEmpty ? <p style={{ margin: 0, font: '400 13px/1.5 Figtree', color: '#9A8B80' }}>No notes yet.</p> : null}
              </div>
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(44,26,18,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                  <p
                    style={{
                      margin: '0 0 10px',
                      font: '600 11px/1 Figtree',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#9A8B80',
                    }}
                  >
                    Recent orders
                  </p>
                  {o.cp.ordMore ? (
                    <button
                      type="button"
                      onClick={o.cp.ordToggle}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        font: '500 12px/1 Figtree',
                        color: '#8B5827',
                        cursor: 'pointer',
                      }}
                    >
                      {o.cp.ordToggleLabel}
                    </button>
                  ) : null}
                </div>
                {o.cp.ordEmpty ? <p style={{ margin: 0, font: '400 13px/1.5 Figtree', color: '#9A8B80' }}>No orders yet.</p> : null}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid' }}>
                  {o.cp.orders.map((it, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '76px minmax(0,1fr) auto',
                        gap: '14px',
                        alignItems: 'baseline',
                        padding: '11px 0',
                        borderTop: '1px solid rgba(44,26,18,.06)',
                      }}
                    >
                      <span style={{ font: '500 12px/1.3 Figtree', color: '#8C7A6E' }}>{it.when}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', font: '500 13px/1.35 Figtree', color: '#2C1A12', textWrap: 'pretty' }}>
                          {it.title}
                        </span>
                        <span style={{ display: 'block', marginTop: '2px', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>
                          {it.meta}
                        </span>
                      </span>
                      <span style={{ font: '400 15px/1 Newsreader,serif', color: '#2C1A12' }}>{it.amt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(44,26,18,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                  <p
                    style={{
                      margin: '0 0 10px',
                      font: '600 11px/1 Figtree',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#9A8B80',
                    }}
                  >
                    Reservations
                  </p>
                  {o.cp.resMore ? (
                    <button
                      type="button"
                      onClick={o.cp.resToggle}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        font: '500 12px/1 Figtree',
                        color: '#8B5827',
                        cursor: 'pointer',
                      }}
                    >
                      {o.cp.resToggleLabel}
                    </button>
                  ) : null}
                </div>
                {o.cp.resEmpty ? <p style={{ margin: 0, font: '400 13px/1.5 Figtree', color: '#9A8B80' }}>No reservations yet.</p> : null}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid' }}>
                  {o.cp.res.map((it, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '76px minmax(0,1fr) auto',
                        gap: '14px',
                        alignItems: 'baseline',
                        padding: '11px 0',
                        borderTop: '1px solid rgba(44,26,18,.06)',
                      }}
                    >
                      <span style={{ font: '500 12px/1.3 Figtree', color: '#8C7A6E' }}>{it.when}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', font: '500 13px/1.35 Figtree', color: '#2C1A12', textWrap: 'pretty' }}>
                          {it.title}
                        </span>
                        <span style={{ display: 'block', marginTop: '2px', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>
                          {it.meta}
                        </span>
                      </span>
                      <span style={{ font: '400 15px/1 Newsreader,serif', color: '#2C1A12' }}>{it.amt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {o.cp.hasCat ? (
                <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(44,26,18,.06)' }}>
                  <p
                    style={{
                      margin: '0 0 10px',
                      font: '600 11px/1 Figtree',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#9A8B80',
                    }}
                  >
                    Catering
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid' }}>
                    {o.cp.cat.map((it, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '76px minmax(0,1fr) auto',
                          gap: '14px',
                          alignItems: 'baseline',
                          padding: '11px 0',
                          borderTop: '1px solid rgba(44,26,18,.06)',
                        }}
                      >
                        <span style={{ font: '500 12px/1.3 Figtree', color: '#8C7A6E' }}>{it.when}</span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', font: '500 13px/1.35 Figtree', color: '#2C1A12', textWrap: 'pretty' }}>
                            {it.title}
                          </span>
                          <span style={{ display: 'block', marginTop: '2px', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>
                            {it.meta}
                          </span>
                        </span>
                        <span style={{ font: '400 15px/1 Newsreader,serif', color: '#2C1A12' }}>{it.amt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {o.cp.hasGift ? (
                <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(44,26,18,.06)' }}>
                  <p
                    style={{
                      margin: '0 0 10px',
                      font: '600 11px/1 Figtree',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#9A8B80',
                    }}
                  >
                    Gift cards
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid' }}>
                    {o.cp.gift.map((it, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '76px minmax(0,1fr) auto',
                          gap: '14px',
                          alignItems: 'baseline',
                          padding: '11px 0',
                          borderTop: '1px solid rgba(44,26,18,.06)',
                        }}
                      >
                        <span style={{ font: '500 12px/1.3 Figtree', color: '#8C7A6E' }}>{it.when}</span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', font: '500 13px/1.35 Figtree', color: '#2C1A12', textWrap: 'pretty' }}>
                            {it.title}
                          </span>
                          <span style={{ display: 'block', marginTop: '2px', font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>
                            {it.meta}
                          </span>
                        </span>
                        <span style={{ font: '400 15px/1 Newsreader,serif', color: '#2C1A12' }}>{it.amt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      </div>
    </>
  );
}
