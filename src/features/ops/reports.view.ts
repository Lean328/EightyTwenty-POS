// Reports are read-only summaries owned by the backend; the POS only lays them out.
import type { ReportsData } from '../../domain/types';
import type { PosStore } from '../../state/store';
import { M, M0 } from './common';

const EMPTY: ReportsData = {
  days: [{ d: 'Fri', sales: 0, orders: 0 }],
  weeks: [{ w: '—', sales: 0 }],
  best: [],
  payments: [],
  channels: [],
  loyalty: { stamps: 0, rewards: 0, newMembers: 0, walletPasses: 0 },
  reservations: { week: 0, covers: 0, noShow: 0, avgParty: 0 },
  catering: { enquiries: 0, confirmed: 0, revenue: 0 },
  salesTodayComparison: '',
  weekComparison: '',
  loyaltyActivity: [],
};
const FULL_DAY: Record<string, string> = {
  Sat: 'Saturday',
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};
const pc = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%';
const ck = (v: number) => (v >= 1000 ? '$' + v / 1000 + 'k' : '$' + v);
const PALETTE = ['#77816B', '#A96F58', '#DCC2A0', '#8C7A6E', '#E6DACA'];

export function buildReports(store: PosStore) {
  const s = store.state,
    R = s.reports && s.reports.days.length ? s.reports : EMPTY;
  const { menuById } = s.catalog;
  const custById = Object.fromEntries(s.customers.map((c) => [c.id, c]));
  const wk = R.days.reduce((n, d) => n + d.sales, 0),
    ords = R.days.reduce((n, d) => n + d.orders, 0);
  const best = R.days.reduce((b, d) => (d.sales > b.sales ? d : b), R.days[0]);
  const repKpis = [
    { label: 'Revenue · 7 days', value: M0(wk), delta: R.weekComparison, deltaFg: '#5E6754' },
    { label: 'Orders', value: ords.toLocaleString('en-AU'), delta: `${M(ords ? wk / ords : 0)} average`, deltaFg: '#8C7A6E' },
    {
      label: 'Today so far',
      value: M0(R.days[R.days.length - 1].sales),
      delta: `${R.days[R.days.length - 1].orders} orders · partial day`,
      deltaFg: '#8C7A6E',
    },
    { label: 'Best day', value: FULL_DAY[best.d] || best.d, delta: M0(best.sales), deltaFg: '#8C7A6E' },
  ];
  const n = R.days.length,
    mx = Math.max(...R.days.map((d) => d.sales), 1),
    top = Math.ceil(mx / 2000) * 2000,
    now = new Date();
  const dt = (i: number) => {
    const x = new Date(now);
    x.setDate(now.getDate() - (n - 1 - i));
    return x.getDate() + ' ' + x.toLocaleDateString('en-AU', { month: 'short' });
  };
  const step = 92 / Math.max(1, n - 1);
  const pts = R.days.map((d, i) => ({ x: 4 + i * step, y: 100 - (d.sales / top) * 100 }));
  const path = (a: typeof pts) => a.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2)).join(' ');
  const partial = !!R.days[n - 1].partial,
    hv = s.ops.repHover;
  let tip = null;
  if (hv != null && R.days[hv]) {
    const d = R.days[hv],
      p = pts[hv],
      prev = R.days[hv - 1],
      ch = prev ? ((d.sales - prev.sales) / prev.sales) * 100 : null;
    tip = {
      left: p.x + '%',
      top: p.y + '%',
      tf: p.x > 55 ? 'translate(calc(-100% - 16px), -50%)' : 'translate(16px, -50%)',
      title: `${FULL_DAY[d.d]} ${dt(hv)}`,
      value: M0(d.sales),
      sub: `${d.orders} orders · ${M(d.orders ? d.sales / d.orders : 0)} average`,
      chS: d.partial ? 'Trading day in progress' : ch == null ? 'First day in range' : `${pc(ch)} vs ${FULL_DAY[prev.d]}`,
      chFg: d.partial || ch == null ? '#DCC2A0' : ch >= 0 ? '#C5CDB4' : '#E2AE98',
    };
  }
  const daily = {
    summary: `7-day total ${M0(wk)} · ${M0(wk / n)} daily average`,
    line: path(partial ? pts.slice(0, n - 1) : pts),
    dash: partial ? path(pts.slice(n - 2)) : '',
    area: path(pts) + ` L${pts[n - 1].x.toFixed(2)} 100 L${pts[0].x.toFixed(2)} 100 Z`,
    grid: Array.from({ length: top / 2000 + 1 }, (_, i) => {
      const v = top - i * 2000;
      return { id: v, label: ck(v), top: 100 - (v / top) * 100 + '%' };
    }),
    pts: R.days.map((d, i) => {
      const on = hv === i;
      return {
        id: i,
        d: d.d,
        dateS: dt(i),
        left: pts[i].x + '%',
        top: pts[i].y + '%',
        size: on ? '13px' : '9px',
        bg: d.partial ? '#FFFCF7' : on ? '#77816B' : '#FFFCF7',
        labFg: on ? '#2C1A12' : '#8C7A6E',
        labW: on ? 600 : 500,
        zoneLeft: pts[i].x - step / 2 + '%',
        zoneW: step + '%',
        aria: `${FULL_DAY[d.d]} ${dt(i)}: ${M0(d.sales)}, ${d.orders} orders`,
        enter: () => store.setOps({ repHover: i }),
      };
    }),
    leave: () => store.setOps({ repHover: null }),
    tip,
  };
  const wTop = Math.ceil(Math.max(...R.weeks.map((w) => w.sales), 1) / 5000) * 5000,
    wAvg = R.weeks.reduce((a, w) => a + w.sales, 0) / R.weeks.length;
  const weekRows = R.weeks.map((w, i) => {
    const prev = R.weeks[i - 1],
      cur = i === R.weeks.length - 1,
      ch = prev ? ((w.sales - prev.sales) / prev.sales) * 100 : null;
    return {
      id: w.w,
      w: w.w,
      valueS: M0(w.sales),
      pct: ((w.sales / wTop) * 100).toFixed(1) + '%',
      avgPct: ((wAvg / wTop) * 100).toFixed(1) + '%',
      bar: cur ? '#DCC2A0' : '#77816B',
      chS: cur ? 'Week to date' : ch == null ? '—' : pc(ch) + ' vs ' + prev.w,
      chFg: cur || ch == null ? '#8C7A6E' : ch >= 0 ? '#5E6754' : '#A96F58',
    };
  });
  const bm = Math.max(...R.best.map((b) => b.rev), 1),
    bt = R.best.reduce((a, b) => a + b.rev, 0) || 1;
  const spend: Record<string, { n: number; amt: number }> = {};
  s.orders.forEach((o) => {
    if (o.customerId && o.status !== 'refunded') {
      spend[o.customerId] = spend[o.customerId] || { n: 0, amt: 0 };
      spend[o.customerId].n++;
      spend[o.customerId].amt += o.total;
    }
  });
  const rows = (a: [string, string | number][]) => a.map(([k, v]) => ({ id: k, k, v }));
  return {
    repLead: repKpis[0],
    repSub: repKpis.slice(1),
    daily,
    weekAvgS: `5-week average ${M0(wAvg)}`,
    weekRows,
    bestRows: R.best.map((b, i) => ({
      id: b.itemId,
      rank: i + 1,
      name: menuById[b.itemId]?.name || b.itemId,
      qty: b.qty,
      qtyS: b.qty.toLocaleString('en-AU'),
      avgS: M(b.rev / b.qty),
      revS: M0(b.rev),
      pct: Math.round((b.rev / bm) * 100) + '%',
      share: Math.round((b.rev / bt) * 100) + '%',
    })),
    payMix: R.payments.map((p, i) => ({ m: p.m, pct: p.pct + '%', amtS: M0(p.amt), bg: PALETTE[i] })),
    payTotal: M0(R.payments.reduce((a, p) => a + p.amt, 0)),
    chanMix: R.channels.map((c, i) => ({ c: c.c, pct: c.pct + '%', bg: PALETTE[i] })),
    topCust: Object.entries(spend)
      .filter(([id]) => custById[id])
      .sort((a, b) => b[1].amt - a[1].amt)
      .slice(0, 5)
      .map(([id, v], i) => ({
        id,
        n: i + 1,
        name: custById[id].name,
        href: '#customers/' + id,
        orders: v.n,
        avgS: M(v.amt / v.n),
        spendS: M(v.amt),
      })),
    repGroups: [
      {
        id: 'loy',
        name: 'Loyalty',
        lead: R.loyalty.stamps.toLocaleString('en-AU'),
        leadK: 'stamps issued',
        rows: rows([
          ['Rewards redeemed', R.loyalty.rewards],
          ['New members', R.loyalty.newMembers],
          ['Wallet passes', R.loyalty.walletPasses],
        ]),
      },
      {
        id: 'res',
        name: 'Reservations',
        lead: R.reservations.week,
        leadK: 'bookings',
        rows: rows([
          ['Covers', R.reservations.covers],
          ['Average party', R.reservations.avgParty],
          [
            'No-shows',
            `${R.reservations.noShow} · ${R.reservations.week ? ((R.reservations.noShow / R.reservations.week) * 100).toFixed(1) : '0.0'}%`,
          ],
        ]),
      },
      {
        id: 'cat',
        name: 'Catering',
        lead: M0(R.catering.revenue),
        leadK: 'confirmed revenue',
        rows: rows([
          ['Enquiries', R.catering.enquiries],
          ['Confirmed', R.catering.confirmed],
          ['Conversion', (R.catering.enquiries ? Math.round((R.catering.confirmed / R.catering.enquiries) * 100) : 0) + '%'],
        ]),
      },
    ],
  };
}

export type ReportsView = ReturnType<typeof buildReports>;
