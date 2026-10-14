import type { TillViewModel } from './till.view';

export function Cart({ v }: { v: TillViewModel }) {
  return (
    <>
      <div style={{ padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, font: '500 20px/1 Newsreader,serif' }}>{v.cartTitle}</h2>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={v.clearCart}
              style={{ border: 0, background: 'transparent', font: '400 13px/1 Figtree', color: '#8C7A6E', padding: '6px 0' }}
            >
              Clear all
            </button>
            {v.narrow ? (
              <button
                type="button"
                onClick={v.closeCart}
                aria-label="Close"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(44,26,18,.12)',
                  background: 'transparent',
                  font: '400 18px/1 Figtree',
                }}
              >
                ×
              </button>
            ) : null}
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Order type"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: '2px',
            padding: '3px',
            borderRadius: '10px',
            background: 'rgba(44,26,18,.06)',
          }}
        >
          {v.types.map((t, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={t.on}
              onClick={t.pick}
              style={{ height: '34px', border: 0, borderRadius: '8px', background: t.bg, color: t.fg, font: '500 12px/1 Figtree' }}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {v.isDineIn ? (
            <button
              type="button"
              onClick={v.openTablePick}
              aria-label="Choose table"
              style={{
                height: '40px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid rgba(44,26,18,.12)',
                background: '#F7F2EA',
                font: '500 13px/1 Figtree',
                flex: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {v.tableLabel} ▾
            </button>
          ) : null}
          <button
            type="button"
            onClick={v.openCustomer}
            style={{
              flex: 1,
              minWidth: 0,
              height: '40px',
              padding: '0 12px',
              borderRadius: '10px',
              border: `1px dashed ${v.custBorder}`,
              background: v.custBg,
              font: '500 13px/1 Figtree',
              color: '#3A2B24',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.custLabel}</span>
            <span style={{ font: '400 12px/1 Figtree', color: '#8B5827', flex: 'none' }}>{v.custMeta}</span>
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '0 18px' }}>
        {v.priceNote ? (
          <div
            role="status"
            style={{
              margin: '4px 0 8px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#F7F2EA',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              font: '500 12px/1.4 Figtree',
              color: '#3A2B24',
            }}
          >
            <span style={{ flex: 1 }}>{v.priceNote}</span>
            <button
              type="button"
              onClick={v.applyPrices}
              style={{
                height: '30px',
                padding: '0 10px',
                borderRadius: '7px',
                border: 0,
                background: '#2C1A12',
                color: '#F5EDE2',
                font: '600 11px/1 Figtree',
                whiteSpace: 'nowrap',
              }}
            >
              Use new prices
            </button>
          </div>
        ) : null}
        {v.cartEmpty ? (
          <p
            style={{
              margin: '20px 0',
              padding: '16px',
              borderRadius: '12px',
              border: '1px dashed rgba(44,26,18,.18)',
              textAlign: 'center',
              font: '400 13px/1.5 Figtree',
              color: '#8C7A6E',
            }}
          >
            No items yet. Choose a product to start the order.
          </p>
        ) : null}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {v.cartLines.map((l, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: '1px solid rgba(44,26,18,.06)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  background: '#ECE4D7',
                  flex: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {l.img ? (
                  <div
                    role="img"
                    aria-label={l.name}
                    style={{ position: 'absolute', inset: 0, background: `#ECE4D7 url('${l.img}') center / ${l.fit} no-repeat` }}
                  />
                ) : null}
                {l.noImg ? (
                  <span
                    aria-hidden="true"
                    style={{
                      font: '600 7px/1.2 ui-monospace,Menlo,monospace',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#9A8B80',
                      textAlign: 'center',
                    }}
                  >
                    No photo
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={l.edit}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  background: 'transparent',
                  textAlign: 'left',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <span style={{ font: '600 14px/1.25 Figtree' }}>{l.name}</span>
                {l.mods ? <span style={{ font: '400 12px/1.35 Figtree', color: '#8C7A6E' }}>{l.mods}</span> : null}
                {l.note ? <span style={{ font: 'italic 400 12px/1.35 Newsreader,serif', color: '#8B5827' }}>“{l.note}”</span> : null}
                <span style={{ font: '500 14px/1 Newsreader,serif', marginTop: '2px' }}>{l.priceS}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 'none' }}>
                <button
                  type="button"
                  onClick={l.dec}
                  aria-label="Decrease"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #B67A4B',
                    background: 'transparent',
                    color: '#8B5827',
                    font: '400 18px/1 Figtree',
                  }}
                >
                  −
                </button>
                <span style={{ minWidth: '18px', textAlign: 'center', font: '600 14px/1 Figtree' }}>{l.qty}</span>
                <button
                  type="button"
                  onClick={l.inc}
                  aria-label="Increase"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #B67A4B',
                    background: 'transparent',
                    color: '#8B5827',
                    font: '400 18px/1 Figtree',
                  }}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={v.openDiscount}
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '10px',
              border: '1px solid rgba(44,26,18,.12)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              color: '#3A2B24',
            }}
          >
            {v.discountBtn}
          </button>
          <button
            type="button"
            onClick={v.openNote}
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '10px',
              border: '1px solid rgba(44,26,18,.12)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              color: '#3A2B24',
            }}
          >
            {v.noteBtn}
          </button>
        </div>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#F7F2EA',
            display: 'grid',
            gap: '7px',
            font: '400 13px/1 Figtree',
            color: '#3A2B24',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Subtotal</span>
            <span>{v.t.subS}</span>
          </div>
          {v.t.hasDisc ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3E6B47' }}>
              <span>{v.t.discLabel}</span>
              <span>−{v.t.discS}</span>
            </div>
          ) : null}
          {v.t.hasDelivery ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery (10%)</span>
              <span>{v.t.deliveryS}</span>
            </div>
          ) : null}
          {v.t.hasGift ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3E6B47' }}>
              <span>Gift card ···{v.t.giftLast}</span>
              <span>−{v.t.giftS}</span>
            </div>
          ) : null}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8C7A6E' }}>
            <span>GST included</span>
            <span>{v.t.gstS}</span>
          </div>
          <div style={{ height: '1px', borderTop: '1px dashed rgba(44,26,18,.18)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: '600 15px/1 Figtree' }}>Total</span>
            <span style={{ font: '500 22px/1 Newsreader,serif' }}>{v.t.dueS}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={v.holdCart}
            disabled={v.cartEmpty}
            style={{
              height: '42px',
              borderRadius: '10px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              opacity: v.emptyOp,
            }}
          >
            Hold
          </button>
          <button
            type="button"
            onClick={v.sendKitchen}
            disabled={v.cartEmpty}
            style={{
              height: '42px',
              borderRadius: '10px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              opacity: v.emptyOp,
            }}
          >
            To kitchen
          </button>
          <button
            type="button"
            onClick={v.printBill}
            disabled={v.cartEmpty}
            style={{
              height: '42px',
              borderRadius: '10px',
              border: '1px solid rgba(44,26,18,.14)',
              background: 'transparent',
              font: '500 13px/1 Figtree',
              opacity: v.emptyOp,
            }}
          >
            Print bill
          </button>
        </div>
        <button
          type="button"
          onClick={v.openPay}
          disabled={v.cartEmpty}
          style={{
            opacity: v.emptyOp,
            height: '52px',
            borderRadius: '12px',
            border: 0,
            background: '#2C1A12',
            color: '#F5EDE2',
            font: '600 15px/1 Figtree',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
          }}
        >
          <span>Pay</span>
          <span style={{ font: '500 17px/1 Newsreader,serif' }}>{v.t.dueS}</span>
        </button>
      </div>
    </>
  );
}
