// Customer intake adapters (mock). Website and app submissions are normalised into the SAME records POS uses
// (reservations → POS Reservations, catering enquiries → POS Catering, orders → services/operations.js mockInbound).
// Payload shapes follow the sources: website index.html bkSubmit() / submitEnquiry('catering');
// app ReservationRequest / CateringEnquiryRequest (src/types). Neither source submits anywhere today —
// both prepare an email draft — so these adapters are the integration point a backend would call.
export const SOURCE_LABEL = { web: 'Website', app: 'App', pos: 'POS' };
const iso = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const ref = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();

/** Representative submissions, one per platform, in each source's own field names. */
export function sampleReservation(platform) {
  return platform === 'app'
    ? { extRef: ref('APPR-'), locationId: 'phillip', guests: 3, date: iso(0), time: '13:30', seating: 'Outdoor', name: 'Sophie Nguyen', phone: '0400 123 456', email: 'sophie@example.com', notes: 'High chair please' }
    : { extRef: ref('WEBR-'), cafe: 'phillip', guests: 6, date: iso(0), time: '12:00', seating: 'Indoor', name: 'Daniel Okafor', phone: '0412 555 019', email: 'daniel@example.com', notes: 'Birthday brunch' };
}
export function toReservation(platform, p) {
  return { cafe: p.locationId || p.cafe, date: p.date, time: p.time, guests: +p.guests, name: p.name, phone: p.phone, email: p.email, seating: p.seating, notes: p.notes || '',
    status: 'pending', source: platform, extRef: p.extRef, history: [{ at: new Date().toISOString(), what: 'Request received from ' + SOURCE_LABEL[platform] + ' · waiting for staff to confirm' }] };
}
export function sampleCatering(platform) {
  return platform === 'app'
    ? { extRef: ref('APPC-'), packageId: 'Breakfast', guests: 20, date: iso(6), time: '08:30', firstName: 'Sophie', lastName: 'Nguyen', email: 'sophie@example.com', phone: '0400 123 456', company: 'Nguyen & Co', occasion: 'Team breakfast', location: '18 Marcus Clarke St, Canberra', dietary: ['Vegan'], notes: 'Two vegan guests' }
    : { extRef: ref('WEBC-'), package: 'Lunch', guests: 30, date: iso(9), time: '12:00', name: 'Priya Shah', email: 'priya@example.com', phone: '0433 210 887', company: 'Canberra Arts Hub', notes: 'Pickup from Phillip', dietary: ['Gluten free'] };
}
export function toCatering(platform, p, pricePP) {
  const name = p.name || [p.firstName, p.lastName].filter(Boolean).join(' '), delivery = !!p.location;
  return { packageId: p.packageId || p.package, guests: +p.guests, date: p.date, time: p.time || '12:00', fulfil: delivery ? 'delivery' : 'pickup', address: p.location || '', cafe: 'phillip',
    name: p.company || name, contact: name + ' · ' + p.phone + ' · ' + p.email, email: p.email, phone: p.phone, occasion: p.occasion || '', dietary: p.dietary || [], notes: p.notes || '',
    quote: Math.round(pricePP * (+p.guests) * (delivery ? 1.1 : 1) * 100) / 100, status: 'enquiry', source: platform, extRef: p.extRef, paid: false };
}
