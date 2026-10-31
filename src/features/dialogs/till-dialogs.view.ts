// View-models for the till's smaller dialogs: item, customer, discounts, PIN, pickers, note, staff.
import type { ChangeEvent } from 'react';
import { fmtHM, iso } from '../../domain/hours';
import { rewardValue } from '../../domain/loyalty';
import { DIETARY_ADJUST } from '../../domain/policies';
import { missingRequired, money as M, unitPrice } from '../../domain/pricing';
import type { Discount } from '../../domain/types';
import { uid } from '../../lib/ids';
import { closeDialog, pinKey } from '../../state/actions/auth';
import { effective, photo, unavailableMods } from '../../state/actions/catalog';
import { cartTotals } from '../../state/actions/payments';
import { occupancy } from '../../state/actions/tables';
import type { PosStore } from '../../state/store';
import type { Dialog, DialogOf } from '../../state/types';

const pill = (on: boolean) =>
  on ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: '#FFFCF7', fg: '#3A2B24', border: 'rgba(44,26,18,.14)' };
const pickStyle = (on: boolean) =>
  on ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: '#F7F2EA', fg: '#2C1A12', border: 'rgba(44,26,18,.1)' };

/** Merge a patch into the open dialog if it is still the same kind. */
export function dlgSet<K extends Dialog['kind']>(store: PosStore, kind: K, patch: Partial<DialogOf<K>>): void {
  const cur = store.state.dlg;
  if (cur && cur.kind === kind) store.setState({ dlg: { ...cur, ...patch } as Dialog });
}

export function buildItemDialog(store: PosStore, d: DialogOf<'item'>) {
  const s = store.state,
    { menuById, categories } = s.catalog;
  const unav = unavailableMods(store);
  const item = effective(store, menuById[d.itemId]);
  const missing = missingRequired(item, d.sel),
    unit = unitPrice(item, d.sel);
  const set = (p: Partial<typeof d>) => dlgSet(store, 'item', p);
  return {
    close: () => closeDialog(store),
    name: item.name,
    desc: item.desc || (categories.find((c) => c.id === item.cat) || { name: '' }).name,
    priceS: M(item.price),
    ...photo(item),
    qty: d.qty,
    note: d.note,
    isEdit: !!d.editKey,
    disabled: missing.length > 0,
    btnBg: missing.length ? '#9A8B80' : '#2C1A12',
    btn: missing.length
      ? /^choose/i.test(missing[0])
        ? missing[0]
        : `Choose ${missing[0].toLowerCase()}`
      : d.editKey
        ? 'Update item'
        : 'Add to order',
    totalS: M(unit * d.qty),
    groups: item.mods.map((g) => {
      const chosen = d.sel[g.id] || [];
      return {
        id: g.id,
        name: g.name,
        hint: g.required
          ? chosen.length
            ? 'Required'
            : 'Required — choose one'
          : g.max === 1
            ? 'Optional · choose one'
            : 'Optional · choose any',
        hintFg: g.required && !chosen.length ? '#9A4436' : '#9A8B80',
        options: g.options.map(([label, price]) => ({
          label,
          disabled: unav.has(label),
          op: unav.has(label) ? 0.4 : 1,
          priceS: unav.has(label) ? 'unavailable' : price ? '+' + M(price) : '',
          on: chosen.includes(label),
          ...pill(chosen.includes(label)),
          pick: () => {
            if (unav.has(label)) return;
            const cur = d.sel[g.id] || [];
            const next = cur.includes(label) ? cur.filter((x) => x !== label) : g.max === 1 ? [label] : [...cur, label];
            set({ sel: { ...d.sel, [g.id]: next } });
          },
        })),
      };
    }),
    adjust: DIETARY_ADJUST.map((a) => ({
      label: a,
      on: d.adjust.includes(a),
      ...pill(d.adjust.includes(a)),
      pick: () => set({ adjust: d.adjust.includes(a) ? d.adjust.filter((x) => x !== a) : [...d.adjust, a] }),
    })),
    setNote: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => set({ note: e.target.value }),
    inc: () => set({ qty: d.qty + 1 }),
    dec: () => set({ qty: Math.max(1, d.qty - 1) }),
    remove: () => store.setState((st) => ({ lines: st.lines.filter((l) => l.key !== d.editKey), dlg: null })),
    add: () => {
      if (missing.length) return;
      const line = {
        key: d.editKey || uid('L'),
        itemId: item.id,
        name: item.name,
        price: unit,
        qty: d.qty,
        sel: d.sel,
        adjust: d.adjust,
        note: d.note,
      };
      store.setState((st) => ({
        lines: d.editKey ? st.lines.map((l) => (l.key === d.editKey ? line : l)) : [...st.lines, line],
        dlg: null,
      }));
      store.say(`${d.editKey ? 'Updated' : 'Added'} ${item.name}`);
    },
  };
}

export function buildCustomerDialog(store: PosStore, d: DialogOf<'customer'>) {
  const s = store.state,
    cq = (d.q || '').toLowerCase(),
    per = s.loy.per;
  return {
    close: () => closeDialog(store),
    hasCustomer: !!s.customers.find((c) => c.id === s.customerId),
    detachCustomer: () => store.setState({ customerId: null, dlg: null }),
    q: d.q || '',
    setQ: (e: ChangeEvent<HTMLInputElement>) => dlgSet(store, 'customer', { q: e.target.value }),
    walkin: () => store.setState({ customerId: null, dlg: null }),
    rows: s.customers
      .filter((c) => !cq || (c.name + c.phone + c.email).toLowerCase().includes(cq))
      .map((c) => ({
        id: c.id,
        name: c.name,
        initials: c.name
          .split(' ')
          .map((x) => x[0])
          .join(''),
        meta: `${c.phone} · ${c.stamps}/${per} stamps${c.rewards ? ' · ' + c.rewards + ' free coffee' : ''}${c.dietary.length ? ' · ' + c.dietary.join(', ') : ''}`,
        stampsLabel: `${c.stamps} of ${per} stamps`,
        dots: Array.from({ length: per }, (_, i) => (i < c.stamps ? '#B67A4B' : 'rgba(44,26,18,.12)')),
        pick: () => {
          store.setState({ customerId: c.id, dlg: null });
          store.say(`${c.name} attached${c.rewards ? ' · free coffee available' : ''}`);
        },
      })),
  };
}

export function buildDiscountDialog(store: PosStore, d: DialogOf<'discount'>) {
  const s = store.state,
    per = s.loy.per;
  const tab = d.tab || 'discount';
  const rv = rewardValue(s.lines, s.catalog.menuById);
  const customer = s.customers.find((c) => c.id === s.customerId);
  const set = (p: Partial<typeof d>) => dlgSet(store, 'discount', p);
  const apply = (discount: Discount, msg: string) => {
    store.setState({ discount, dlg: null });
    store.say(msg);
  };
  const tabs: [typeof tab, string][] = [
    ['discount', 'Discount'],
    ['promo', 'Promo'],
    ['gift', 'Gift card'],
    ['reward', 'Reward'],
  ];
  const presets: [number, string][] = [
    [10, '10% off'],
    [15, '15% off'],
    [30, 'Staff 30%'],
    [50, 'Manager 50%'],
    [100, 'Comp 100%'],
  ];
  const left = customer ? per - customer.stamps : 0;
  return {
    close: () => closeDialog(store),
    isDiscount: tab === 'discount',
    isPromo: tab === 'promo',
    isGift: tab === 'gift',
    liveGift: store.backend.kind === 'http',
    giftCustomerLabel: customer ? `Gift card for ${customer.name}` : 'Select a customer on the cart first.',
    giftCanPay: !!customer && !!s.lines.length && s.online && !!store.backend.giftCards.getBalance && (store.can('gift.redeem') || store.can('gift')),
    openGiftPayment: () => {
      if (!customer || !s.lines.length || !s.online || !store.backend.giftCards.getBalance || !(store.can('gift.redeem') || store.can('gift'))) {
        return set({ msg: 'Select a customer, add items and connect to the server before paying by gift card.', ok: false });
      }
      store.setState({ gift: null, dlg: { kind: 'pay', method: 'gift', mode: 'full', key: uid('P') } });
    },
    isReward: tab === 'reward',
    code: d.code || '',
    custom: d.custom || '',
    msg: d.msg || '',
    msgFg: d.ok ? '#3E6B47' : '#9A4436',
    hasAny: !!(s.discount || s.gift),
    tabs: tabs.map(([id, name]) => ({
      id,
      name,
      on: tab === id,
      bg: tab === id ? '#FFFCF7' : 'transparent',
      fg: tab === id ? '#2C1A12' : '#8C7A6E',
      pick: () => set({ tab: id, msg: '' }),
    })),
    presets: presets.map(([v, label]) => ({
      label,
      pick: () => {
        if (v >= 50)
          return store.approve('orders.refund', 'Manager approval', `${label} discount`, (ap) =>
            apply({ kind: 'pct', value: v, label: label + (ap ? ' · ' + ap.name.split(' ')[0] : '') }, `${label} applied`),
          );
        apply({ kind: 'pct', value: v, label }, `${label} applied`);
      },
    })),
    setCustom: (e: ChangeEvent<HTMLInputElement>) => set({ custom: e.target.value }),
    applyCustom: () => {
      const v = +(d.custom || 0);
      if (v > 0) apply({ kind: 'amt', value: v, label: `${M(v)} off` }, `${M(v)} discount applied`);
    },
    setCode: (e: ChangeEvent<HTMLInputElement>) => set({ code: e.target.value }),
    applyPromo: () => {
      const p = s.catalog.promotions.find((x) => x.code === (d.code || '').trim().toUpperCase());
      if (!p) return set({ msg: 'Code not recognised', ok: false });
      apply({ kind: p.kind, value: p.value, label: p.label }, `${p.label} applied`);
    },
    applyGift: () => {
      const code = (d.code || '').replace(/\s/g, '');
      if (store.backend.kind === 'http') return set({ msg: 'Use Gift card in the payment screen after selecting a customer.', ok: false });
      const g = s.giftcards.find((x) => x.code.replace(/\s/g, '').endsWith(code) && code.length >= 4);
      if (!g) return set({ msg: 'Gift card not found', ok: false });
      if (g.balance <= 0) return set({ msg: 'This gift card has no balance left', ok: false });
      const amount = Math.min(g.balance, cartTotals(store).total);
      store.setState({ gift: { last4: g.code.slice(-4), amount }, dlg: null });
      store.say(`Gift card ···${g.code.slice(-4)} · ${M(amount)} applied · ${M(g.balance - amount)} left`);
    },
    rewardTitle: !customer
      ? 'Attach a customer first'
      : customer.rewards
        ? `${customer.name} has ${customer.rewards} free coffee`
        : `${customer.name} · ${customer.stamps}/${per} stamps`,
    rewardBody: !customer
      ? 'Scan the loyalty card or search the customer to redeem their reward.'
      : rv
        ? `Redeems the cheapest coffee on the order (${M(rv)}).`
        : customer.rewards
          ? 'Add a coffee or hot drink to the order to redeem.'
          : `${left} more stamp${left > 1 ? 's' : ''} until the next free coffee.`,
    dots: Array.from({ length: per }, (_, i) => (customer && i < customer.stamps ? '#B67A4B' : 'rgba(44,26,18,.12)')),
    rewardDisabled: !(customer && customer.rewards && rv),
    rewardBtnBg: customer && customer.rewards && rv ? '#B67A4B' : '#9A8B80',
    applyReward: () => apply({ kind: 'reward', value: rv, label: 'Free coffee · loyalty' }, 'Free coffee redeemed'),
    clearAll: () => {
      store.setState({ discount: null, gift: null, dlg: null });
      store.say('Discounts removed');
    },
  };
}

export function buildPinDialog(store: PosStore, d: DialogOf<'pin'>) {
  const pin = d.pin || '';
  return {
    title: d.title,
    body: d.body,
    err: d.err || '',
    /** Sign-in hint from the development backend only. */
    hint: store.config.devTools ? store.backend.pinHint || '' : '',
    dots: [0, 1, 2, 3].map((i) => (i < pin.length ? '#2C1A12' : 'rgba(44,26,18,.15)')),
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => ({
      label: k,
      bg: /\d/.test(k) ? '#F7F2EA' : 'transparent',
      pick: () => void pinKey(store, k),
    })),
  };
}

export function buildPickDialog(store: PosStore, d: DialogOf<'cafe'> | DialogOf<'tablePick'>) {
  const s = store.state;
  if (d.kind === 'cafe')
    return {
      close: () => closeDialog(store),
      title: 'Switch café',
      rows: s.catalog.locations
        .filter((l) => !l.tbc)
        .map((l) => ({
          id: l.id,
          label: l.name,
          sub: `${l.hoursShort}${l.gf ? ' · GF' : ''}`,
          on: l.id === s.cafe,
          ...pickStyle(l.id === s.cafe),
          pick: () => {
            store.setState({ cafe: l.id, selOrder: null, dlg: null });
            store.say(`Now serving ${l.name}`);
          },
        })),
    };
  const openTables = occupancy(store);
  const todayISO = iso(new Date());
  const resByTable: Record<string, { time: string }> = {};
  s.reservations
    .filter((r) => r.cafe === s.cafe && r.date === todayISO && !['cancelled', 'completed'].includes(r.status))
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach((r) => {
      if (r.table) resByTable[r.table] = r;
    });
  return {
    close: () => closeDialog(store),
    title: 'Choose table',
    rows: [
      {
        id: '',
        label: 'No table',
        sub: 'counter service',
        on: !s.table,
        ...pickStyle(!s.table),
        pick: () => store.setState({ table: '', dlg: null }),
      },
      ...s.catalog.tables.map((tb) => {
        const o = openTables[tb.id],
          r = resByTable[tb.id];
        return {
          id: tb.id,
          label: `${tb.id} · ${tb.seats} seats`,
          sub: o ? 'open tab' : r ? `reserved ${fmtHM(r.time)}` : tb.zone,
          on: s.table === tb.id,
          ...pickStyle(s.table === tb.id),
          pick: () => store.setState({ table: tb.id, dlg: null }),
        };
      }),
    ],
  };
}

export function buildNoteDialog(store: PosStore) {
  return {
    close: () => closeDialog(store),
    text: store.state.note,
    set: (e: ChangeEvent<HTMLTextAreaElement>) => store.setState({ note: e.target.value }),
  };
}

export function buildStaffDialog(store: PosStore) {
  const s = store.state;
  return {
    close: () => closeDialog(store),
    cafeName: store.location(s.cafe)?.name || '',
    rows: s.staff
      .filter((x) => x.cafe === s.cafe || x.role === 'admin')
      .map((x) => ({
        id: x.id,
        name: x.name,
        initials: x.initials,
        meta: x.shift,
        role: store.roleLabel(x),
        on: x.id === s.staffId,
        ...(x.id === s.staffId ? { bg: '#F7F2EA', border: '#B67A4B' } : { bg: 'transparent', border: 'rgba(44,26,18,.08)' }),
        pick: () =>
          store.setState({
            dlg: {
              kind: 'pin',
              pin: '',
              expectedStaffId: x.id,
              title: `Switch to ${x.name.split(' ')[0]}`,
              body: 'Enter their 4-digit PIN',
              perm: 'pos',
              next: (st) => {
                store.setState({ staffId: st.id, dlg: null });
                store.say(`Signed in as ${st.name}`);
              },
            },
          }),
      })),
  };
}

export type ItemDialogView = ReturnType<typeof buildItemDialog>;
export type CustomerDialogView = ReturnType<typeof buildCustomerDialog>;
export type DiscountDialogView = ReturnType<typeof buildDiscountDialog>;
export type PinDialogView = ReturnType<typeof buildPinDialog>;
export type PickDialogView = ReturnType<typeof buildPickDialog>;
export type NoteDialogView = ReturnType<typeof buildNoteDialog>;
export type StaffDialogView = ReturnType<typeof buildStaffDialog>;
