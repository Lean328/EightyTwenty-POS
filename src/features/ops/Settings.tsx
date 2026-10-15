import type { SettingsView } from './settings.view';

export function Settings({ o }: { o: SettingsView }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '16px', alignItems: 'start' }}>
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
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Café · {o.setCafe.name}</h2>
          {o.setCafe.fields.map((f, i) => (
            <label key={i} style={{ display: 'block' }}>
              <span style={{ display: 'block', font: '600 12px/1 Figtree', marginBottom: '6px', color: '#8C7A6E' }}>{f.k}</span>
              <input
                type="text"
                value={f.v}
                readOnly={f.readOnly}
                onChange={f.set}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                }}
              />
            </label>
          ))}
          <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
            Hours and contact details are shared with the app and website.
          </p>
        </section>
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
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Orders &amp; payments</h2>
          {o.setRules.map((f, i) => (
            <label
              key={i}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', font: '500 13px/1.3 Figtree' }}
            >
              <span>
                {f.k}
                <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{f.sub}</span>
              </span>
              <input
                type="text"
                value={f.v}
                readOnly={f.readOnly}
                onChange={f.set}
                style={{
                  width: '110px',
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: '#F7F2EA',
                  textAlign: 'right',
                }}
              />
            </label>
          ))}
        </section>
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
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Till behaviour</h2>
          {o.setToggles.map((f, i) => (
            <label
              key={i}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', font: '500 13px/1.3 Figtree' }}
            >
              <span>
                {f.k}
                <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{f.sub}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={f.on}
                onClick={f.toggle}
                style={{
                  width: '44px',
                  height: '26px',
                  borderRadius: '13px',
                  border: 0,
                  background: f.bg,
                  position: 'relative',
                  flex: 'none',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: f.knob,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#FFFCF7',
                    transition: 'left .15s ease',
                  }}
                />
              </button>
            </label>
          ))}
        </section>
        <section
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: '#FFFCF7',
            border: '1px solid rgba(44,26,18,.06)',
            display: 'grid',
            gap: '10px',
          }}
        >
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>This device</h2>
          <p style={{ margin: 0, font: '600 13px/1.3 Figtree' }}>
            {o.thisDevice.mode}
            <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{o.thisDevice.setBy}</span>
          </p>
          <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
            Use this screen as the kitchen display for the café. It opens the kitchen display every time it starts, and kitchen staff sign
            in with their own PIN.{o.thisDevice.needsPin ? ' Needs a manager PIN.' : ''}
          </p>
          <div style={{ display: 'grid', gap: '6px' }}>
            {o.thisDevice.kitchenOptions.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={k.pick}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '9px',
                  border: '1px solid rgba(44,26,18,.14)',
                  background: 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  font: '500 13px/1 Figtree',
                }}
              >
                Kitchen display · {k.label}
                <span style={{ color: '#8B5827' }}>→</span>
              </button>
            ))}
          </div>
        </section>
        <section
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: '#FFFCF7',
            border: '1px solid rgba(44,26,18,.06)',
            display: 'grid',
            gap: '10px',
          }}
        >
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Hardware</h2>
          <p style={{ margin: 0, font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>
            Simulated devices — change a status to test failure and retry flows. No physical hardware is connected in this prototype.
          </p>
          {o.devices.map((dv, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: '12px', background: '#F7F2EA', display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <span style={{ font: '600 13px/1.3 Figtree' }}>
                  {dv.name}
                  <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{dv.sub}</span>
                </span>
                <span
                  style={{
                    height: '22px',
                    padding: '0 9px',
                    borderRadius: '11px',
                    background: dv.bg,
                    color: dv.fg,
                    font: '600 10px/22px Figtree',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dv.state}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', gap: '2px', padding: '2px', borderRadius: '8px', background: 'rgba(44,26,18,.06)' }}>
                  {dv.opts.map((opt, i1) => (
                    <button
                      key={i1}
                      type="button"
                      onClick={opt.pick}
                      style={{
                        height: '26px',
                        padding: '0 9px',
                        border: 0,
                        borderRadius: '6px',
                        background: opt.bg,
                        color: opt.fg,
                        font: '500 11px/1 Figtree',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.l}
                    </button>
                  ))}
                </span>
                <button
                  type="button"
                  onClick={dv.test}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '9px',
                    border: '1px solid rgba(44,26,18,.14)',
                    background: 'transparent',
                    font: '500 12px/1 Figtree',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Test
                </button>
              </div>
            </div>
          ))}
        </section>
        <section
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: '#FFFCF7',
            border: '1px solid rgba(44,26,18,.06)',
            display: 'grid',
            gap: '10px',
          }}
        >
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Connection</h2>
          <label
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', font: '500 13px/1.3 Figtree' }}
          >
            <span>
              {o.netLine}
              <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>
                {o.netCanToggle
                  ? 'Switch off to simulate losing the connection. Cash sales queue locally; card, wallet and gift cards pause.'
                  : 'Follows this device’s network connection. Cash sales queue locally while offline; card, wallet and gift cards pause.'}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={o.netOn}
              aria-disabled={!o.netCanToggle}
              onClick={o.toggleNet}
              style={{
                width: '44px',
                height: '26px',
                borderRadius: '13px',
                border: 0,
                background: o.netBg,
                position: 'relative',
                flex: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: o.netKnob,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#FFFCF7',
                  transition: 'left .15s ease',
                }}
              />
            </button>
          </label>
          <button
            type="button"
            onClick={o.openSync}
            style={{
              height: '38px',
              borderRadius: '9px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 12px/1 Figtree',
              whiteSpace: 'nowrap',
            }}
          >
            Sync queue &amp; online order simulation
          </button>
        </section>
        <section
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: '#FFFCF7',
            border: '1px solid rgba(44,26,18,.06)',
            display: 'grid',
            gap: '10px',
          }}
        >
          <h2 style={{ margin: 0, font: '500 17px/1 Newsreader,serif' }}>Integrations</h2>
          {o.integrations.map((it, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: '#F7F2EA',
                font: '500 13px/1.3 Figtree',
              }}
            >
              <span>
                {it.name}
                <span style={{ display: 'block', font: '400 11px/1.3 Figtree', color: '#8C7A6E' }}>{it.sub}</span>
              </span>
              <span
                style={{
                  height: '22px',
                  padding: '0 9px',
                  borderRadius: '11px',
                  background: it.bg,
                  color: it.fg,
                  font: '600 10px/22px Figtree',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {it.state}
              </span>
            </div>
          ))}
          {o.canResetDemo ? (
            <button
              type="button"
              onClick={o.resetDemo}
              style={{
                marginTop: '6px',
                height: '38px',
                borderRadius: '9px',
                border: '1px solid rgba(154,68,54,.4)',
                background: 'transparent',
                font: '500 12px/1 Figtree',
                color: '#9A4436',
              }}
            >
              Reset demo data on this device
            </button>
          ) : null}
        </section>
      </div>
    </>
  );
}
