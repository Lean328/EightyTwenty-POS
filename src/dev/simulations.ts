// DEVELOPMENT-ONLY simulations of the website and mobile app sending work to the POS.
// No website or app is connected. These exist so staff flows (accepting online orders, confirming booking
// requests, duplicate and failed-payment handling) can be exercised before the shared backend exists.
// Every call is a no-op unless dev tools are enabled (see config/env.ts).
import { cateringQuote } from '../domain/pricing';
import { SOURCE_LABEL } from '../domain/policies';
import { toC } from '../domain/ledger';
import type { CateringEnquiry, MenuItem, ModSelection, Order, Reservation } from '../domain/types';
import { nowHM, stamp, uid } from '../lib/ids';
import type { PosStore } from '../state/store';

const isoIn = (n = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

let lastExtRef = '';

/** Mock inbound order from the website or app. */
export function simulateInbound(store: PosStore, kind: 'web' | 'app' | 'dup' | 'failed'): void {
  if (!store.config.devTools) return;
  const s = store.state;
  if (!s.online) return store.say('Offline — website and app orders will arrive when the connection is back');
  const channel = kind === 'web' || kind === 'failed' ? 'web' : 'app';
  const extRef = kind === 'dup' && lastExtRef ? lastExtRef : uid('EXT', 5);
  const log = (msg: string) =>
    store.setState((st) => ({ syncLog: [{ id: uid('L'), at: stamp(), msg }, ...(st.syncLog || [])].slice(0, 50) }));
  const dup = s.orders.find((o) => o.extRef === extRef);
  if (dup) {
    log(`Duplicate ${channel} order ${extRef} ignored — already ${dup.id}`);
    store.logAudit('Duplicate order blocked', `${extRef} already received as ${dup.id}`, { area: 'Sync' });
    return store.say(`Duplicate ignored · already ${dup.id}`);
  }
  const { menuById, locations } = s.catalog;
  const picks: [string, ModSelection][] =
    channel === 'app'
      ? [
          ['hotcoffee', { drink: ['Flat White'], var: ['OAT ADC'] }],
          ['brekky', {}],
        ]
      : [
          ['acai-o', {}],
          ['coldbrew', {}],
        ];
  const lines = picks
    .filter(([id]) => menuById[id])
    .map(([id, sel], i) => {
      const m: MenuItem = menuById[id];
      let price = m.price;
      for (const g of m.mods) for (const lab of sel[g.id] || []) price += g.options.find((x) => x[0] === lab)?.[1] || 0;
      return {
        key: id + Date.now() + i,
        itemId: id,
        name: m.name,
        qty: 1,
        sel,
        adjust: [],
        note: '',
        price: Math.round(price * 100) / 100,
      };
    });
  const total = Math.round(lines.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100;
  const o: Order = {
    id: store.nextOrderNo(),
    channel,
    type: 'pickup',
    status: 'new',
    accepted: false,
    cafe: s.cafe,
    time: nowHM(),
    placedAt: new Date().toISOString(),
    lines,
    total,
    paid: true,
    methods: ['card'],
    payments: [{ method: 'card', amount: toC(total), tip: 0, surcharge: 0, ref: 'ext-' + extRef }],
    extRef,
    history: [
      {
        at: stamp(),
        what: `Received from ${channel === 'app' ? 'EightyTwenty app' : 'eightytwentyfood.com.au'} · routed to ${locations.find((l) => l.id === s.cafe)?.name} (simulated)`,
      },
    ],
  };
  if (kind === 'failed')
    Object.assign(o, {
      status: 'failed',
      paid: false,
      payments: [],
      methods: [],
      history: [...o.history!, { at: stamp(), what: 'Payment not captured by website — do not prepare' }],
    });
  lastExtRef = extRef;
  store.setState((st) => ({ orders: [o, ...st.orders] }));
  log(`${o.id} received from ${channel === 'app' ? 'app' : 'website'}${kind === 'failed' ? ' · payment failed' : ''} (simulated)`);
  store.say(`${kind === 'failed' ? 'Failed' : 'New'} ${channel === 'app' ? 'app' : 'website'} order ${o.id}`);
}

// ---------- reservations & catering intake ----------
// Payload shapes follow each source: website bkSubmit() / submitEnquiry('catering'); app ReservationRequest /
// CateringEnquiryRequest. Both sources only prepare an email today, so these adapters show where a backend
// would normalise submissions into the same POS records.

function sampleReservation(platform: 'web' | 'app') {
  return platform === 'app'
    ? {
        extRef: uid('APPR-', 5),
        cafe: 'phillip',
        guests: 3,
        date: isoIn(0),
        time: '13:30',
        seating: 'Outdoor',
        name: 'Sophie Nguyen',
        phone: '0400 123 456',
        email: 'sophie@example.com',
        notes: 'High chair please',
      }
    : {
        extRef: uid('WEBR-', 5),
        cafe: 'phillip',
        guests: 6,
        date: isoIn(0),
        time: '12:00',
        seating: 'Indoor',
        name: 'Daniel Okafor',
        phone: '0412 555 019',
        email: 'daniel@example.com',
        notes: 'Birthday brunch',
      };
}

function sampleCatering(platform: 'web' | 'app') {
  return platform === 'app'
    ? {
        extRef: uid('APPC-', 5),
        packageId: 'Breakfast',
        guests: 20,
        date: isoIn(6),
        time: '08:30',
        name: 'Sophie Nguyen',
        email: 'sophie@example.com',
        phone: '0400 123 456',
        company: 'Nguyen & Co',
        occasion: 'Team breakfast',
        location: '18 Marcus Clarke St, Canberra',
        dietary: ['Vegan'],
        notes: 'Two vegan guests',
      }
    : {
        extRef: uid('WEBC-', 5),
        packageId: 'Lunch',
        guests: 30,
        date: isoIn(9),
        time: '12:00',
        name: 'Priya Shah',
        email: 'priya@example.com',
        phone: '0433 210 887',
        company: 'Canberra Arts Hub',
        occasion: '',
        location: '',
        dietary: ['Gluten free'],
        notes: 'Pickup from Phillip',
      };
}

/** Simulate a booking request or catering enquiry arriving from the website or app. */
export function simulateIntake(store: PosStore, kind: 'res' | 'cat', platform: 'web' | 'app'): void {
  if (!store.config.devTools) return;
  const s = store.state,
    lbl = SOURCE_LABEL[platform];
  if (kind === 'res') {
    const p = sampleReservation(platform);
    if (s.reservations.some((r) => r.extRef === p.extRef)) return store.say('Already received');
    const r: Reservation = {
      id: uid('r'),
      cafe: p.cafe,
      date: p.date,
      time: p.time,
      guests: p.guests,
      name: p.name,
      phone: p.phone,
      email: p.email,
      seating: p.seating,
      notes: p.notes,
      status: 'pending',
      source: platform,
      extRef: p.extRef,
      history: [{ at: new Date().toISOString(), what: 'Request received from ' + lbl + ' · waiting for staff to confirm' }],
    };
    store.setState((st) => ({ reservations: [r, ...st.reservations] }));
    store.logAudit('Booking request received', lbl + ' · ' + r.name + ' · ' + r.guests + ' guests (simulated)', { area: 'Reservations' });
    return store.say(lbl + ' booking request from ' + r.name + ' · pending');
  }
  const p = sampleCatering(platform);
  const pk = s.catalog.cateringPackages.find((x) => x.id === p.packageId);
  if (!pk) return;
  if (s.catering.some((c) => c.extRef === p.extRef)) return store.say('Already received');
  const delivery = !!p.location;
  const c: CateringEnquiry = {
    id: uid('ce'),
    packageId: p.packageId,
    guests: p.guests,
    date: p.date,
    time: p.time,
    fulfil: delivery ? 'delivery' : 'pickup',
    address: p.location,
    cafe: 'phillip',
    name: p.company || p.name,
    contact: p.name + ' · ' + p.phone + ' · ' + p.email,
    email: p.email,
    phone: p.phone,
    occasion: p.occasion,
    dietary: p.dietary,
    notes: p.notes,
    quote: cateringQuote(pk.pricePerPerson, p.guests, delivery),
    status: 'enquiry',
    source: platform,
    extRef: p.extRef,
  };
  store.setState((st) => ({ catering: [c, ...st.catering] }));
  store.setOps({ selCat: c.id });
  store.logAudit('Catering enquiry received', lbl + ' · ' + c.name + ' (simulated)', { area: 'Catering' });
  store.say(lbl + ' catering enquiry from ' + c.name + ' · no order or payment created');
}
