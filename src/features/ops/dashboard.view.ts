import { iso } from '../../domain/hours';
import { stampsFor } from '../../domain/loyalty';
import { CHANNEL_LABEL, isLive, ORDER_TYPE_LABEL } from '../../domain/policies';
import type { Order } from '../../domain/types';
import { statusLabel } from '../../state/actions/orders';
import type { PosStore } from '../../state/store';
import { CHAN_STYLE, fmtT, M, M0, scope, statusStyle } from './common';

/** One order row as shown on the dashboard and the orders board. */
export function orderRowFor(store: PosStore, o: Order) {
  const s = store.state,
    { cafeName } = scope(store);
  const c = s.customers.find((x) => x.id === o.customerId);
  const [stBg, stFg] = statusStyle(o.status);
  const [chanBg, chanFg] = CHAN_STYLE[o.channel];
  return {
    id: o.id,
    time: fmtT(o.time),
    chan: CHANNEL_LABEL[o.channel],
    chanBg,
    chanFg,
    cafeName: cafeName(o.cafe),
    summary: `${ORDER_TYPE_LABEL[o.type]}${o.table ? ' · ' + o.table : ''}${c ? ' · ' + c.name : ''} — ${o.lines.map((l) => (l.qty > 1 ? l.qty + '× ' : '') + l.name).join(', ')}`,
    totalS: M(o.total),
    status: statusLabel(o),
    stBg,
    stFg,
    bg: s.ops.selOrder === o.id ? '#F7F2EA' : 'transparent',
    pick: () => store.setOps({ selOrder: o.id }),
  };
}

export function buildDashboard(store: PosStore) {
  const s = store.state,
    { inScope, cafeName } = scope(store);
  const scoped = s.orders.filter((o) => inScope(o.cafe));
  const liveCount = s.orders.filter((o) => isLive(o) && inScope(o.cafe)).length;
  const today = scoped.filter((o) => o.status !== 'refunded');
  const sales = today.reduce((n, o) => n + o.total, 0);
  const todayISO = iso(new Date());
  const todayRes = s.reservations
    .filter((r) => r.date === todayISO && inScope(r.cafe) && r.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
  const pendingRes = s.reservations.filter((r) => r.status === 'pending' && inScope(r.cafe)).length;
  const openCat = s.catering.filter((c) => ['enquiry', 'quoted'].includes(c.status)).length;
  const awaiting = s.orders.filter((o) => o.status === 'new' && o.accepted === false).length;
  const queued = (s.queue || []).length;
  const attention = [
    pendingRes
      ? {
          text: `${pendingRes} reservation${pendingRes > 1 ? 's' : ''} awaiting confirmation`,
          cta: 'Review',
          href: '#reservations',
          dot: '#B67A4B',
        }
      : null,
    openCat
      ? {
          text: `${openCat} catering enquir${openCat > 1 ? 'ies' : 'y'} to quote or confirm`,
          cta: 'Catering',
          href: '#catering',
          dot: '#B67A4B',
        }
      : null,
    !s.shift ? { text: 'No cash shift is open on the till', cta: 'Shifts', href: '#staff', dot: '#B67A4B' } : null,
    queued ? { text: `${queued} offline item${queued > 1 ? 's' : ''} waiting to sync`, cta: 'Till', href: '#till', dot: '#9A4436' } : null,
    awaiting ? { text: `${awaiting} online orders waiting to be accepted`, cta: 'Orders', href: '#orders', dot: '#B67A4B' } : null,
  ].filter((x) => x !== null);
  return {
    kpis: [
      { label: 'Sales today', value: M0(sales), delta: s.reports?.salesTodayComparison || '', deltaFg: '#3E6B47' },
      { label: 'Orders', value: today.length, delta: `${liveCount} live right now`, deltaFg: '#8C7A6E' },
      { label: 'Avg order', value: M(today.length ? sales / today.length : 0), delta: 'GST incl.', deltaFg: '#8C7A6E' },
      {
        label: 'Bookings today',
        value: todayRes.length,
        delta: `${todayRes.reduce((n, r) => n + r.guests, 0)} covers`,
        deltaFg: '#8C7A6E',
      },
      {
        label: 'Stamps today',
        value: today.reduce((n, o) => n + stampsFor(o.lines, s.catalog.menuById), 0),
        delta: `${s.customers.filter((c) => c.rewards).length} rewards waiting`,
        deltaFg: '#8C7A6E',
      },
    ],
    liveOrders: scoped.filter(isLive).map((o) => orderRowFor(store, o)),
    dashRes: todayRes.map((r) => {
      const [bg, fg] = statusStyle(r.status);
      return { id: r.id, time: fmtT(r.time), name: r.name, guests: r.guests, cafeName: cafeName(r.cafe), status: r.status, bg, fg };
    }),
    attention,
  };
}

export type DashboardView = ReturnType<typeof buildDashboard>;
