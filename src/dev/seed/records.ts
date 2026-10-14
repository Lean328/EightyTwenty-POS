// DEVELOPMENT DATA — sample operational records for the local data provider (customers, orders, bookings…).
// None of this is real trading data. Production reads these records from the shared backend.
import type {
  CateringEnquiry,
  Channel,
  Customer,
  GiftCard,
  ModSelection,
  Order,
  OrderLine,
  OrderStatus,
  OrderType,
  ReportsData,
  Reservation,
  StaffMember,
  StockItem,
} from '../../domain/types';
import { MENU } from './menu';

const MENU_BY_ID = Object.fromEntries(MENU.map((m) => [m.id, m]));
let seq = 0;

export const STAFF: StaffMember[] = [
  { id: 's1', name: 'Nadia Rahman', initials: 'NR', role: 'admin', cafe: 'phillip', shift: 'Owner · all cafés' },
  { id: 's2', name: 'Tom Ellery', initials: 'TE', role: 'manager', cafe: 'phillip', shift: 'Fri 6:30am – 3:30pm' },
  { id: 's3', name: 'Priya Sood', initials: 'PS', role: 'cashier', cafe: 'phillip', shift: 'Fri 7:00am – 1:00pm' },
  { id: 's4', name: 'Leo Marchetti', initials: 'LM', role: 'cashier', cafe: 'phillip', shift: 'Fri 9:00am – 3:00pm' },
  { id: 's5', name: 'Hana Kim', initials: 'HK', role: 'manager', cafe: 'braddon', shift: 'Fri 6:00am – 2:00pm' },
];

/** Development sign-in PINs (staff id → PIN). Real PINs live only in the backend auth service. */
export const DEV_STAFF_PINS: Record<string, string> = { s1: '2468', s2: '1357', s3: '1111', s4: '2222', s5: '3333' };

export const CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Sophie Nguyen',
    phone: '0400 123 456',
    email: 'sophie.n@example.com',
    stamps: 6,
    rewards: 0,
    homeCafe: 'braddon',
    dietary: [],
    notes: 'Flat white, oat, regular',
    since: 'Mar 2024',
    wallet: true,
    visits: 84,
    spend: 1240,
    lastDays: 0,
  },
  {
    id: 'c2',
    name: 'Marcus Webb',
    phone: '0412 884 201',
    email: 'marcus.webb@example.com',
    stamps: 9,
    rewards: 1,
    homeCafe: 'phillip',
    dietary: ['Coeliac'],
    notes: 'Always GF bun. Office orders Fridays.',
    since: 'Jun 2023',
    wallet: true,
    visits: 132,
    spend: 2310,
    lastDays: 1,
  },
  {
    id: 'c3',
    name: 'Aisha Khan',
    phone: '0431 554 092',
    email: 'aisha.k@example.com',
    stamps: 2,
    rewards: 0,
    homeCafe: 'phillip',
    dietary: ['Vegan'],
    notes: '',
    since: 'Jan 2025',
    wallet: false,
    visits: 11,
    spend: 168,
    lastDays: 0,
  },
  {
    id: 'c4',
    name: 'Daniel Okafor',
    phone: '0455 019 778',
    email: 'd.okafor@example.com',
    stamps: 4,
    rewards: 0,
    homeCafe: 'kingston',
    dietary: ['Nut allergy'],
    notes: 'Brings the dog — puppychino',
    since: 'Sep 2024',
    wallet: true,
    visits: 37,
    spend: 520,
    lastDays: 3,
  },
  {
    id: 'c5',
    name: 'Grace Liu',
    phone: '0422 376 540',
    email: 'grace.liu@example.com',
    stamps: 8,
    rewards: 0,
    homeCafe: 'phillip',
    dietary: [],
    notes: 'Catering contact — ACT Health team',
    since: 'Feb 2024',
    wallet: false,
    visits: 46,
    spend: 3890,
    lastDays: 2,
  },
  {
    id: 'c6',
    name: 'Oliver Brandt',
    phone: '0407 660 318',
    email: 'oli.brandt@example.com',
    stamps: 1,
    rewards: 0,
    homeCafe: 'civic',
    dietary: ['Lactose free'],
    notes: '',
    since: 'Aug 2025',
    wallet: false,
    visits: 4,
    spend: 52,
    lastDays: 12,
  },
  {
    id: 'c7',
    name: 'Isabella Rossi',
    phone: '0468 203 115',
    email: 'bella.rossi@example.com',
    stamps: 5,
    rewards: 0,
    homeCafe: 'phillip',
    dietary: [],
    notes: 'Regular table for 4 on Sundays',
    since: 'Nov 2023',
    wallet: true,
    visits: 96,
    spend: 1680,
    lastDays: 6,
  },
];

function line(itemId: string, qty = 1, sel: ModSelection = {}, extra: Partial<OrderLine> = {}): OrderLine {
  const m = MENU_BY_ID[itemId];
  const price =
    m.price +
    Object.values(sel)
      .flat()
      .reduce((s, lab) => {
        for (const g of m.mods) {
          const o = g.options.find((x) => x[0] === lab);
          if (o) return s + o[1];
        }
        return s;
      }, 0);
  return { key: itemId + 'L' + ++seq, itemId, name: m.name, qty, sel, adjust: [], note: '', price, ...extra };
}
const sum = (lines: OrderLine[]) => Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
function order(
  id: string,
  channel: Channel,
  type: OrderType,
  status: OrderStatus,
  time: string,
  lines: OrderLine[],
  x: Partial<Order> = {},
): Order {
  return {
    id,
    channel,
    type,
    status,
    time,
    cafe: 'phillip',
    lines,
    total: sum(lines),
    paid: status !== 'new' || channel !== 'pos',
    methods: ['card'],
    ...x,
  };
}

export const ORDERS: Order[] = [
  order(
    '#8020-4471',
    'app',
    'pickup',
    'new',
    '09:41',
    [line('hotcoffee', 1, { drink: ['Flat White'], var: ['OAT ADC'] }), line('smashed')],
    { customerId: 'c1', methods: ['wallet'] },
  ),
  order('#8020-4470', 'web', 'delivery', 'new', '09:38', [line('japanese', 2), line('coldpressed', 2, { fl: ['Green +'] })], {
    customerId: 'c5',
    methods: ['card'],
  }),
  order(
    '#8020-4469',
    'pos',
    'dinein',
    'preparing',
    '09:34',
    [line('benedict', 1, { prot: ['Smoked Salmon'] }), line('hotcoffee', 2, { drink: ['Latte'] }), line('ftoast')],
    { table: 'T4', customerId: 'c7', paid: false, methods: [] },
  ),
  order(
    '#8020-4468',
    'pos',
    'takeaway',
    'preparing',
    '09:31',
    [line('brekky', 1, {}, { adjust: ['No gluten (GFO)'] }), line('hotcoffee', 1, { drink: ['Long Black'] })],
    { methods: ['cash'] },
  ),
  order('#8020-4467', 'app', 'pickup', 'ready', '09:27', [line('nutty'), line('acai-o')], { customerId: 'c3', methods: ['wallet'] }),
  order(
    '#8020-4466',
    'pos',
    'dinein',
    'preparing',
    '09:22',
    [line('mighty'), line('bburger', 1, { style: ['Original'] }), line('hotcoffee', 2, { drink: ['Cappucino'] })],
    { table: 'T9', paid: false, methods: [] },
  ),
  order('#8020-4465', 'pos', 'takeaway', 'completed', '09:12', [line('hotcoffee', 1, { drink: ['Magic'] })], {
    customerId: 'c2',
    methods: ['card'],
  }),
  order(
    '#8020-4464',
    'web',
    'pickup',
    'completed',
    '08:58',
    [line('beef', 1, { gfo: ['Gluten Free Bun'] }), line('karma', 1, { fl: ['Ginger Beer'] })],
    { customerId: 'c2', methods: ['card'] },
  ),
  order('#8020-4463', 'pos', 'takeaway', 'completed', '08:46', [line('hotcoffee', 2, { drink: ['Flat White'] }), line('original-kids-3')], {
    methods: ['cash'],
  }),
  order('#8020-4462', 'app', 'pickup', 'completed', '08:31', [line('icedlatte'), line('granola', 1, { milk: ['Almond Milk'] })], {
    customerId: 'c4',
    methods: ['gift'],
  }),
  order('#8020-4461', 'pos', 'dinein', 'completed', '08:14', [line('greeneggs', 2), line('hotcoffee', 2, { drink: ['Piccolo'] })], {
    table: 'T2',
    methods: ['card'],
  }),
  order('#8020-4460', 'pos', 'takeaway', 'refunded', '07:52', [line('matcha')], { methods: ['card'] }),
  order('#8020-4459', 'web', 'pickup', 'completed', '07:40', [line('original-takeaway-2', 2), line('hotcoffee', 2, { drink: ['Latte'] })], {
    methods: ['card'],
  }),
  order('#8020-4458', 'pos', 'takeaway', 'completed', '07:21', [line('hotcoffee', 1, { drink: ['Flat White'], var: ['Large'] })], {
    customerId: 'c6',
    methods: ['cash'],
  }),
];
/** Next order number after the seeded orders. */
export const SEED_ORDER_SEQ = 4471;

const day = (n: number): string => {
  const x = new Date();
  x.setDate(x.getDate() + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const RESERVATIONS = (): Reservation[] => [
  {
    id: 'r1',
    cafe: 'phillip',
    date: day(0),
    time: '10:00',
    guests: 4,
    name: 'Isabella Rossi',
    phone: '0468 203 115',
    notes: 'Window table if possible',
    status: 'confirmed',
    customerId: 'c7',
    table: 'T3',
  },
  {
    id: 'r2',
    cafe: 'phillip',
    date: day(0),
    time: '11:30',
    guests: 2,
    name: 'Jess Tan',
    phone: '0401 220 190',
    notes: 'Pram',
    status: 'confirmed',
    table: 'T5',
  },
  {
    id: 'r3',
    cafe: 'phillip',
    date: day(0),
    time: '12:30',
    guests: 8,
    name: 'ACT Health team',
    phone: '0422 376 540',
    notes: 'Grace Liu booking · 2 coeliac',
    status: 'pending',
    customerId: 'c5',
    table: 'T10',
  },
  {
    id: 'r4',
    cafe: 'phillip',
    date: day(1),
    time: '09:00',
    guests: 2,
    name: 'Marcus Webb',
    phone: '0412 884 201',
    notes: '',
    status: 'confirmed',
    customerId: 'c2',
  },
  {
    id: 'r5',
    cafe: 'phillip',
    date: day(1),
    time: '10:30',
    guests: 6,
    name: 'Birthday · Alana',
    phone: '0433 905 118',
    notes: 'Candle on the french toast',
    status: 'pending',
  },
  {
    id: 'r6',
    cafe: 'phillip',
    date: day(2),
    time: '09:30',
    guests: 4,
    name: 'Isabella Rossi',
    phone: '0468 203 115',
    notes: 'Sunday regular',
    status: 'confirmed',
    customerId: 'c7',
  },
  {
    id: 'r7',
    cafe: 'braddon',
    date: day(0),
    time: '08:30',
    guests: 3,
    name: 'Sam Doyle',
    phone: '0409 118 770',
    notes: '',
    status: 'completed',
  },
  {
    id: 'r8',
    cafe: 'phillip',
    date: day(-1),
    time: '12:00',
    guests: 2,
    name: 'Ryan Hale',
    phone: '0417 342 110',
    notes: '',
    status: 'cancelled',
  },
  {
    id: 'r9',
    cafe: 'phillip',
    date: day(-2),
    time: '09:00',
    guests: 5,
    name: 'Chen family',
    phone: '0421 677 234',
    notes: 'High chair',
    status: 'completed',
  },
];

export const CATERING_ENQUIRIES = (): CateringEnquiry[] => [
  {
    id: 'ce1',
    packageId: 'Lunch',
    guests: 24,
    date: day(5),
    time: '12:00',
    fulfil: 'delivery',
    address: 'Level 3, 2 Phillip Law St, Canberra',
    cafe: 'phillip',
    name: 'ACT Health team',
    contact: 'Grace Liu · 0422 376 540',
    dietary: ['2 coeliac', '3 vegan'],
    notes: 'Option 2 salads preferred. Invoice to department.',
    quote: 660,
    status: 'quoted',
    customerId: 'c5',
  },
  {
    id: 'ce2',
    packageId: 'Breakfast',
    guests: 40,
    date: day(8),
    time: '08:00',
    fulfil: 'pickup',
    address: '',
    cafe: 'phillip',
    name: 'Canberra Grammar staff day',
    contact: 'Oliver Brandt · 0407 660 318',
    dietary: ['Mixed — please label'],
    notes: '',
    quote: 880,
    status: 'enquiry',
    customerId: 'c6',
  },
  {
    id: 'ce3',
    packageId: 'Afternoon Tea',
    guests: 15,
    date: day(2),
    time: '14:30',
    fulfil: 'delivery',
    address: '14 Childers St, Canberra',
    cafe: 'phillip',
    name: 'Mantle Studio',
    contact: 'Aisha Khan · 0431 554 092',
    dietary: ['All vegan'],
    notes: 'Nachos vegan please',
    quote: 247.5,
    status: 'confirmed',
    customerId: 'c3',
  },
  {
    id: 'ce4',
    packageId: 'Lunch',
    guests: 12,
    date: day(-6),
    time: '12:30',
    fulfil: 'pickup',
    address: '',
    cafe: 'phillip',
    name: 'Webb & Co',
    contact: 'Marcus Webb · 0412 884 201',
    dietary: ['GF for all'],
    notes: '',
    quote: 330,
    status: 'delivered',
    customerId: 'c2',
  },
];

export const GIFT_CARDS: GiftCard[] = [
  {
    code: '6011 2000 4471 8020',
    issued: 50,
    balance: 42.5,
    issuedOn: '12 Sep 2026',
    customerId: 'c4',
    history: [
      { d: '12 Sep', what: 'Issued · Phillip till', amt: 50 },
      { d: '8 Oct', what: 'Redeemed · order #8020-4462', amt: -7.5 },
    ],
  },
  {
    code: '6011 2000 1193 2211',
    issued: 100,
    balance: 100,
    issuedOn: '3 Oct 2026',
    customerId: null,
    history: [{ d: '3 Oct', what: 'Sold · website (Square eGift)', amt: 100 }],
  },
  {
    code: '6011 2000 7745 0934',
    issued: 25,
    balance: 6.2,
    issuedOn: '19 Aug 2026',
    customerId: 'c1',
    history: [
      { d: '19 Aug', what: 'Issued · Braddon till', amt: 25 },
      { d: '2 Sep', what: 'Redeemed · #8020-3980', amt: -11.9 },
      { d: '20 Sep', what: 'Redeemed · #8020-4188', amt: -6.9 },
    ],
  },
  {
    code: '6011 2000 3310 5582',
    issued: 75,
    balance: 0,
    issuedOn: '2 Jul 2026',
    customerId: 'c7',
    history: [
      { d: '2 Jul', what: 'Issued · Phillip till', amt: 75 },
      { d: '14 Aug', what: 'Redeemed · #8020-3712', amt: -75 },
    ],
  },
];

export const STOCK: StockItem[] = [
  { id: 'milk', name: 'Full cream milk', unit: 'L', level: 18, par: 30 },
  { id: 'oat', name: 'OAT ADC', unit: 'L', level: 4, par: 12 },
  { id: 'bonsoy', name: 'Bonsoy', unit: 'L', level: 9, par: 10 },
  { id: 'beans', name: 'House blend beans', unit: 'kg', level: 6.5, par: 8 },
  { id: 'gfbun', name: 'Gluten free buns', unit: 'ea', level: 7, par: 24 },
  { id: 'sourdough', name: 'GF sourdough loaves', unit: 'ea', level: 0, par: 6 },
  { id: 'acai', name: 'Organic açai packs', unit: 'ea', level: 22, par: 20 },
  { id: 'eggs', name: 'Free range eggs', unit: 'dz', level: 11, par: 10 },
  { id: 'salmon', name: 'Smoked salmon', unit: 'kg', level: 1.2, par: 2 },
  { id: 'brioche', name: 'GF brioche', unit: 'ea', level: 9, par: 12 },
];
export const SOLD_OUT = ['original-allday-1', 'prawncroissant'];
export const BRANCH_OFF: Record<string, string[]> = { civic: ['mighty', 'benedict', 'risotto', 'linguine', 'serenade', 'fish', 'tacos'] };

export const REPORTS: ReportsData = {
  days: [
    { d: 'Sat', sales: 6240, orders: 312 },
    { d: 'Sun', sales: 6890, orders: 341 },
    { d: 'Mon', sales: 3210, orders: 188 },
    { d: 'Tue', sales: 3480, orders: 201 },
    { d: 'Wed', sales: 3620, orders: 209 },
    { d: 'Thu', sales: 3910, orders: 224 },
    { d: 'Fri', sales: 2140, orders: 118, partial: true },
  ],
  weeks: [
    { w: 'W37', sales: 27900 },
    { w: 'W38', sales: 28750 },
    { w: 'W39', sales: 29120 },
    { w: 'W40', sales: 30860 },
    { w: 'W41', sales: 29490 },
  ],
  best: [
    { itemId: 'hotcoffee', qty: 1184, rev: 6512 },
    { itemId: 'smashed', qty: 162, rev: 2430 },
    { itemId: 'benedict', qty: 141, rev: 3243 },
    { itemId: 'acai-o', qty: 118, rev: 2596 },
    { itemId: 'brekky', qty: 109, rev: 1635 },
    { itemId: 'icedlatte', qty: 96, rev: 576 },
  ],
  payments: [
    { m: 'Card', pct: 61, amt: 18060 },
    { m: 'Apple Pay / wallet', pct: 22, amt: 6510 },
    { m: 'Cash', pct: 11, amt: 3260 },
    { m: 'Gift card', pct: 4, amt: 1180 },
    { m: 'Loyalty reward', pct: 2, amt: 480 },
  ],
  channels: [
    { c: 'POS', pct: 68 },
    { c: 'App', pct: 19 },
    { c: 'Website', pct: 13 },
  ],
  loyalty: { stamps: 1184, rewards: 97, newMembers: 38, walletPasses: 412 },
  reservations: { week: 64, covers: 212, noShow: 3, avgParty: 3.3 },
  catering: { enquiries: 9, confirmed: 5, revenue: 3410 },
  salesTodayComparison: '+8% vs last Friday',
  weekComparison: '+4.2% vs previous week',
  loyaltyActivity: [
    { what: '+1 stamp · Sophie Nguyen · Flat White', when: 'Today 8:12am' },
    { what: 'Free coffee redeemed · Marcus Webb', when: 'Today 7:58am' },
    { what: '+1 stamp · Oliver Brandt · Flat White', when: 'Today 7:21am' },
    { what: 'Wallet pass added · Isabella Rossi', when: 'Yesterday' },
    { what: '+2 stamps · Grace Liu · 2× Latte', when: 'Yesterday' },
  ],
};

export const LOYALTY_COPY = {
  reward: 'Your 10th coffee is free.',
  eligible: 'Any coffee or hot drink, any size, at any EightyTwenty café.',
};
