import { Cart } from './Cart';
import { CartBar } from './CartBar';
import { FloorPlan } from './FloorPlan';
import { HeldOrders } from './HeldOrders';
import { KitchenBoard } from './KitchenBoard';
import { LiveOrders } from './LiveOrders';
import { MenuGrid } from './MenuGrid';
import { OrderDetail } from './OrderDetail';
import { TableDetail } from './TableDetail';
import type { TillViewModel } from './till.view';

export function TillScreen({ v }: { v: TillViewModel }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', height: '100vh', minHeight: '640px', overflow: 'hidden' }}>
      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '20px 22px 0 24px', gap: '14px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, font: '500 26px/1.1 Newsreader,serif', letterSpacing: '-.01em', minWidth: '120px' }}>{v.title}</h1>
          <label
            style={{
              flex: 1,
              minWidth: '180px',
              maxWidth: '520px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: '44px',
              padding: '0 16px',
              borderRadius: '12px',
              background: '#FFFCF7',
              border: '1px solid rgba(44,26,18,.08)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '14px',
                height: '14px',
                border: '1.6px solid #9A8B80',
                borderRadius: '50%',
                position: 'relative',
                flex: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  width: '1.6px',
                  height: '6px',
                  background: '#9A8B80',
                  right: '-3px',
                  bottom: '-4px',
                  transform: 'rotate(-45deg)',
                }}
              />
            </span>
            <input
              type="search"
              value={v.q}
              onChange={v.setQ}
              placeholder="Search menu — name, ingredient, GF, vegan…"
              aria-label="Search menu"
              style={{ flex: 1, border: 0, background: 'transparent', fontSize: '14px', minWidth: 0 }}
            />
          </label>
          <div
            role="tablist"
            style={{ display: 'flex', gap: '2px', padding: '3px', borderRadius: '12px', background: 'rgba(44,26,18,.06)' }}
          >
            {v.views.map((tab, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={tab.on}
                onClick={tab.pick}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  border: 0,
                  borderRadius: '9px',
                  background: tab.bg,
                  color: tab.fg,
                  font: '500 13px/1 Figtree',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <span>{tab.name}</span>
                {tab.count ? (
                  <span
                    style={{
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 5px',
                      borderRadius: '9px',
                      background: tab.badgeBg,
                      color: tab.badgeFg,
                      font: '600 11px/18px Figtree',
                      textAlign: 'center',
                    }}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={v.openCafe}
            aria-label="Change café"
            style={{
              height: '44px',
              padding: '0 12px 0 16px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.1)',
              background: '#FFFCF7',
              color: '#2C1A12',
              font: '500 13px/1 Figtree',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{v.cafeName}</span>
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" style={{ flex: 'none' }}>
              <path d="M2 3.5l3 3 3-3" fill="none" stroke="#9A8B80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={v.openSync}
            aria-label="Connection and sync"
            style={{
              height: '44px',
              padding: '0 16px',
              borderRadius: '22px',
              border: `1px solid ${v.netBd}`,
              background: v.netBg,
              color: v.netFg,
              font: '500 13px/1 Figtree',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{v.netChip}</span>
            {v.netAlert ? (
              <span
                style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '9px',
                  background: '#9A4436',
                  color: '#FFFCF7',
                  font: '600 10px/18px Figtree',
                  textAlign: 'center',
                }}
              >
                {v.netAlert}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={v.openShiftDlg}
            aria-label="Shift and cash"
            style={{
              height: '44px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid rgba(44,26,18,.08)',
              background: '#FFFCF7',
              font: '500 13px/1 Figtree',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            {v.shiftChip}
          </button>
        </header>
        {/* TILL */}
        {v.isTill ? <MenuGrid v={v} /> : null}
        {/* ORDERS */}
        {v.isOrders ? <LiveOrders v={v} /> : null}
        {/* TABLES */}
        {v.isTables ? <FloorPlan v={v} /> : null}
        {/* KITCHEN */}
        {v.isKitchen ? <KitchenBoard v={v} /> : null}
        {/* HELD */}
        {v.isHeld ? <HeldOrders v={v} /> : null}
      </main>
      {/* Right panel */}
      {v.showAside ? (
        <aside
          style={{
            position: v.asidePos,
            inset: v.asideInset,
            zIndex: 30,
            width: v.asideWidth,
            flex: 'none',
            padding: v.asidePad,
            display: 'flex',
            flexDirection: 'column',
            background: v.asideBg,
          }}
        >
          {v.narrow ? (
            <button
              type="button"
              onClick={v.closeCart}
              aria-label="Close"
              style={{ position: 'absolute', inset: 0, border: 0, background: 'transparent', cursor: 'default' }}
            />
          ) : null}
          <div
            style={{
              position: 'relative',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFCF7',
              borderRadius: '18px',
              border: '1px solid rgba(44,26,18,.06)',
              boxShadow: '0 10px 30px rgba(44,26,18,.06)',
              overflow: 'hidden',
            }}
          >
            {/* CART */}
            {v.showCart ? <Cart v={v} /> : null}
            {/* ORDER DETAIL */}
            {v.showOrderDetail ? <OrderDetail v={v} /> : null}
            {/* TABLE / RESERVATION DETAIL */}
            {v.showTableDetail ? <TableDetail v={v} /> : null}
          </div>
        </aside>
      ) : null}
      {/* Narrow: bottom bar */}
      {v.showCartBar ? <CartBar v={v} /> : null}
    </div>
  );
}
