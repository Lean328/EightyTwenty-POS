import { Fragment } from 'react';
import type { FormView } from './forms.view';

export function FormDrawer({ f }: { f: FormView }) {
  return (
    <>
      <div
        onClick={f.close}
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(44,26,18,.42)', animation: 'fadeIn .18s ease' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={f.title}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          width: 'min(520px,100vw)',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFCF7',
          boxShadow: '-20px 0 60px rgba(44,26,18,.25)',
          animation: 'slideIn .22s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '22px 24px 14px',
            borderBottom: '1px solid rgba(44,26,18,.06)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, font: '500 22px/1 Newsreader,serif' }}>{f.title}</h2>
            <p style={{ margin: '6px 0 0', font: '400 12px/1.4 Figtree', color: '#8C7A6E' }}>{f.sub}</p>
          </div>
          <button
            type="button"
            onClick={f.close}
            aria-label="Close"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(44,26,18,.12)',
              background: 'transparent',
              font: '400 20px/1 Figtree',
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px', display: 'grid', gap: '14px', alignContent: 'start' }}
        >
          {f.fields.map((field, i) => (
            <Fragment key={i}>
              {field.isText ? (
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', font: '600 12px/1 Figtree', marginBottom: '6px' }}>
                    {field.label}
                    {field.req ? <span style={{ color: '#9A4436' }}> *</span> : null}
                  </span>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={field.set}
                    placeholder={field.placeholder}
                    min={field.min}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.12)',
                      background: '#F7F2EA',
                    }}
                  />
                </label>
              ) : null}
              {field.isArea ? (
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', font: '600 12px/1 Figtree', marginBottom: '6px' }}>{field.label}</span>
                  <textarea
                    rows={3}
                    value={field.value}
                    onChange={field.set}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,26,18,.12)',
                      background: '#F7F2EA',
                      resize: 'none',
                      fontSize: '13px',
                    }}
                  />
                </label>
              ) : null}
              {field.isChips ? (
                <div>
                  <span style={{ display: 'block', font: '600 12px/1 Figtree', marginBottom: '8px' }}>{field.label}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(field.chips || []).map((c, i1) => (
                      <button
                        key={i1}
                        type="button"
                        onClick={c.pick}
                        aria-pressed={c.on}
                        style={{
                          height: '34px',
                          padding: '0 12px',
                          borderRadius: '17px',
                          border: `1px solid ${c.border}`,
                          background: c.bg,
                          color: c.fg,
                          font: '500 12px/1 Figtree',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {field.isSlots ? (
                <div>
                  <span style={{ display: 'block', font: '600 12px/1 Figtree', marginBottom: '8px' }}>{field.label}</span>
                  {field.closed ? (
                    <p
                      role="alert"
                      style={{
                        margin: 0,
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#FBE9E4',
                        color: '#8A2E1C',
                        font: '500 13px/1.4 Figtree',
                      }}
                    >
                      {field.closed}
                    </p>
                  ) : null}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                    {(field.slots || []).map((sl, i1) => (
                      <button
                        key={i1}
                        type="button"
                        onClick={sl.pick}
                        disabled={sl.disabled}
                        aria-pressed={sl.on}
                        title={sl.title}
                        style={{
                          height: '38px',
                          borderRadius: '9px',
                          border: `1px solid ${sl.border}`,
                          background: sl.bg,
                          color: sl.fg,
                          font: '500 12px/1 Figtree',
                          textDecoration: sl.deco,
                        }}
                      >
                        {sl.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {field.isInfo ? (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F7F2EA', font: '400 13px/1.45 Figtree' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{field.label}</span>
                    <span style={{ font: '500 18px/1 Newsreader,serif' }}>{field.value}</span>
                  </span>
                  <span style={{ display: 'block', marginTop: '4px', color: '#8C7A6E' }}>{field.sub}</span>
                </div>
              ) : null}
            </Fragment>
          ))}
          {f.err ? (
            <p role="alert" style={{ margin: 0, font: '500 13px/1.4 Figtree', color: '#9A4436' }}>
              {f.err}
            </p>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '14px 24px 22px', borderTop: '1px solid rgba(44,26,18,.06)' }}>
          <button
            type="button"
            onClick={f.close}
            style={{
              height: '46px',
              padding: '0 18px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              whiteSpace: 'nowrap',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={f.submit}
            style={{
              flex: 1,
              height: '46px',
              borderRadius: '12px',
              border: 0,
              background: '#2C1A12',
              color: '#F5EDE2',
              font: '600 14px/1 Figtree',
            }}
          >
            {f.cta}
          </button>
        </div>
      </div>
    </>
  );
}
