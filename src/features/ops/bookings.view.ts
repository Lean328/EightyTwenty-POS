// Reservations and catering — both arrive from the POS, the website and the app as the same records.
import { addDays, dayName, hoursFor, iso, niceDate, slots as bookingSlots } from '../../domain/hours';
import { SLOT_CAPACITY, SOURCE_LABEL } from '../../domain/policies';
import { packagePriceLabel } from '../../domain/pricing';
import type { CateringEnquiry, CateringStatus, Reservation, ReservationStatus } from '../../domain/types';
import type { PosStore } from '../../state/store';
import { fmtT, gate, M, M0, scope, statusStyle } from './common';
import { openCatForm, openResForm } from './forms.view';

function setReservationStatus(store: PosStore, r: Reservation, status: ReservationStatus): void {
  gate(store, 'reservations', `Mark ${r.name} ${status}`, () => applyReservationStatus(store, r, status));
}

function applyReservationStatus(store: PosStore, r: Reservation, status: ReservationStatus): void {
  const updated = { ...r, status };
  store.setState((st) => ({ reservations: st.reservations.map((x) => (x.id === r.id ? updated : x)) }));
  store.send({ type: 'reservation.upsert', reservation: updated });
  store.say(`${r.name} · ${status}`);
}

export function buildReservations(store: PosStore) {
  const s = store.state,
    o = s.ops,
    { inScope, cafeName, focusCafe } = scope(store);
  const base = new Date(),
    dayDate = addDays(base, o.resDay),
    dayISO = iso(dayDate);
  const loc = store.location(focusCafe);
  const resDays = Array.from({ length: 10 }, (_, i) => {
    const d = addDays(base, i - 2),
      isoD = iso(d);
    const n = s.reservations.filter((r) => r.date === isoD && inScope(r.cafe) && r.status !== 'cancelled');
    const on = i - 2 === o.resDay;
    const hrs = hoursFor(loc, d.getDay());
    return {
      id: isoD,
      dow: i - 2 === 0 ? 'Today' : dayName(d.getDay()),
      day: d.getDate(),
      meta: !hrs ? 'Closed' : n.length ? `${n.length} · ${n.reduce((a, r) => a + r.guests, 0)} covers` : 'Open',
      on,
      ...(on ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: '#FFFCF7', fg: '#2C1A12', border: 'rgba(44,26,18,.08)' }),
      pick: () => store.setOps({ resDay: i - 2 }),
    };
  });
  const hrs = hoursFor(loc, dayDate.getDay());
  const rows = s.reservations.filter((r) => r.date === dayISO && inScope(r.cafe)).sort((a, b) => a.time.localeCompare(b.time));
  const resRows = rows.map((r) => {
    const [bg, fg] = statusStyle(r.status);
    const btn = (label: string, go: () => void, danger?: boolean) => ({
      label,
      go,
      ...(danger
        ? { border: 'rgba(154,68,54,.4)', bg: 'transparent', fg: '#9A4436' }
        : { border: 'rgba(44,26,18,.14)', bg: 'transparent', fg: '#2C1A12' }),
    });
    const acts = [];
    if (r.status === 'pending')
      acts.push({
        label: 'Confirm',
        go: () => setReservationStatus(store, r, 'confirmed'),
        border: '#2C1A12',
        bg: '#2C1A12',
        fg: '#F5EDE2',
      });
    if (r.status === 'confirmed') acts.push(btn('Seated · done', () => setReservationStatus(store, r, 'completed')));
    if (['pending', 'confirmed'].includes(r.status)) {
      acts.push(btn('Edit', () => gate(store, 'reservations', 'Edit a reservation', () => openResForm(store, r))));
      acts.push(btn('Cancel', () => setReservationStatus(store, r, 'cancelled'), true));
    }
    if (r.status === 'cancelled') acts.push(btn('Restore', () => setReservationStatus(store, r, 'pending')));
    return {
      id: r.id,
      time: fmtT(r.time),
      name: r.name,
      status: r.status,
      bg,
      fg,
      meta:
        `${r.guests} guests · ${cafeName(r.cafe)}${r.table ? ' · ' + r.table : ''} · ${r.phone}${r.notes ? ' · ' + r.notes : ''}` +
        (r.source && r.source !== 'pos' ? ' · via ' + SOURCE_LABEL[r.source] + (r.seating ? ' · ' + r.seating : '') : ''),
      actions: acts,
    };
  });
  const taken: Record<string, number> = {};
  rows.forEach((r) => {
    if (r.status !== 'cancelled') taken[r.time] = (taken[r.time] || 0) + r.guests;
  });
  const slots = bookingSlots(loc, dayDate, taken, SLOT_CAPACITY, new Date(0));
  return {
    resDays,
    resClosed: hrs
      ? ''
      : `${loc?.name} is closed on ${dayName(dayDate.getDay())}s — bookings for this day are blocked in the app and on the website.`,
    resRows,
    noResRows: !rows.length,
    resSlots: slots.map((sl) => ({
      id: sl.time,
      label: sl.label,
      title: sl.booked ? `${sl.booked} covers booked · ${sl.left} left` : 'Available',
      bg: sl.booked >= SLOT_CAPACITY ? '#FBE9E4' : sl.booked ? '#E9C89E' : '#F7F2EA',
      fg: sl.booked >= SLOT_CAPACITY ? '#8A2E1C' : '#2C1A12',
      deco: sl.booked >= SLOT_CAPACITY ? 'line-through' : 'none',
    })),
    resNoSlots: !slots.length,
    resCafeName: loc?.name || '',
    resHours: loc?.hours || '',
  };
}

function setCateringStatus(store: PosStore, c: CateringEnquiry, status: CateringStatus, msg: string): void {
  const updated = { ...c, status };
  store.setState((st) => ({ catering: st.catering.map((x) => (x.id === c.id ? updated : x)) }));
  store.send({ type: 'catering.upsert', enquiry: updated });
  store.say(msg);
}

export function buildCatering(store: PosStore) {
  const s = store.state,
    o = s.ops,
    { cafeName } = scope(store);
  const packages = s.catalog.cateringPackages;
  const order: CateringStatus[] = ['enquiry', 'quoted', 'confirmed', 'delivered', 'cancelled'];
  const catRows = s.catering
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => {
      const [stBg, stFg] = statusStyle(c.status);
      const on = o.selCat === c.id;
      return {
        id: c.id,
        date: niceDate(c.date),
        time: fmtT(c.time),
        name: c.name,
        meta:
          `${c.packageId} · ${c.guests} guests · ${c.fulfil === 'delivery' ? 'Delivery' : 'Pickup ' + cafeName(c.cafe)}${c.dietary.length ? ' · ' + c.dietary.join(', ') : ''}` +
          (c.source && c.source !== 'pos' ? ' · via ' + SOURCE_LABEL[c.source] : ''),
        quoteS: M0(c.quote),
        status: c.status,
        stBg,
        stFg,
        bg: on ? '#F7F2EA' : '#FFFCF7',
        border: on ? '#B67A4B' : 'rgba(44,26,18,.06)',
        pick: () => store.setOps({ selCat: c.id }),
      };
    });
  const c = s.catering.find((x) => x.id === o.selCat);
  let cd = null;
  if (c) {
    const idx = order.indexOf(c.status);
    const next = (
      { enquiry: ['quoted', 'Send quote'], quoted: ['confirmed', 'Mark confirmed'], confirmed: ['delivered', 'Mark delivered'] } as Record<
        string,
        [CateringStatus, string]
      >
    )[c.status];
    const pk = packages.find((p) => p.id === c.packageId);
    const priceS = pk ? packagePriceLabel(pk.pricePerPerson) : '';
    cd = {
      name: c.name,
      rows: [
        { k: 'Package', v: `${c.packageId} · ${priceS} ${pk?.unit || ''}` },
        { k: 'Guests', v: c.guests },
        { k: 'When', v: `${niceDate(c.date)} · ${fmtT(c.time)}` },
        { k: 'Fulfilment', v: c.fulfil === 'delivery' ? `Delivery · ${c.address}` : `Pickup · ${cafeName(c.cafe)}` },
        { k: 'Contact', v: c.contact },
        { k: 'Dietary', v: c.dietary.join(', ') || '—' },
        { k: 'Notes', v: c.notes || '—' },
        {
          k: 'Source',
          v: (c.source ? SOURCE_LABEL[c.source] : 'POS') + (c.extRef ? ' · ref ' + c.extRef : '') + (c.occasion ? ' · ' + c.occasion : ''),
        },
      ],
      quoteS: M(c.quote),
      quoteNote: `${c.guests} × ${priceS}${c.fulfil === 'delivery' ? ' + 10% delivery' : ''} · GST incl. · estimate until confirmed`,
      steps: order
        .slice(0, 4)
        .map((st, i) => ({ label: st, bg: c.status === 'cancelled' ? '#FBE9E4' : i <= idx ? '#B67A4B' : 'rgba(44,26,18,.1)' })),
      nextLabel: next ? next[1] : '',
      advance: () => {
        if (next) setCateringStatus(store, c, next[0], `${c.name} · ${next[0]}`);
      },
      edit: () => openCatForm(store, c),
      canCancel: !['delivered', 'cancelled'].includes(c.status),
      cancel: () => setCateringStatus(store, c, 'cancelled', 'Enquiry cancelled'),
      close: () => store.setOps({ selCat: null }),
    };
  }
  return {
    packages: packages.map((p) => ({ id: p.id, price: packagePriceLabel(p.pricePerPerson), unit: p.unit, blurb: p.blurb })),
    catRows,
    detailCol: c ? '340px' : '0px',
    cd,
  };
}

export type ReservationsView = ReturnType<typeof buildReservations>;
export type CateringView = ReturnType<typeof buildCatering>;
