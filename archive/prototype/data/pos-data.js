// Operational mock data for POS. Menu/cafés/catering come from the approved website snapshot.
// Replace each export with the matching service response (see data/types.js for shapes).
import { MENU, CATEGORIES, LOCATIONS, CATERING } from './mock-data.js';
export { MENU, CATEGORIES, LOCATIONS, CATERING };

export const MENU_BY_ID = Object.fromEntries(MENU.map(m => [m.id, m]));
export const DEFAULT_CAFE = 'phillip';

export const DIETARY_ADJUST = ['No dairy', 'No gluten (GFO)', 'No nuts', 'No egg', 'Extra hot', 'Decaf'];

export const ROLES = {
  cashier: { label: 'Cashier', perms: ['pos', 'orders', 'reservations.view', 'customers.view', 'loyalty.stamp', 'gift.redeem'] },
  manager: { label: 'Manager', perms: ['pos', 'orders', 'orders.refund', 'cash.out', 'reservations', 'catering', 'customers', 'loyalty', 'gift', 'inventory', 'reports', 'staff.view', 'settings.view'] },
  admin:   { label: 'Admin', perms: ['*'] }
};
export const PERMISSIONS = [
  ['pos', 'Take orders on the till'], ['orders.refund', 'Refund, void or cancel paid orders'], ['cash.out', 'Cash out & approve drawer variance'], ['reservations', 'Manage reservations'], ['catering', 'Manage catering'],
  ['customers', 'Edit customers'], ['loyalty', 'Adjust stamps & rewards'], ['gift', 'Issue gift cards'], ['inventory', 'Edit menu, prices & stock'],
  ['reports', 'View reports'], ['staff', 'Manage staff & roles'], ['settings', 'Change settings']
];
export const STAFF = [
  { id: 's1', name: 'Nadia Rahman', initials: 'NR', role: 'admin', pin: '2468', cafe: 'phillip', shift: 'Owner · all cafés' },
  { id: 's2', name: 'Tom Ellery', initials: 'TE', role: 'manager', pin: '1357', cafe: 'phillip', shift: 'Fri 6:30am – 3:30pm' },
  { id: 's3', name: 'Priya Sood', initials: 'PS', role: 'cashier', pin: '1111', cafe: 'phillip', shift: 'Fri 7:00am – 1:00pm' },
  { id: 's4', name: 'Leo Marchetti', initials: 'LM', role: 'cashier', pin: '2222', cafe: 'phillip', shift: 'Fri 9:00am – 3:00pm' },
  { id: 's5', name: 'Hana Kim', initials: 'HK', role: 'manager', pin: '3333', cafe: 'braddon', shift: 'Fri 6:00am – 2:00pm' }
];

export const CUSTOMERS = [
  { id: 'c1', name: 'Sophie Nguyen', phone: '0400 123 456', email: 'sophie.n@example.com', stamps: 6, rewards: 0, homeCafe: 'braddon', dietary: [], notes: 'Flat white, oat, regular', since: 'Mar 2024', wallet: true, visits: 84, spend: 1240, lastDays: 0 },
  { id: 'c2', name: 'Marcus Webb', phone: '0412 884 201', email: 'marcus.webb@example.com', stamps: 9, rewards: 1, homeCafe: 'phillip', dietary: ['Coeliac'], notes: 'Always GF bun. Office orders Fridays.', since: 'Jun 2023', wallet: true, visits: 132, spend: 2310, lastDays: 1 },
  { id: 'c3', name: 'Aisha Khan', phone: '0431 554 092', email: 'aisha.k@example.com', stamps: 2, rewards: 0, homeCafe: 'phillip', dietary: ['Vegan'], notes: '', since: 'Jan 2025', wallet: false, visits: 11, spend: 168, lastDays: 0 },
  { id: 'c4', name: 'Daniel Okafor', phone: '0455 019 778', email: 'd.okafor@example.com', stamps: 4, rewards: 0, homeCafe: 'kingston', dietary: ['Nut allergy'], notes: 'Brings the dog — puppychino', since: 'Sep 2024', wallet: true, visits: 37, spend: 520, lastDays: 3 },
  { id: 'c5', name: 'Grace Liu', phone: '0422 376 540', email: 'grace.liu@example.com', stamps: 8, rewards: 0, homeCafe: 'phillip', dietary: [], notes: 'Catering contact — ACT Health team', since: 'Feb 2024', wallet: false, visits: 46, spend: 3890, lastDays: 2 },
  { id: 'c6', name: 'Oliver Brandt', phone: '0407 660 318', email: 'oli.brandt@example.com', stamps: 1, rewards: 0, homeCafe: 'civic', dietary: ['Lactose free'], notes: '', since: 'Aug 2025', wallet: false, visits: 4, spend: 52, lastDays: 12 },
  { id: 'c7', name: 'Isabella Rossi', phone: '0468 203 115', email: 'bella.rossi@example.com', stamps: 5, rewards: 0, homeCafe: 'phillip', dietary: [], notes: 'Regular table for 4 on Sundays', since: 'Nov 2023', wallet: true, visits: 96, spend: 1680, lastDays: 6 }
];

const L = (itemId, qty = 1, sel = {}, extra = {}) => ({ key: itemId + Math.random().toString(36).slice(2, 6), itemId, name: MENU_BY_ID[itemId].name, qty, sel, adjust: [], note: '', price: MENU_BY_ID[itemId].price + Object.values(sel).flat().reduce((s, lab) => { for (const g of MENU_BY_ID[itemId].mods) { const o = g.options.find(x => x[0] === lab); if (o) return s + o[1]; } return s; }, 0), ...extra });
const sum = lines => Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
const O = (id, channel, type, status, time, lines, x = {}) => ({ id, channel, type, status, time, cafe: 'phillip', lines, total: sum(lines), paid: status !== 'new' || channel !== 'pos', methods: ['card'], ...x });

export const ORDERS = [
  O('#8020-4471', 'app', 'pickup', 'new', '09:41', [L('hotcoffee', 1, { drink: ['Flat White'], var: ['OAT ADC'] }), L('smashed')], { customerId: 'c1', methods: ['wallet'] }),
  O('#8020-4470', 'web', 'delivery', 'new', '09:38', [L('japanese', 2), L('coldpressed', 2, { fl: ['Green +'] })], { customerId: 'c5', methods: ['card'] }),
  O('#8020-4469', 'pos', 'dinein', 'preparing', '09:34', [L('benedict', 1, { prot: ['Smoked Salmon'] }), L('hotcoffee', 2, { drink: ['Latte'] }), L('ftoast')], { table: 'T4', customerId: 'c7', paid: false, methods: [] }),
  O('#8020-4468', 'pos', 'takeaway', 'preparing', '09:31', [L('brekky', 1, {}, { adjust: ['No gluten (GFO)'] }), L('hotcoffee', 1, { drink: ['Long Black'] })], { methods: ['cash'] }),
  O('#8020-4467', 'app', 'pickup', 'ready', '09:27', [L('nutty'), L('acai-o')], { customerId: 'c3', methods: ['wallet'] }),
  O('#8020-4466', 'pos', 'dinein', 'preparing', '09:22', [L('mighty'), L('bburger', 1, { style: ['Original'] }), L('hotcoffee', 2, { drink: ['Cappucino'] })], { table: 'T9', paid: false, methods: [] }),
  O('#8020-4465', 'pos', 'takeaway', 'completed', '09:12', [L('hotcoffee', 1, { drink: ['Magic'] })], { customerId: 'c2', methods: ['card'] }),
  O('#8020-4464', 'web', 'pickup', 'completed', '08:58', [L('beef', 1, { gfo: ['Gluten Free Bun'] }), L('karma', 1, { fl: ['Ginger Beer'] })], { customerId: 'c2', methods: ['card'] }),
  O('#8020-4463', 'pos', 'takeaway', 'completed', '08:46', [L('hotcoffee', 2, { drink: ['Flat White'] }), L('original-kids-3')], { methods: ['cash'] }),
  O('#8020-4462', 'app', 'pickup', 'completed', '08:31', [L('icedlatte'), L('granola', 1, { milk: ['Almond Milk'] })], { customerId: 'c4', methods: ['gift'] }),
  O('#8020-4461', 'pos', 'dinein', 'completed', '08:14', [L('greeneggs', 2), L('hotcoffee', 2, { drink: ['Piccolo'] })], { table: 'T2', methods: ['card'] }),
  O('#8020-4460', 'pos', 'takeaway', 'refunded', '07:52', [L('matcha')], { methods: ['card'], refundNote: 'Made with dairy by mistake' }),
  O('#8020-4459', 'web', 'pickup', 'completed', '07:40', [L('original-takeaway-2', 2), L('hotcoffee', 2, { drink: ['Latte'] })], { methods: ['card'] }),
  O('#8020-4458', 'pos', 'takeaway', 'completed', '07:21', [L('hotcoffee', 1, { drink: ['Flat White'], var: ['Large'] })], { customerId: 'c6', methods: ['cash'] })
];

export const TABLES = [
  { id: 'T1', seats: 2, zone: 'Window' }, { id: 'T2', seats: 2, zone: 'Window' }, { id: 'T3', seats: 4, zone: 'Window' }, { id: 'T4', seats: 4, zone: 'Main' },
  { id: 'T5', seats: 4, zone: 'Main' }, { id: 'T6', seats: 6, zone: 'Main' }, { id: 'T7', seats: 2, zone: 'Main' }, { id: 'T8', seats: 2, zone: 'Shoppe' },
  { id: 'T9', seats: 4, zone: 'Shoppe' }, { id: 'T10', seats: 8, zone: 'Courtyard' }, { id: 'T11', seats: 4, zone: 'Courtyard' }, { id: 'T12', seats: 4, zone: 'Courtyard' }
];

const today = new Date(); const d = n => { const x = new Date(today); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const RESERVATIONS = [
  { id: 'r1', cafe: 'phillip', date: d(0), time: '10:00', guests: 4, name: 'Isabella Rossi', phone: '0468 203 115', notes: 'Window table if possible', status: 'confirmed', customerId: 'c7', table: 'T3' },
  { id: 'r2', cafe: 'phillip', date: d(0), time: '11:30', guests: 2, name: 'Jess Tan', phone: '0401 220 190', notes: 'Pram', status: 'confirmed', table: 'T5' },
  { id: 'r3', cafe: 'phillip', date: d(0), time: '12:30', guests: 8, name: 'ACT Health team', phone: '0422 376 540', notes: 'Grace Liu booking · 2 coeliac', status: 'pending', customerId: 'c5', table: 'T10' },
  { id: 'r4', cafe: 'phillip', date: d(1), time: '09:00', guests: 2, name: 'Marcus Webb', phone: '0412 884 201', notes: '', status: 'confirmed', customerId: 'c2' },
  { id: 'r5', cafe: 'phillip', date: d(1), time: '10:30', guests: 6, name: 'Birthday · Alana', phone: '0433 905 118', notes: 'Candle on the french toast', status: 'pending' },
  { id: 'r6', cafe: 'phillip', date: d(2), time: '09:30', guests: 4, name: 'Isabella Rossi', phone: '0468 203 115', notes: 'Sunday regular', status: 'confirmed', customerId: 'c7' },
  { id: 'r7', cafe: 'braddon', date: d(0), time: '08:30', guests: 3, name: 'Sam Doyle', phone: '0409 118 770', notes: '', status: 'completed' },
  { id: 'r8', cafe: 'phillip', date: d(-1), time: '12:00', guests: 2, name: 'Ryan Hale', phone: '0417 342 110', notes: '', status: 'cancelled' },
  { id: 'r9', cafe: 'phillip', date: d(-2), time: '09:00', guests: 5, name: 'Chen family', phone: '0421 677 234', notes: 'High chair', status: 'completed' }
];

export const CATERING_ENQUIRIES = [
  { id: 'ce1', packageId: 'Lunch', guests: 24, date: d(5), time: '12:00', fulfil: 'delivery', address: 'Level 3, 2 Phillip Law St, Canberra', cafe: 'phillip', name: 'ACT Health team', contact: 'Grace Liu · 0422 376 540', dietary: ['2 coeliac', '3 vegan'], notes: 'Option 2 salads preferred. Invoice to department.', quote: 660, status: 'quoted', customerId: 'c5' },
  { id: 'ce2', packageId: 'Breakfast', guests: 40, date: d(8), time: '08:00', fulfil: 'pickup', address: '', cafe: 'phillip', name: 'Canberra Grammar staff day', contact: 'Oliver Brandt · 0407 660 318', dietary: ['Mixed — please label'], notes: '', quote: 880, status: 'enquiry', customerId: 'c6' },
  { id: 'ce3', packageId: 'Afternoon Tea', guests: 15, date: d(2), time: '14:30', fulfil: 'delivery', address: '14 Childers St, Canberra', cafe: 'phillip', name: 'Mantle Studio', contact: 'Aisha Khan · 0431 554 092', dietary: ['All vegan'], notes: 'Nachos vegan please', quote: 247.5, status: 'confirmed', customerId: 'c3' },
  { id: 'ce4', packageId: 'Lunch', guests: 12, date: d(-6), time: '12:30', fulfil: 'pickup', address: '', cafe: 'phillip', name: 'Webb & Co', contact: 'Marcus Webb · 0412 884 201', dietary: ['GF for all'], notes: '', quote: 330, status: 'delivered', customerId: 'c2' }
];

export const GIFT_CARDS = [
  { code: '6011 2000 4471 8020', issued: 50, balance: 42.5, issuedOn: '12 Sep 2026', customerId: 'c4', history: [{ d: '12 Sep', what: 'Issued · Phillip till', amt: 50 }, { d: '8 Oct', what: 'Redeemed · order #8020-4462', amt: -7.5 }] },
  { code: '6011 2000 1193 2211', issued: 100, balance: 100, issuedOn: '3 Oct 2026', customerId: null, history: [{ d: '3 Oct', what: 'Sold · website (Square eGift)', amt: 100 }] },
  { code: '6011 2000 7745 0934', issued: 25, balance: 6.2, issuedOn: '19 Aug 2026', customerId: 'c1', history: [{ d: '19 Aug', what: 'Issued · Braddon till', amt: 25 }, { d: '2 Sep', what: 'Redeemed · #8020-3980', amt: -11.9 }, { d: '20 Sep', what: 'Redeemed · #8020-4188', amt: -6.9 }] },
  { code: '6011 2000 3310 5582', issued: 75, balance: 0, issuedOn: '2 Jul 2026', customerId: 'c7', history: [{ d: '2 Jul', what: 'Issued · Phillip till', amt: 75 }, { d: '14 Aug', what: 'Redeemed · #8020-3712', amt: -75 }] }
];

export const STOCK = [
  { id: 'milk', name: 'Full cream milk', unit: 'L', level: 18, par: 30, state: 'ok' }, { id: 'oat', name: 'OAT ADC', unit: 'L', level: 4, par: 12, state: 'low' },
  { id: 'bonsoy', name: 'Bonsoy', unit: 'L', level: 9, par: 10, state: 'ok' }, { id: 'beans', name: 'House blend beans', unit: 'kg', level: 6.5, par: 8, state: 'ok' },
  { id: 'gfbun', name: 'Gluten free buns', unit: 'ea', level: 7, par: 24, state: 'low' }, { id: 'sourdough', name: 'GF sourdough loaves', unit: 'ea', level: 0, par: 6, state: 'out' },
  { id: 'acai', name: 'Organic açai packs', unit: 'ea', level: 22, par: 20, state: 'ok' }, { id: 'eggs', name: 'Free range eggs', unit: 'dz', level: 11, par: 10, state: 'ok' },
  { id: 'salmon', name: 'Smoked salmon', unit: 'kg', level: 1.2, par: 2, state: 'low' }, { id: 'brioche', name: 'GF brioche', unit: 'ea', level: 9, par: 12, state: 'ok' }
];
export const SOLD_OUT = ['original-allday-1', 'prawncroissant'];
export const BRANCH_OFF = { civic: ['mighty', 'benedict', 'risotto', 'linguine', 'serenade', 'fish', 'tacos'] };

export const REPORTS = {
  days: [{ d: 'Sat', sales: 6240, orders: 312 }, { d: 'Sun', sales: 6890, orders: 341 }, { d: 'Mon', sales: 3210, orders: 188 }, { d: 'Tue', sales: 3480, orders: 201 }, { d: 'Wed', sales: 3620, orders: 209 }, { d: 'Thu', sales: 3910, orders: 224 }, { d: 'Fri', sales: 2140, orders: 118, partial: true }],
  weeks: [{ w: 'W37', sales: 27900 }, { w: 'W38', sales: 28750 }, { w: 'W39', sales: 29120 }, { w: 'W40', sales: 30860 }, { w: 'W41', sales: 29490 }],
  best: [{ itemId: 'hotcoffee', qty: 1184, rev: 6512 }, { itemId: 'smashed', qty: 162, rev: 2430 }, { itemId: 'benedict', qty: 141, rev: 3243 }, { itemId: 'acai-o', qty: 118, rev: 2596 }, { itemId: 'brekky', qty: 109, rev: 1635 }, { itemId: 'icedlatte', qty: 96, rev: 576 }],
  payments: [{ m: 'Card', pct: 61, amt: 18060 }, { m: 'Apple Pay / wallet', pct: 22, amt: 6510 }, { m: 'Cash', pct: 11, amt: 3260 }, { m: 'Gift card', pct: 4, amt: 1180 }, { m: 'Loyalty reward', pct: 2, amt: 480 }],
  channels: [{ c: 'POS', pct: 68 }, { c: 'App', pct: 19 }, { c: 'Website', pct: 13 }],
  loyalty: { stamps: 1184, rewards: 97, newMembers: 38, walletPasses: 412 },
  reservations: { week: 64, covers: 212, noShow: 3, avgParty: 3.3 },
  catering: { enquiries: 9, confirmed: 5, revenue: 3410 }
};

// Coffee card rules — POS-owned configuration (shared contract: same fields the app and website display).
export const LOYALTY_RULES = { per: 9, reward: 'Your 10th coffee is free.', eligible: 'Any coffee or hot drink, any size, at any EightyTwenty café.', wallet: true };
