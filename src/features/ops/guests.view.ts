// Customers, loyalty and gift cards.
import type { ChangeEvent } from 'react';
import { niceDate } from '../../domain/hours';
import { addStamps } from '../../domain/loyalty';
import { CHANNEL_LABEL } from '../../domain/policies';
import { r2 } from '../../domain/pricing';
import type { Customer, GiftCard } from '../../domain/types';
import { initialsOf } from '../../lib/ids';
import { statusLabel } from '../../state/actions/orders';
import type { PosStore } from '../../state/store';
import { fmtT, gate, M, M0, scope, toggleStyle } from './common';

type Input = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

const lastLabel = (n: number) => (n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : n < 14 ? n + ' days ago' : Math.round(n / 7) + ' weeks ago');
const cap = (x: string) => (x ? x[0].toUpperCase() + x.slice(1) : '');
const ext = (c: Customer) => ({ visits: c.visits ?? 0, spend: c.spend ?? 0, lastDays: c.lastDays ?? 30 });

function setBalance(store: PosStore, c: Customer, next: Pick<Customer, 'stamps' | 'rewards'>, reason: string): void {
  store.setState((st) => ({ customers: st.customers.map((x) => (x.id === c.id ? { ...x, ...next } : x)) }));
  store.send({ type: 'loyalty.balance', customerId: c.id, stamps: next.stamps, rewards: next.rewards, reason });
}

const FILTERS: [string, string, (c: Customer) => boolean][] = [
  ['all', 'All', () => true],
  ['loyal', 'Loyalty members', (c) => !!c.wallet],
  ['diet', 'With dietary notes', (c) => c.dietary.length > 0],
  ['recent', 'Recent visitors', (c) => ext(c).lastDays <= 7],
  ['value', 'High value', (c) => ext(c).spend >= 1500],
];

/** Customers matching the current scope, filter and search — also drives the page subtitle. */
export function customerList(store: PosStore): Customer[] {
  const s = store.state,
    { inScope } = scope(store);
  const q = s.ops.custQ.toLowerCase();
  const fn = (FILTERS.find((f) => f[0] === s.ops.custFilter) || FILTERS[0])[2];
  return s.customers
    .filter((c) => inScope(c.homeCafe))
    .filter(fn)
    .filter((c) => !q || (c.name + c.phone + c.email + c.dietary.join(' ')).toLowerCase().includes(q));
}

export function buildCustomers(store: PosStore) {
  const s = store.state,
    o = s.ops,
    per = s.loy.per,
    { inScope, cafeName } = scope(store);
  const scoped = s.customers.filter((c) => inScope(c.homeCafe));
  const list = customerList(store);
  const cf = o.custFilter || 'all';
  const selId = list.some((c) => c.id === o.selCust) ? o.selCust : (list[0] || { id: null }).id;
  const custRows = list.map((c) => {
    const e = ext(c),
      on = c.id === selId,
      st = Math.min(c.stamps, per);
    return {
      id: c.id,
      name: c.name,
      initials: initialsOf(c.name),
      contact: `${c.phone} · ${c.email}`,
      cafeName: cafeName(c.homeCafe),
      since: c.since,
      visitsS: `${e.visits} visits`,
      lastS: 'Last ' + lastLabel(e.lastDays).toLowerCase(),
      diet: c.dietary.map((d) => ({ id: d, label: d })),
      stampsS: `${st}/${per}`,
      stampsLabel: `${st} of ${per} stamps${c.rewards ? ', ' + c.rewards + ' reward ready' : ''}`,
      pct: Math.round((st / per) * 100),
      pctS: Math.round((st / per) * 100) + '%',
      hasReward: c.rewards > 0,
      rewardS: `${c.rewards} reward${c.rewards > 1 ? 's' : ''} ready`,
      on,
      bg: on ? '#F1E8DC' : 'transparent',
      avBg: on ? '#2C1A12' : '#ECE4D7',
      avFg: on ? '#F5EDE2' : '#3A2B24',
      pick: () => {
        store.setOps({ custEdit: '', custExpand: '' });
        location.hash = '#customers/' + c.id;
      },
    };
  });
  const c = s.customers.find((x) => x.id === selId);
  let cp = null;
  if (c) {
    const e = ext(c),
      ex = o.custExpand || '',
      ed = o.custEdit || '',
      st = Math.min(c.stamps, per);
    const upd = (patch: Partial<Omit<Customer, 'id' | 'stamps' | 'rewards'>>) => {
      store.setState((x) => ({ customers: x.customers.map((y) => (y.id === c.id ? { ...y, ...patch } : y)) }));
      const cur = store.state.customers.find((y) => y.id === c.id);
      if (cur) {
        const { name, phone, email, homeCafe, dietary, notes } = cur;
        store.sendDebounced('customer:' + c.id, {
          type: 'customer.update',
          customerId: c.id,
          patch: { name, phone, email, homeCafe, dietary, notes },
        });
      }
    };
    const ords = s.orders
      .filter((x) => x.customerId === c.id)
      .map((x) => ({
        id: x.id,
        when: fmtT(x.time),
        title: x.lines.map((l) => (l.qty > 1 ? l.qty + ' × ' : '') + l.name).join(', '),
        meta: `${x.id} · ${CHANNEL_LABEL[x.channel]} · ${statusLabel(x)}`,
        amt: M(x.total),
      }));
    const res = s.reservations
      .filter((r) => r.customerId === c.id)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((r) => ({
        id: r.id,
        when: niceDate(r.date),
        title: `${fmtT(r.time)} · ${r.guests} guests${r.table ? ' · ' + r.table : ''}`,
        meta: `${cafeName(r.cafe)} · ${cap(r.status)}${r.notes ? ' · ' + r.notes : ''}`,
        amt: '',
      }));
    const cat = s.catering
      .filter((x) => x.customerId === c.id)
      .map((x) => ({ id: x.id, when: niceDate(x.date), title: `${x.guests} guests`, meta: cap(x.status), amt: M0(x.quote) }));
    const gcs = s.giftcards.filter((g) => g.customerId === c.id),
      bal = gcs.reduce((n, g) => n + g.balance, 0);
    const gift = gcs.map((g) => ({
      id: g.code,
      when: g.issuedOn.split(' ').slice(0, 2).join(' '),
      title: `Card ···${g.code.slice(-4)}`,
      meta: `Issued ${M(g.issued)}`,
      amt: M(g.balance),
    }));
    cp = {
      id: c.id,
      name: c.name,
      initials: initialsOf(c.name),
      phone: c.phone,
      email: c.email,
      homeCafe: c.homeCafe,
      cafeName: cafeName(c.homeCafe),
      since: c.since,
      diet: c.dietary.map((d) => ({ id: d, label: d })),
      hasDiet: c.dietary.length > 0,
      noDiet: !c.dietary.length,
      stats: [
        { k: 'Visits', v: String(e.visits), sub: 'Last ' + lastLabel(e.lastDays).toLowerCase() },
        { k: 'Lifetime spend', v: M0(e.spend), sub: e.visits ? 'avg ' + M(e.spend / e.visits) + ' a visit' : '—' },
        {
          k: 'Gift card',
          v: gcs.length ? M(bal) : '—',
          sub: gcs.length ? `${gcs.length} card${gcs.length > 1 ? 's' : ''} linked` : 'None linked',
        },
      ],
      pct: Math.round((st / per) * 100),
      pctS: Math.round((st / per) * 100) + '%',
      arrowS: Math.min(Math.max(Math.round((st / per) * 100), 12), 88) + '%',
      cardHead: `${st} of ${per} coffees`,
      cardLine: c.rewards ? `${c.rewards} free coffee${c.rewards > 1 ? 's' : ''} ready to redeem` : `${per - st} to go until a free coffee`,
      cardLineFg: c.rewards ? '#E9C89E' : '#F5EDE2',
      hasReward: c.rewards > 0,
      walletLine: c.wallet ? 'Apple Wallet pass' : 'No wallet pass yet',
      addStamp: () =>
        gate(store, 'loyalty.stamp', 'Add a stamp', () => {
          setBalance(store, c, addStamps(c, 1, per), 'Manual stamp');
          store.say('Stamp added for ' + c.name.split(' ')[0]);
        }),
      redeem: () =>
        gate(store, 'loyalty.stamp', 'Redeem a reward', () => {
          setBalance(store, c, { stamps: c.stamps, rewards: Math.max(0, c.rewards - 1) }, 'Reward redeemed');
          store.say('Reward redeemed');
        }),
      notes: c.notes,
      editingNote: ed === 'note',
      showNote: !!c.notes && ed !== 'note',
      noteEmpty: !c.notes && ed !== 'note',
      noteLabel: ed === 'note' ? 'Done' : c.notes ? 'Edit note' : 'Add note',
      toggleNote: () =>
        ed === 'note'
          ? store.setOps({ custEdit: '' })
          : gate(store, 'customers', 'Edit customer notes', () => store.setOps({ custEdit: 'note' })),
      setNotes: (ev: Input) => upd({ notes: ev.target.value }),
      editing: ed === 'profile',
      notEditing: ed !== 'profile',
      editLabel: ed === 'profile' ? 'Done editing' : 'Edit customer',
      toggleEdit: () =>
        ed === 'profile'
          ? store.setOps({ custEdit: '' })
          : gate(store, 'customers', 'Edit customer', () => store.setOps({ custEdit: 'profile' })),
      setName: (ev: Input) => upd({ name: ev.target.value }),
      setPhone: (ev: Input) => upd({ phone: ev.target.value }),
      setEmail: (ev: Input) => upd({ email: ev.target.value }),
      setCafe: (ev: Input) => upd({ homeCafe: ev.target.value }),
      cafeOpts: s.catalog.locations.map((l) => ({ id: l.id, name: l.name })),
      dietText: c.dietary.join(', '),
      setDiet: (ev: Input) =>
        upd({
          dietary: ev.target.value
            .split(',')
            .map((z) => z.trim())
            .filter(Boolean),
        }),
      sendGift: () =>
        gate(store, 'gift', 'Sell a gift card', () =>
          store.setOps({ form: { kind: 'gift', v: { amount: '50', customerId: c.id, note: '' } } }),
        ),
      orders: ex === 'orders' ? ords : ords.slice(0, 3),
      ordEmpty: !ords.length,
      ordMore: ords.length > 3,
      ordToggleLabel: ex === 'orders' ? 'Show fewer' : `View all ${ords.length} orders`,
      ordToggle: () => store.setOps({ custExpand: ex === 'orders' ? '' : 'orders' }),
      res: ex === 'res' ? res : res.slice(0, 3),
      resEmpty: !res.length,
      resMore: res.length > 3,
      resToggleLabel: ex === 'res' ? 'Show fewer' : `View all ${res.length} reservations`,
      resToggle: () => store.setOps({ custExpand: ex === 'res' ? '' : 'res' }),
      cat,
      hasCat: cat.length > 0,
      gift,
      hasGift: gift.length > 0,
    };
  }
  return {
    custQ: o.custQ,
    setCustQ: (e: Input) => store.setOps({ custQ: e.target.value }),
    custFilters: FILTERS.map(([id, name, f]) => {
      const on = cf === id;
      return {
        id,
        name,
        n: scoped.filter(f).length,
        on,
        bg: on ? '#2C1A12' : 'transparent',
        fg: on ? '#F5EDE2' : '#3A2B24',
        border: on ? '#2C1A12' : 'rgba(44,26,18,.14)',
        nFg: on ? 'rgba(245,237,226,.7)' : '#9A8B80',
        pick: () => store.setOps({ custFilter: id }),
      };
    }),
    custEmpty: !list.length,
    custRows,
    cp,
  };
}

export function buildLoyalty(store: PosStore) {
  const s = store.state,
    per = s.loy.per,
    { cafeName } = scope(store);
  const R = s.reports?.loyalty || { stamps: 0, rewards: 0, newMembers: 0, walletPasses: 0 };
  const setLoy = (patch: Partial<typeof s.loy>) => {
    if (!store.can('loyalty')) return;
    const loy = { ...store.state.loy, ...patch };
    store.setState({ loy });
    store.sendDebounced('loyalty-settings', { type: 'loyalty.settings', settings: loy });
  };
  const wallet = toggleStyle(s.loy.wallet),
    online = toggleStyle(s.loy.online);
  return {
    loyKpis: [
      { label: 'Stamps this week', value: R.stamps.toLocaleString('en-AU'), delta: 'one per coffee or hot drink' },
      { label: 'Rewards redeemed', value: R.rewards, delta: `${s.customers.filter((c) => c.rewards).length} waiting to be used` },
      { label: 'New members', value: R.newMembers, delta: 'joined via app this week' },
      {
        label: 'Wallet passes',
        value: R.walletPasses,
        delta: `${s.customers.filter((c) => c.wallet).length} of ${s.customers.length} shown here`,
      },
    ],
    loyRows: s.customers
      .slice()
      .sort((a, b) => b.rewards * 10 + b.stamps - (a.rewards * 10 + a.stamps))
      .map((c) => ({
        id: c.id,
        name: c.name,
        href: '#customers/' + c.id,
        meta: `${c.stamps}/${per} stamps${c.rewards ? ' · ' + c.rewards + ' reward ready' : ''} · ${cafeName(c.homeCafe)}`,
        dots: Array.from({ length: per }, (_, i) => ({ id: i, op: i < c.stamps ? 1 : 0.22 })),
        stampsLabel: `${Math.min(c.stamps, per)} of ${per} stamps`,
        stamp: () =>
          gate(store, 'loyalty.stamp', 'Add a stamp', () => {
            setBalance(store, c, addStamps(c, 1, per), 'Manual stamp');
            store.say(`Stamp added for ${c.name.split(' ')[0]}`);
          }),
        noReward: !c.rewards,
        redeemBg: c.rewards ? '#B67A4B' : '#9A8B80',
        redeem: () =>
          gate(store, 'loyalty.stamp', 'Redeem a reward', () => {
            if (c.rewards < 1) return;
            setBalance(store, c, { stamps: c.stamps, rewards: c.rewards - 1 }, 'Reward redeemed');
            store.say(`Free coffee redeemed · ${c.name}`);
          }),
      })),
    loy: {
      per,
      setPer: (e: Input) => setLoy({ per: Math.max(4, Math.min(12, +e.target.value || 9)) }),
      reward: s.loyaltyCopy.reward,
      eligible: s.loyaltyCopy.eligible,
      wallet: s.loy.wallet,
      walletBg: wallet.bg,
      walletKnob: wallet.knob,
      perReadOnly: !store.can('loyalty'),
      toggleWallet: () => gate(store, 'loyalty', 'Change loyalty settings', () => setLoy({ wallet: !store.state.loy.wallet })),
      online: s.loy.online,
      onlineBg: online.bg,
      onlineKnob: online.knob,
      toggleOnline: () => gate(store, 'loyalty', 'Change loyalty settings', () => setLoy({ online: !store.state.loy.online })),
    },
    loyHistory: s.reports?.loyaltyActivity || [],
  };
}

export function buildGift(store: PosStore) {
  const s = store.state,
    o = s.ops;
  const custById = Object.fromEntries(s.customers.map((c) => [c.id, c]));
  const g = s.giftcards.find((x) => x.code === o.selGift);
  let gd = null;
  if (g) {
    const adjust = (amount: number, what: string, msg: string) => {
      store.setState((st) => ({
        giftcards: st.giftcards.map((x: GiftCard) =>
          x.code === g.code ? { ...x, balance: r2(x.balance + amount), history: [...x.history, { d: 'Today', what, amt: amount }] } : x,
        ),
      }));
      store.setOps({ giftAmt: '' });
      store.send({ type: 'giftcard.adjust', code: g.code, amount, reason: what });
      store.say(msg);
    };
    gd = {
      code: g.code,
      balanceS: M(g.balance),
      meta: `Issued ${g.issuedOn} for ${M(g.issued)}${g.customerId ? ' · ' + (custById[g.customerId]?.name || '') : ' · no customer linked'}`,
      amt: o.giftAmt || '',
      setAmt: (e: Input) => store.setOps({ giftAmt: e.target.value }),
      redeem: () => {
        const a = +o.giftAmt;
        if (!(a > 0)) return store.say('Enter an amount');
        if (a > g.balance) return store.say('Not enough balance');
        gate(store, 'gift.redeem', 'Redeem a gift card', () => adjust(-a, 'Redeemed · POS', `${M(a)} redeemed`));
      },
      topup: () => {
        const a = +o.giftAmt;
        if (!(a > 0)) return store.say('Enter an amount');
        gate(store, 'gift', 'Top up a gift card', () => adjust(a, 'Top up · POS', `${M(a)} added`));
      },
      history: g.history
        .slice()
        .reverse()
        .map((h, i) => ({
          id: i,
          d: h.d,
          what: h.what,
          amtS: (h.amt < 0 ? '−' : '+') + M(Math.abs(h.amt)),
          fg: h.amt < 0 ? '#9A4436' : '#3E6B47',
        })),
    };
  }
  const month = new Date().toLocaleDateString('en-AU', { month: 'short' });
  return {
    giftKpis: [
      { label: 'Active cards', value: s.giftcards.filter((x) => x.balance > 0).length, delta: `${s.giftcards.length} issued in total` },
      {
        label: 'Sold this month',
        value: M0(s.giftcards.filter((x) => x.issuedOn.includes(month)).reduce((n, x) => n + x.issued, 0)),
        delta: 'in store + Square eGift online',
      },
    ],
    giftRows: s.giftcards.map((x) => ({
      code: x.code,
      last4: x.code.slice(-4),
      holder: x.customerId ? custById[x.customerId]?.name || '' : 'Unassigned · online sale',
      issuedOn: x.issuedOn,
      issuedS: M(x.issued),
      balanceS: M(x.balance),
      balFg: x.balance > 0 ? '#2C1A12' : '#9A8B80',
      bg: o.selGift === x.code ? '#F7F2EA' : 'transparent',
      pick: () => store.setOps({ selGift: x.code, giftAmt: '' }),
    })),
    detailCol: g ? '340px' : '0px',
    gd,
  };
}

export type CustomersView = ReturnType<typeof buildCustomers>;
export type LoyaltyView = ReturnType<typeof buildLoyalty>;
export type GiftView = ReturnType<typeof buildGift>;
