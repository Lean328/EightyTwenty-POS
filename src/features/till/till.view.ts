// View-model for the till: menu grid, live orders, tables, kitchen, held orders, cart and side panels.
import type { ChangeEvent, MouseEvent } from 'react';
import { fmtHM, iso } from '../../domain/hours';
import { dueC, fmtC, orderPayments, paidC, refundableC, refundedC } from '../../domain/ledger';
import { CHANNEL_LABEL, isActive, isIncoming, isLive, NEXT_STATUS, ORDER_TYPE_LABEL, tablesOf } from '../../domain/policies';
import { lineTotal, missingRequired, money as M, subtotal, unitPrice } from '../../domain/pricing';
import type { Order, OrderLine, OrderStatus } from '../../domain/types';
import { uid } from '../../lib/ids';
import { effective, photo } from '../../state/actions/catalog';
import { acceptOrder, advanceOrder, openOrderAct, printDocket, printReceipt, statusLabel } from '../../state/actions/orders';
import { cartTotals } from '../../state/actions/payments';
import { occupancy } from '../../state/actions/tables';
import { applyCurrentPrices, holdCart, openItem, quickAdd, sendKitchen } from '../../state/actions/till';
import type { PosStore } from '../../state/store';
import type { MenuFilter, TillView } from '../../state/types';

const CHAN_STYLE = { pos: ['#ECE4D7', '#3A2B24'], web: ['#E9C89E', '#2C1A12'], app: ['#2C1A12', '#F5EDE2'] } as const;

export function statusStyle(st: OrderStatus | string): [string, string] {
  const map: Record<string, [string, string]> = {
    failed: ['#FBE9E4', '#8A2E1C'],
    new: ['#E9C89E', '#2C1A12'],
    preparing: ['#2C1A12', '#F5EDE2'],
    ready: ['#EEF1E4', '#4E6538'],
    completed: ['rgba(44,26,18,.06)', '#8C7A6E'],
    refunded: ['#FBE9E4', '#8A2E1C'],
    pending: ['#E9C89E', '#2C1A12'],
    confirmed: ['#EEF1E4', '#4E6538'],
    cancelled: ['#FBE9E4', '#8A2E1C'],
  };
  return map[st] || ['#ECE4D7', '#3A2B24'];
}

export const modsText = (l: Pick<OrderLine, 'sel' | 'adjust'>): string =>
  Object.values(l.sel || {})
    .flat()
    .concat(l.adjust || [])
    .join(' · ');

const sel = (on: boolean) =>
  on ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: 'transparent', fg: '#3A2B24', border: 'rgba(44,26,18,.14)' };
const itemsLabel = (n: number) => 'View order · ' + n + (n === 1 ? ' item' : ' items');

export function buildTillView(store: PosStore) {
  const s = store.state;
  const { locations, categories, menu, menuById, tables } = s.catalog;
  const cafeObj = locations.find((l) => l.id === s.cafe) || locations[0];
  const cat = categories.find((c) => c.id === s.cat);
  const inCart: Record<string, number> = {};
  s.lines.forEach((l) => (inCart[l.itemId] = (inCart[l.itemId] || 0) + l.qty));
  const q = s.q.trim().toLowerCase();
  const off = new Set([...(s.soldOut || []), ...((s.branchOff || {})[s.cafe] || [])]);

  // ----- menu grid -----
  let items = menu
    .filter((m) => m.name !== 'Add Ons')
    .map((m) => effective(store, m))
    .filter((m) => (q ? (m.name + ' ' + m.desc + ' ' + m.diet.join(' ')).toLowerCase().includes(q) : m.cat === s.cat));
  const F: Record<MenuFilter, (m: (typeof items)[number]) => boolean> = {
    all: () => true,
    featured: (m) => !!m.featured,
    vegan: (m) => m.diet.some((d) => /vegan/i.test(d)),
    gf: (m) => m.diet.some((d) => /^GF|gluten/i.test(d)),
    df: (m) => m.diet.some((d) => /^DF|dairy/i.test(d)),
  };
  items = items.filter(F[s.filter] || F.all);
  const products = items.map((m) => {
    const need = missingRequired(m).length > 0,
      soldOut = off.has(m.id);
    return {
      id: m.id,
      name: m.name,
      priceS: M(m.price),
      ...photo(m),
      soldOut,
      opacity: soldOut ? 0.55 : 1,
      canQuick: !need && !soldOut,
      inCart: inCart[m.id] || 0,
      needsOpts: !soldOut && need,
      showMedia: m.cat !== 'addons',
      compactCount: m.cat === 'addons' && !!inCart[m.id],
      tags: [
        ...new Set(
          m.diet.map((d) => (/vegan/i.test(d) ? 'VG' : /^GF|gluten/i.test(d) ? 'GF' : /^DF|dairy/i.test(d) ? 'DF' : '')).filter(Boolean),
        ),
      ].slice(0, 3),
      open: () => {
        if (!soldOut) openItem(store, m);
        else store.say(`${m.name} is marked sold out — change this in Inventory.`);
      },
      quick: (e: MouseEvent) => {
        e.stopPropagation();
        quickAdd(store, m);
        store.say(`Added ${m.name}`);
      },
    };
  });
  const rail = categories.map((c) => {
    const on = c.id === s.cat && !q;
    return {
      id: c.id,
      name: c.id === 'addons' ? 'Sides & extras' : c.name,
      on,
      chipBg: on ? '#2C1A12' : 'transparent',
      chipFg: on ? '#F5EDE2' : '#574A40',
      weight: on ? 600 : 400,
      pick: () => store.setState({ cat: c.id, q: '', view: 'till' }),
    };
  });
  const liveCount = s.orders.filter((o) => isActive(o) && o.cafe === s.cafe).length;
  const viewDefs: [TillView, string, number?][] = [
    ['till', 'Till'],
    ['orders', 'Live', liveCount],
    ['tables', 'Tables'],
    ['kitchen', 'Kitchen'],
    ['held', 'Held', s.held.length],
  ];
  const views = viewDefs.map(([id, name, count]) => ({
    id,
    name,
    count,
    on: s.view === id,
    bg: s.view === id ? '#FFFCF7' : 'transparent',
    fg: s.view === id ? '#2C1A12' : '#8C7A6E',
    badgeBg: s.view === id ? '#B67A4B' : 'rgba(44,26,18,.12)',
    badgeFg: s.view === id ? '#FFFCF7' : '#3A2B24',
    pick: () => store.setState({ view: id, cartOpen: false }),
  }));
  const filterDefs: [MenuFilter, string][] = [
    ['all', 'All items'],
    ['featured', 'Featured'],
    ['vegan', 'Vegan'],
    ['gf', 'Gluten free'],
    ['df', 'Dairy free'],
  ];
  const filters = filterDefs.map(([id, name]) => ({
    id,
    name,
    on: s.filter === id,
    mark: s.filter === id ? '✓' : '',
    bg: s.filter === id ? '#F7F2EA' : 'transparent',
    pick: () => store.setState({ filter: id, filtersOpen: false }),
  }));
  const filterName = ({ featured: 'Featured', vegan: 'Vegan', gf: 'Gluten free', df: 'Dairy free' } as Record<string, string>)[s.filter];

  // ----- cart -----
  const t0 = cartTotals(store);
  const customer = s.customers.find((c) => c.id === s.customerId);
  const per = s.loy.per;
  const cartLines = s.lines.map((l) => ({
    key: l.key,
    name: l.name,
    qty: l.qty,
    ...photo(menuById[l.itemId]),
    mods: modsText(l),
    note: l.note,
    priceS: M(lineTotal(l)),
    inc: () => store.setState((st) => ({ lines: st.lines.map((x) => (x.key === l.key ? { ...x, qty: x.qty + 1 } : x)) })),
    dec: () =>
      store.setState((st) => ({ lines: st.lines.map((x) => (x.key === l.key ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0) })),
    edit: () => {
      const it = menuById[l.itemId];
      if (it) openItem(store, effective(store, it), l);
    },
  }));
  const stale = s.lines.filter((l) => {
    const it = menuById[l.itemId];
    return it && unitPrice(effective(store, it), l.sel) !== l.price;
  });
  const priceNote = stale.length
    ? `${stale.length === 1 ? stale[0].name + ' has' : stale.length + ' items have'} a new price since being added.`
    : '';
  const t = {
    subS: M(t0.sub),
    hasDisc: t0.disc > 0,
    discLabel: s.discount ? s.discount.label : '',
    discS: M(t0.disc),
    hasDelivery: t0.delivery > 0,
    deliveryS: M(t0.delivery),
    hasGift: t0.gift > 0,
    giftLast: s.gift ? s.gift.last4 : '',
    giftS: M(t0.gift),
    gstS: M(t0.gst),
    dueS: M(t0.due),
  };
  const typeDefs: [typeof s.type, string][] = [
    ['dinein', 'Dine in'],
    ['pickup', 'Pickup'],
    ['takeaway', 'Takeaway'],
    ['delivery', 'Delivery'],
  ];
  const types = typeDefs.map(([id, name]) => ({
    id,
    name,
    on: s.type === id,
    bg: s.type === id ? '#FFFCF7' : 'transparent',
    fg: s.type === id ? '#2C1A12' : '#8C7A6E',
    pick: () => store.setState({ type: id, table: id === 'dinein' ? s.table : '' }),
  }));
  const openTables = occupancy(store);
  const todayISO = iso(new Date());
  const todayRes = s.reservations
    .filter((r) => r.cafe === s.cafe && r.date === todayISO && r.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
  const resByTable: Record<string, (typeof todayRes)[number]> = {};
  todayRes.forEach((r) => {
    if (r.table && r.status !== 'completed') resByTable[r.table] = r;
  });

  // ----- live orders -----
  const dayOrders = s.orders.filter(
    (o) =>
      o.cafe === s.cafe &&
      (s.orderChan === 'all' || o.channel === s.orderChan) &&
      (s.orderStatus === 'all' || (s.orderStatus === 'live' ? isLive(o) : o.status === s.orderStatus)),
  );
  const custName = (o: Order) => s.customers.find((c) => c.id === o.customerId);
  const summary = (o: Order) => o.lines.map((l) => (l.qty > 1 ? l.qty + '× ' : '') + l.name).join(', ');
  const orderRows = dayOrders.map((o) => {
    const c = custName(o);
    const [stBg, stFg] = statusStyle(o.status);
    const [chanBg, chanFg] = CHAN_STYLE[o.channel];
    const on = s.selOrder === o.id;
    return {
      id: o.id,
      time: fmtHM(o.time),
      chan: CHANNEL_LABEL[o.channel],
      chanBg,
      chanFg,
      summary: `${ORDER_TYPE_LABEL[o.type]}${o.table ? ' · ' + o.table : ''}${c ? ' · ' + c.name : ''} — ${summary(o)}`,
      totalS: M(o.total),
      status: statusLabel(o),
      stBg,
      stFg,
      on,
      bg: on ? '#FFFCF7' : 'rgba(255,252,247,.55)',
      border: on ? '#B67A4B' : 'rgba(44,26,18,.06)',
      pick: () => store.setState({ selOrder: o.id, cartOpen: s.narrow }),
    };
  });
  const chanDefs: [typeof s.orderChan, string][] = [
    ['all', 'All channels'],
    ['pos', 'POS'],
    ['web', 'Website'],
    ['app', 'App'],
  ];
  const chanFilters = chanDefs.map(([id, name]) => ({
    id,
    name,
    on: s.orderChan === id,
    ...sel(s.orderChan === id),
    pick: () => store.setState({ orderChan: id }),
  }));
  const statusDefs: [typeof s.orderStatus, string][] = [
    ['live', 'Live'],
    ['completed', 'Completed'],
    ['refunded', 'Refunded'],
    ['cancelled', 'Cancelled'],
    ['all', 'All today'],
  ];
  const statusFilters = statusDefs.map(([id, name]) => ({
    id,
    name,
    on: s.orderStatus === id,
    ...sel(s.orderStatus === id),
    pick: () => store.setState({ orderStatus: id }),
  }));

  // ----- order detail -----
  const selO = s.orders.find((o) => o.id === s.selOrder);
  let od = null;
  if (selO) {
    const c = custName(selO);
    const [stBg, stFg] = statusStyle(selO.status);
    const next = NEXT_STATUS[selO.status];
    const steps = ['new', 'preparing', 'ready', 'completed'];
    const idx = steps.indexOf(selO.status);
    const methodLabel: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      wallet: 'Apple Pay',
      gift: 'Gift card',
      reward: 'Loyalty reward',
    };
    const incoming = isIncoming(selO);
    od = {
      id: selO.id,
      status: statusLabel(selO),
      stBg,
      stFg,
      incoming,
      accept: () => acceptOrder(store, selO.id),
      reject: () => openOrderAct(store, selO.id, 'cancel'),
      isFailed: selO.status === 'failed',
      history: (selO.history || [])
        .slice()
        .reverse()
        .map((h, i) => ({ id: i, at: h.at, what: h.what })),
      hasHistory: !!(selO.history || []).length,
      docketFailed: selO.docket === 'failed',
      retryDocket: () => printDocket(store, selO.id),
      tablesLabel: tablesOf(selO).join(' + '),
      meta: `${fmtHM(selO.time)} · ${CHANNEL_LABEL[selO.channel]} · ${ORDER_TYPE_LABEL[selO.type]}${selO.table ? ' · Table ' + selO.table : ''}${selO.note ? ' · “' + selO.note + '”' : ''}`,
      customer: c ? `${c.name} · ${c.stamps}/${per} stamps${c.dietary.length ? ' · ' + c.dietary.join(', ') : ''}` : '',
      lines: selO.lines.map((l) => ({
        key: l.key,
        qty: l.qty,
        name: l.name,
        mods: modsText(l) + (l.note ? ' · “' + l.note + '”' : ''),
        totalS: M(lineTotal(l)),
      })),
      totalS: M(selO.total),
      payment: orderPayments(selO).length
        ? orderPayments(selO)
            .map((p) => `${methodLabel[p.method] || p.method} ${fmtC(p.amount)}`)
            .join(' + ') + (dueC(selO) ? ` · ${fmtC(dueC(selO))} due` : '')
        : selO.status === 'refunded'
          ? 'Refunded'
          : 'Open tab — unpaid',
      refundLine: refundedC(selO) ? `Refunded ${fmtC(refundedC(selO))} of ${fmtC(paidC(selO))}` : '',
      timeline: steps.map((st, i) => ({
        label: st[0].toUpperCase() + st.slice(1),
        state: i < idx || (i === idx && i === steps.length - 1) ? 'Completed' : i === idx ? 'Current' : '',
        dot: i <= idx ? '#B67A4B' : 'rgba(44,26,18,.15)',
        fg: i <= idx ? '#2C1A12' : '#9A8B80',
      })),
      canAdvance: !!next,
      advanceLabel:
        ({ preparing: 'Start preparing', ready: 'Mark ready', completed: 'Complete order' } as Record<string, string>)[next || ''] || '',
      advance: () => {
        advanceOrder(store, selO.id);
        store.setState({ cartOpen: false });
      },
      canPay: !selO.paid && !['refunded', 'cancelled', 'failed'].includes(selO.status),
      takePay: () =>
        store.setState({ dlg: { kind: 'pay', forOrderId: selO.id, method: s.online ? 'card' : 'cash', mode: 'full', key: uid('P') } }),
      canRefund: refundableC(selO) > 0 && selO.status !== 'cancelled',
      refund: () => openOrderAct(store, selO.id, 'refund'),
      canVoid: ['new', 'preparing', 'ready'].includes(selO.status) && !incoming,
      voidItems: () => openOrderAct(store, selO.id, 'void'),
      canCancel: ['new', 'failed'].includes(selO.status) && !incoming,
      cancel: () => openOrderAct(store, selO.id, 'cancel'),
      reorder: () => {
        const sold = new Set(store.state.soldOut || []);
        const keep = selO.lines.filter((l) => !sold.has(l.itemId));
        if (keep.length < selO.lines.length) store.say('Sold-out items were left out');
        store.setState({
          lines: keep.map((l) => ({ ...l, key: uid('L') })),
          type: selO.type,
          customerId: selO.customerId || null,
          view: 'till',
        });
        store.say(`Reordered ${selO.id} into the cart`);
      },
      print: () => printReceipt(store, selO.id, !!selO.prints),
    };
  }

  // ----- tables -----
  const zonesMap: Record<string, typeof tables> = {};
  tables.forEach((tb) => {
    (zonesMap[tb.zone] = zonesMap[tb.zone] || []).push(tb);
  });
  const openTable = (id: string) => () => store.setState({ dlg: { kind: 'table', tableId: id } });
  const zones = Object.entries(zonesMap).map(([name, tbs]) => ({
    name,
    tables: tbs.map((tb) => {
      const o = openTables[tb.id],
        r = resByTable[tb.id];
      const base = { id: tb.id, seats: tb.seats, pick: openTable(tb.id) };
      if (o)
        return {
          ...base,
          bg: '#2C1A12',
          fg: '#F5EDE2',
          border: '#2C1A12',
          line1: `${o.id} · ${o.lines.reduce((n, l) => n + l.qty, 0)} items · ${o.status}${tablesOf(o).length > 1 ? ' · joined ' + tablesOf(o).join('+') : ''}`,
          line2: o.paid ? 'Paid · tap to mark available' : M(dueC(o) / 100) + ' open',
        };
      if (r)
        return {
          ...base,
          bg: '#E9C89E',
          fg: '#2C1A12',
          border: '#E9C89E',
          line1: `Reserved ${fmtHM(r.time)} · ${r.guests} guests`,
          line2: r.name,
        };
      return { ...base, bg: '#FFFCF7', fg: '#2C1A12', border: 'rgba(44,26,18,.1)', line1: tb.zone, line2: 'Free — start order' };
    }),
  }));
  const todayResRows = todayRes.map((r) => {
    const [bg, fg] = statusStyle(r.status);
    return {
      id: r.id,
      time: fmtHM(r.time),
      name: r.name,
      meta: `${r.guests} guests${r.table ? ' · ' + r.table : ' · no table yet'}${r.notes ? ' · ' + r.notes : ''}`,
      status: r.status,
      bg,
      fg,
    };
  });

  // ----- kitchen -----
  const kitchenOrders = s.orders.filter((o) => o.cafe === s.cafe && isLive(o));
  const colDefs: [OrderStatus, string, string, string, string, string][] = [
    ['new', 'New', '#E9C89E', 'Start', '#2C1A12', '#F5EDE2'],
    ['preparing', 'Preparing', '#B67A4B', 'Ready', '#B67A4B', '#FFFCF7'],
    ['ready', 'Ready for pickup', '#3E6B47', 'Collected', '#EEF1E4', '#4E6538'],
  ];
  const kitchenCols = colDefs.map(([st, name, accent, btn, btnBg, btnFg]) => {
    const list = kitchenOrders.filter((o) => o.status === st || (st === 'new' && o.status === 'failed'));
    return {
      id: st,
      name,
      count: list.length,
      tickets: list.map((o) => ({
        id: o.id,
        accent,
        btn,
        btnBg,
        btnFg,
        meta: `${fmtHM(o.time)} · ${CHANNEL_LABEL[o.channel]} · ${ORDER_TYPE_LABEL[o.type]}${o.table ? ' ' + o.table : ''}`,
        lines: o.lines.map((l) => ({ key: l.key, qty: l.qty, name: l.name, mods: modsText(l) + (l.note ? ' · “' + l.note + '”' : '') })),
        incoming: isIncoming(o),
        normal: !isIncoming(o) && o.status !== 'failed',
        accept: () => acceptOrder(store, o.id),
        reject: () => openOrderAct(store, o.id, 'cancel'),
        failed: o.status === 'failed',
        cancelFailed: () => openOrderAct(store, o.id, 'cancel'),
        docketFailed: o.docket === 'failed',
        retryDocket: () => printDocket(store, o.id),
        bump: () => advanceOrder(store, o.id),
      })),
    };
  });

  // ----- held -----
  const heldRows = s.held.map((h) => ({
    id: h.id,
    label: h.label,
    time: h.time,
    summary: h.lines.map((l) => (l.qty > 1 ? l.qty + '× ' : '') + l.name).join(', '),
    totalS: M(subtotal(h.lines)),
    reopen: () => {
      store.setState((st) => ({
        held: st.held.filter((x) => x.id !== h.id),
        lines: [...st.lines, ...h.lines],
        type: h.type,
        table: h.table,
        customerId: h.customerId,
        note: h.note,
        view: 'till',
      }));
      store.say('Order reopened');
    },
    drop: () => store.setState((st) => ({ held: st.held.filter((x) => x.id !== h.id) })),
  }));

  // ----- layout -----
  const narrow = s.narrow,
    showCart = s.view === 'till' || s.view === 'held';
  const showAside = s.view !== 'kitchen' && (!narrow || s.cartOpen);
  const count = s.lines.reduce((n, l) => n + l.qty, 0);
  const barFor: Partial<Record<TillView, [string, string] | false>> = {
    till: s.lines.length > 0 && [itemsLabel(count), t.dueS],
    held: s.lines.length > 0 && [itemsLabel(count), t.dueS],
    orders: !!selO && [selO.id + ' · ' + selO.status, M(selO.total)],
    tables: [`${todayRes.length} booking${todayRes.length === 1 ? '' : 's'} today`, 'View'],
  };
  const bar = barFor[s.view];
  const net = !s.online
    ? { netBg: '#FBE9E4', netFg: '#8A2E1C', netBd: 'rgba(154,68,54,.3)' }
    : (s.conflicts || []).length > 0
      ? { netBg: '#FBF0E1', netFg: '#8B5827', netBd: 'rgba(182,122,75,.35)' }
      : { netBg: '#FFFCF7', netFg: '#3A2B24', netBd: 'rgba(44,26,18,.1)' };

  return {
    title: q
      ? `Search “${s.q}”`
      : s.view === 'till'
        ? cat
          ? cat.id === 'addons'
            ? 'Sides & extras'
            : cat.name
          : 'Menu'
        : views.find((x) => x.on)!.name,
    q: s.q,
    setQ: (e: ChangeEvent<HTMLInputElement>) => store.setState({ q: e.target.value, filter: 'all' }),
    cafeName: cafeObj ? cafeObj.name : '',
    views,
    rail,
    filters,
    products,
    noResults: products.length === 0,
    emptyMsg: q
      ? `Nothing matches “${s.q}”. Try an ingredient or a dietary tag.`
      : filterName
        ? `No ${filterName.toLowerCase()} items in this category.`
        : 'No items in this category.',
    hasFilter: !!filterName,
    clearFilter: () => store.setState({ filter: 'all' }),
    filtersOpen: !!s.filtersOpen,
    toggleFilters: () => store.setState({ filtersOpen: !s.filtersOpen }),
    filterLabel: filterName ? 'Filter · ' + filterName : 'Filters',
    filterBorder: filterName ? '#B67A4B' : 'rgba(44,26,18,.12)',
    catNote: q
      ? `${products.length} result${products.length === 1 ? '' : 's'}`
      : (cat && cat.note) || `${products.length} items · ${cafeObj?.hoursShort || ''}`,
    isTill: s.view === 'till',
    isOrders: s.view === 'orders',
    isTables: s.view === 'tables',
    isKitchen: s.view === 'kitchen',
    isHeld: s.view === 'held',
    narrow,
    showAside,
    showCart,
    showOrderDetail: s.view === 'orders',
    showTableDetail: s.view === 'tables',
    showCartBar: narrow && !s.cartOpen && !!bar,
    barLabel: bar ? bar[0] : '',
    barValue: bar ? bar[1] : '',
    asidePos: (narrow ? 'fixed' : 'relative') as 'fixed' | 'relative',
    asideInset: narrow ? '0 0 0 72px' : 'auto',
    asideWidth: narrow ? '100%' : '380px',
    asidePad: narrow ? '12px' : '20px 22px 22px 0',
    asideBg: narrow ? 'rgba(44,26,18,.45)' : 'transparent',
    openCart: () => store.setState({ cartOpen: true }),
    closeCart: () => store.setState({ cartOpen: false }),
    cartTitle: s.type === 'dinein' && s.table ? `Table ${s.table}` : 'New order',
    clearCart: () => store.setState({ lines: [], discount: null, gift: null, note: '', table: '' }),
    types,
    isDineIn: s.type === 'dinein',
    tableLabel: s.table ? `Table ${s.table}` : 'Table…',
    openTablePick: () => store.setState({ dlg: { kind: 'tablePick' } }),
    openCafe: () => store.setState({ dlg: { kind: 'cafe' } }),
    custLabel: customer ? customer.name : 'Attach customer · scan loyalty card',
    custMeta: customer ? `${customer.stamps}/${per}${customer.rewards ? ' · reward' : ''}` : '',
    custBorder: customer ? '#B67A4B' : 'rgba(44,26,18,.25)',
    custBg: customer ? '#F7F2EA' : 'transparent',
    hasCustomer: !!customer,
    openCustomer: () => store.setState({ dlg: { kind: 'customer', q: '' } }),
    detachCustomer: () => store.setState({ customerId: null, dlg: null }),
    cartEmpty: !s.lines.length,
    emptyOp: s.lines.length ? 1 : 0.45,
    priceNote,
    applyPrices: () => applyCurrentPrices(store),
    cartLines,
    t,
    discountBtn: s.discount ? s.discount.label : s.gift ? `Gift ···${s.gift.last4}` : 'Discount · promo · gift',
    openDiscount: () => store.setState({ dlg: { kind: 'discount', tab: 'discount' } }),
    noteBtn: s.note ? 'Note added' : 'Order note',
    openNote: () => store.setState({ dlg: { kind: 'note' } }),
    holdCart: () => holdCart(store),
    sendKitchen: () => sendKitchen(store),
    printBill: () => store.say(s.lines.length ? 'Bill printed' : 'Nothing to print'),
    openPay: () => {
      if (!store.state.lines.length) return store.say('Add items first');
      store.setState({ dlg: { kind: 'pay', method: store.state.online ? 'card' : 'cash', mode: 'full', key: uid('P') } });
    },
    chanFilters,
    statusFilters,
    orderRows,
    orderCount: dayOrders.length,
    od,
    noOrderSel: !selO,
    zones,
    todayRes: todayResRows,
    noRes: !todayRes.length,
    resSummary: `${todayRes.length} booking${todayRes.length === 1 ? '' : 's'} · ${todayRes.reduce((n, r) => n + r.guests, 0)} covers · ${cafeObj?.hoursShort || ''}`,
    kitchenCols,
    heldRows,
    noHeld: !s.held.length,
    shiftChip: s.shift ? `Shift · ${s.shift.staffName.split(' ')[0]} · since ${s.shift.openedAt.split(', ').pop()}` : 'Open shift',
    openShiftDlg: () => store.setState({ dlg: { kind: 'shift' } }),
    netChip: s.online ? (s.queue.length ? `Syncing · ${s.queue.length}` : 'Online') : `Offline · ${s.queue.length} queued`,
    ...net,
    netAlert: (s.conflicts || []).length,
    openSync: () => store.setState({ dlg: { kind: 'sync' } }),
  };
}

export type TillViewModel = ReturnType<typeof buildTillView>;
