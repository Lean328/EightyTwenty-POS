// Drawer forms: reservation, catering enquiry, sell gift card, add team member.
import type { ChangeEvent } from 'react';
import { addDays, dayName, hoursFor, iso, slots as bookingSlots } from '../../domain/hours';
import { SLOT_CAPACITY } from '../../domain/policies';
import { cateringQuote, packagePriceLabel } from '../../domain/pricing';
import type { CateringEnquiry, Reservation, RoleId } from '../../domain/types';
import { initialsOf, uid } from '../../lib/ids';
import { ApiError } from '../../services/http/httpClient';
import type { PosStore } from '../../state/store';
import type { FormValues, OpsForm } from '../../state/types';
import { M, scope, sel } from './common';

type Input = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export interface FormChip {
  id: string;
  label: string;
  on: boolean;
  bg: string;
  fg: string;
  border: string;
  pick: () => void;
}

export interface FormSlot extends Omit<FormChip, 'id'> {
  id: string;
  disabled: boolean;
  title: string;
  deco: string;
}

export interface FormField {
  id: string;
  label: string;
  isText?: boolean;
  isArea?: boolean;
  isChips?: boolean;
  isSlots?: boolean;
  isInfo?: boolean;
  type?: string;
  value?: string | number;
  placeholder?: string;
  req?: boolean;
  min?: number;
  set?: (e: Input) => void;
  chips?: FormChip[];
  closed?: string;
  slots?: FormSlot[];
  sub?: string;
}

const str = (v: FormValues[string]): string => (v == null ? '' : Array.isArray(v) ? v.join(', ') : String(v));

export function openResForm(store: PosStore, existing?: Reservation): void {
  const o = store.state.ops;
  const def = existing || {
    cafe: scope(store).focusCafe,
    date: iso(addDays(new Date(), Math.max(0, o.resDay))),
    time: '',
    guests: 2,
    name: '',
    phone: '',
    notes: '',
    status: 'confirmed',
  };
  store.setOps({ form: { kind: 'res', id: existing ? existing.id : null, v: { ...(def as unknown as FormValues) } } });
}

export function openCatForm(store: PosStore, existing?: CateringEnquiry): void {
  const def = existing || {
    packageId: 'Lunch',
    guests: 20,
    date: iso(addDays(new Date(), 7)),
    time: '12:00',
    fulfil: 'delivery',
    address: '',
    cafe: scope(store).focusCafe,
    name: '',
    contact: '',
    dietary: [] as string[],
    notes: '',
    status: 'enquiry',
  };
  store.setOps({
    form: {
      kind: 'cat',
      id: existing ? existing.id : null,
      v: { ...(def as unknown as FormValues), dietaryText: (def.dietary || []).join(', ') },
    },
  });
}

export function buildFormView(store: PosStore, f: OpsForm) {
  const s = store.state,
    v = f.v;
  const setForm = (patch: Partial<OpsForm>) => store.setOps((o) => ({ form: o.form ? { ...o.form, ...patch } : null }));
  const formSet = (patch: FormValues) =>
    store.setOps((o) => ({ form: o.form ? { ...o.form, v: { ...o.form.v, ...patch }, err: '' } : null }));
  const fail = (err: string) => setForm({ err });
  const T = (label: string, key: string, o: { type?: string; placeholder?: string; req?: boolean; min?: number } = {}): FormField => ({
    id: key,
    isText: true,
    label,
    type: o.type || 'text',
    value: v[key] == null ? '' : (v[key] as string | number),
    placeholder: o.placeholder || '',
    req: !!o.req,
    min: o.min,
    set: (e) => formSet({ [key]: o.type === 'number' ? +e.target.value : e.target.value }),
  });
  const A = (label: string, key: string, placeholder: string): FormField => ({
    id: key,
    isArea: true,
    label,
    value: str(v[key]),
    placeholder,
    set: (e) => formSet({ [key]: e.target.value }),
  });
  const Chips = (label: string, key: string, opts: [string, string][]): FormField => ({
    id: key,
    isChips: true,
    label,
    chips: opts.map(([val, lab]) => ({
      id: val,
      label: lab,
      on: v[key] === val,
      ...sel(v[key] === val),
      pick: () => formSet({ [key]: val }),
    })),
  });
  const cafeOpts: [string, string][] = s.catalog.locations.filter((l) => !l.tbc).map((l) => [l.id, l.name]);
  const close = () => store.setOps({ form: null });
  const base = { close, err: f.err || '', busy: !!f.busy };

  if (f.kind === 'res') {
    const loc = store.location(str(v.cafe));
    const date = new Date(str(v.date) + 'T00:00');
    const hrs = hoursFor(loc, date.getDay());
    const taken: Record<string, number> = {};
    s.reservations.forEach((r) => {
      if (r.cafe === v.cafe && r.date === v.date && r.status !== 'cancelled' && r.id !== f.id)
        taken[r.time] = (taken[r.time] || 0) + r.guests;
    });
    const slots = bookingSlots(loc, date, taken, SLOT_CAPACITY, new Date(0));
    const closed = isNaN(+date)
      ? 'Pick a date.'
      : !hrs
        ? `${loc?.name} is closed on ${dayName(date.getDay())}s. Choose another day — guests see the same block in the app and on the website.`
        : '';
    return {
      ...base,
      title: f.id ? 'Edit reservation' : 'New reservation',
      sub: 'Guests see unavailable and closed times greyed out in the app and website.',
      cta: f.id ? 'Save changes' : 'Create reservation',
      fields: [
        Chips('Café', 'cafe', cafeOpts),
        T('Date', 'date', { type: 'date', req: true }),
        {
          id: 'slots',
          isSlots: true,
          label: 'Time',
          closed,
          slots: slots.map((sl) => {
            const full = sl.booked + (+(v.guests || 0) || 0) > SLOT_CAPACITY;
            const on = v.time === sl.time;
            return {
              id: sl.time,
              label: sl.label,
              on,
              disabled: full,
              title: full ? `Full — ${sl.left} seats left` : sl.booked ? `${sl.left} seats left` : 'Available',
              deco: full ? 'line-through' : 'none',
              ...(on
                ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' }
                : full
                  ? { bg: '#FBE9E4', fg: '#8A2E1C', border: 'transparent' }
                  : { bg: '#F7F2EA', fg: '#2C1A12', border: 'rgba(44,26,18,.1)' }),
              pick: () => formSet({ time: sl.time }),
            };
          }),
        } satisfies FormField,
        T('Guests', 'guests', { type: 'number', min: 1, req: true }),
        T('Name', 'name', { req: true, placeholder: 'Guest name' }),
        T('Phone', 'phone', { type: 'tel', placeholder: '04xx xxx xxx' }),
        Chips('Status', 'status', [
          ['pending', 'Pending'],
          ['confirmed', 'Confirmed'],
        ]),
        A('Notes', 'notes', 'Pram, high chair, allergies, occasion…'),
      ],
      submit: () => {
        if (closed) return fail('This café is closed on the selected day.');
        if (!v.time) return fail('Choose a time slot.');
        if (!str(v.name).trim()) return fail('Guest name is required.');
        if (!(+(v.guests || 0) > 0)) return fail('Guest count must be at least 1.');
        const prev = f.id ? s.reservations.find((r) => r.id === f.id) : undefined;
        const rec: Reservation = {
          ...prev,
          id: f.id || uid('r'),
          cafe: str(v.cafe),
          date: str(v.date),
          time: str(v.time),
          guests: +(v.guests || 0),
          name: str(v.name),
          phone: str(v.phone),
          notes: str(v.notes),
          status: str(v.status) as Reservation['status'],
        };
        const dayDiff = Math.round((+new Date(rec.date + 'T00:00') - +new Date(iso(new Date()) + 'T00:00')) / 864e5);
        store.setState((st) => ({
          reservations: f.id ? st.reservations.map((r) => (r.id === f.id ? rec : r)) : [...st.reservations, rec],
        }));
        store.setOps({ form: null, resDay: dayDiff });
        store.send({ type: 'reservation.upsert', reservation: rec });
        store.say(f.id ? 'Reservation updated' : `Reservation created for ${rec.name}`);
      },
    };
  }

  if (f.kind === 'cat') {
    const pk = s.catalog.cateringPackages.find((p) => p.id === v.packageId) || s.catalog.cateringPackages[0];
    const guests = +(v.guests || 0) || 0;
    const quote = cateringQuote(pk.pricePerPerson, guests, v.fulfil === 'delivery');
    const priceS = packagePriceLabel(pk.pricePerPerson);
    return {
      ...base,
      title: f.id ? 'Edit catering enquiry' : 'New catering enquiry',
      sub: 'Quote is an estimate until confirmed. Minimum 10 guests, 48 hours notice.',
      cta: f.id ? 'Save changes' : 'Create enquiry',
      fields: [
        Chips(
          'Package',
          'packageId',
          s.catalog.cateringPackages.map((p) => [p.id, `${p.id} · ${packagePriceLabel(p.pricePerPerson)}`]),
        ),
        T('Guests', 'guests', { type: 'number', min: 10, req: true }),
        T('Date', 'date', { type: 'date', req: true }),
        T('Time', 'time', { type: 'time', req: true }),
        Chips('Fulfilment', 'fulfil', [
          ['delivery', 'Delivery (+10%)'],
          ['pickup', 'Pickup'],
        ]),
        ...(v.fulfil === 'delivery'
          ? [T('Delivery address', 'address', { placeholder: 'Street, suburb', req: true })]
          : [Chips('Pickup café', 'cafe', cafeOpts)]),
        T('Organisation / name', 'name', { req: true }),
        T('Contact', 'contact', { placeholder: 'Name · phone' }),
        T('Dietary requirements', 'dietaryText', { placeholder: 'e.g. 2 coeliac, 3 vegan' }),
        A('Notes', 'notes', ''),
        {
          id: 'quote',
          isInfo: true,
          label: 'Estimated quote',
          value: M(quote),
          sub: `${guests} × ${priceS} ${pk.unit}${v.fulfil === 'delivery' ? ' + 10% delivery' : ''} · GST incl.`,
        },
      ] as FormField[],
      submit: () => {
        if (!(guests >= 10)) return fail('Catering is for 10 guests or more.');
        if (!str(v.name).trim()) return fail('Name is required.');
        if (!v.date || !v.time) return fail('Date and time are required.');
        const prev = f.id ? s.catering.find((c) => c.id === f.id) : undefined;
        const rec: CateringEnquiry = {
          ...prev,
          id: f.id || uid('ce'),
          packageId: pk.id,
          guests,
          date: str(v.date),
          time: str(v.time),
          fulfil: v.fulfil === 'delivery' ? 'delivery' : 'pickup',
          address: str(v.address),
          cafe: str(v.cafe),
          name: str(v.name),
          contact: str(v.contact),
          dietary: str(v.dietaryText)
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          notes: str(v.notes),
          quote,
          status: (str(v.status) || 'enquiry') as CateringEnquiry['status'],
        };
        store.setState((st) => ({ catering: f.id ? st.catering.map((c) => (c.id === f.id ? rec : c)) : [...st.catering, rec] }));
        store.setOps({ form: null, selCat: rec.id });
        store.send({ type: 'catering.upsert', enquiry: rec });
        store.say(f.id ? 'Enquiry updated' : 'Enquiry created');
      },
    };
  }

  if (f.kind === 'gift') {
    const amount = +(v.amount || 0) || 0;
    return {
      ...base,
      title: 'Sell gift card',
      sub: 'Printed card or emailed eGift. Minimum $10, maximum $500.',
      cta: f.busy ? 'Issuing card…' : `Issue card · ${M(amount)}`,
      fields: [
        Chips('Amount', 'amount', [
          ['25', '$25'],
          ['50', '$50'],
          ['75', '$75'],
          ['100', '$100'],
        ]),
        T('Custom amount', 'amount', { type: 'number', min: 10 }),
        Chips('Link to customer (optional)', 'customerId', [
          ['', 'No customer'],
          ...s.customers.map((c): [string, string] => [c.id, c.name]),
        ]),
        A('Message on card', 'note', 'Happy birthday!'),
      ],
      submit: async () => {
        if (f.busy) return;
        if (store.backend.kind === 'http') return fail('Issue and top up gift cards in BOS. To redeem, select a customer and use Gift card in Payment.');
        const a = amount;
        if (!(a >= 10 && a <= 500)) return fail('Amount must be between $10 and $500.');
        setForm({ busy: true, err: '' });
        try {
          const card = await store.backend.giftCards.issue({
            amount: a,
            customerId: str(v.customerId) || null,
            note: str(v.note),
            cafeId: store.state.cafe,
            issuedAt: `${scope(store).scopeName} POS`,
          });
          store.setState((st) => ({ giftcards: [card, ...st.giftcards] }));
          store.setOps({ form: null, selGift: card.code });
          store.send({
            type: 'transaction.record',
            record: {
              kind: 'gift-issue',
              cafeId: store.state.cafe,
              terminalId: store.config.terminalId,
              amountC: Math.round(a * 100),
              gstC: 0,
              at: new Date().toISOString(),
              staff: store.staff().name,
              reference: card.code,
            },
          });
          store.say(`Gift card ···${card.code.slice(-4)} issued · take ${M(a)} on the till`);
        } catch (e) {
          setForm({
            busy: false,
            err:
              e instanceof ApiError && e.kind !== 'unknown'
                ? `Card not issued — ${e.message}`
                : 'Card not issued — could not reach the gift card service.',
          });
        }
      },
    };
  }

  // staff
  return {
    ...base,
    title: 'Add team member',
    sub: 'They sign in to the till with a 4-digit PIN.',
    cta: f.busy ? 'Adding…' : 'Add to team',
    fields: [
      T('Full name', 'name', { req: true }),
      Chips('Role', 'role', [
        ['cashier', 'Cashier'],
        ['manager', 'Manager'],
        ['admin', 'Admin'],
      ]),
      Chips('Home café', 'cafe', cafeOpts),
      T('PIN', 'pin', { placeholder: '4 digits', req: true }),
      T('Usual shift', 'shift', { placeholder: 'e.g. Mon–Fri 7am – 1pm' }),
    ],
    submit: async () => {
      if (f.busy) return;
      const name = str(v.name).trim(),
        pin = str(v.pin),
        role = str(v.role) as RoleId;
      if (!name) return fail('Name is required.');
      if (!/^\d{4}$/.test(pin)) return fail('PIN must be 4 digits.');
      setForm({ busy: true, err: '' });
      try {
        const member = await store.backend.staffAuth.createStaff(
          { name, initials: initialsOf(name), role, cafe: str(v.cafe), shift: str(v.shift) },
          pin,
        );
        store.setState((st) => ({ staff: [...st.staff, member] }));
        store.setOps({ form: null });
        store.logAudit('Staff added', `${member.name} · ${store.roles()[role].label}`, { area: 'Access' });
        store.say(`${member.name} added as ${store.roles()[role].label}`);
      } catch (e) {
        setForm({
          busy: false,
          err:
            e instanceof ApiError && (e.kind === 'conflict' || e.kind === 'validation')
              ? e.message
              : 'Could not add the team member — check the connection and try again.',
        });
      }
    },
  };
}

export type FormView = ReturnType<typeof buildFormView>;
