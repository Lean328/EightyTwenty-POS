// DEVELOPMENT DATA — published café details and catering packages (approved website snapshot).
// Production reads these from the shared backend. Do not import from production code.
import type { CateringPackage, Location, PromoCode, Table } from '../../domain/types';

export const LOCATIONS: Location[] = [
  {
    id: 'braddon',
    name: 'Braddon',
    address: '1/18 Lonsdale St, Braddon ACT 2612',
    phone: '0451 448 018',
    hours: 'Mon–Sun 6:00am – 3:00pm',
    hoursShort: '6am – 3pm, 7 days',
    email: 'braddon@eightytwentyfood.com.au',
  },
  {
    id: 'civic',
    name: 'Civic',
    address: '19 Mort Street, Canberra City, ACT 2601',
    phone: '0451 227 872',
    hours: 'Mon–Fri 7:00am – 3:00pm · Sat–Sun closed',
    hoursShort: '7am – 3pm, weekdays',
    email: 'northbourne@eightytwentyfood.com.au',
  },
  {
    id: 'coombs',
    name: 'Coombs',
    address: '1 Fairhall St, Coombs ACT 2611',
    phone: '0450 220 890',
    hours: 'Mon–Sun 7:00am – 3:00pm',
    hoursShort: '7am – 3pm, 7 days',
    email: 'coombs@eightytwentyfood.com.au',
  },
  {
    id: 'greenway',
    name: 'Greenway',
    address: '19/191 Anketell St, Greenway ACT 2900',
    phone: '0410 271 437',
    hours: 'Mon–Sun 6:00am – 3:00pm',
    hoursShort: '6am – 3pm, 7 days',
    email: 'greenway@eightytwentyfood.com.au',
  },
  {
    id: 'gungahlin',
    name: 'Gungahlin',
    address: '114/43 Hibberson St, Gungahlin ACT 2912',
    phone: '0435 208 945',
    hours: 'Mon–Sun 6:00am – 3:00pm',
    hoursShort: '6am – 3pm, 7 days',
    email: 'gungahlin@eightytwentyfood.com.au',
  },
  {
    id: 'dickson',
    name: 'Dickson',
    address: '1/28 Challis St, Dickson',
    phone: '0426 633 085',
    hours: 'Mon–Sun 6:00am – 3:00pm',
    hoursShort: '6am – 3pm, 7 days',
    email: 'dickson@eightytwentyfood.com.au',
  },
  {
    id: 'belconnen',
    name: 'Belconnen',
    address: '1/25 Lathlain St, Belconnen ACT 2617',
    phone: '0404 972 966',
    hours: 'Mon–Sun 7:00am – 3:00pm',
    hoursShort: '7am – 3pm, 7 days',
    email: 'belconnen@eightytwentyfood.com.au',
    gf: true,
  },
  {
    id: 'phillip',
    name: 'Phillip',
    address: 'C07/11 Launceston Street, Phillip ACT 2606',
    phone: '0410 380 999',
    hours: 'Mon–Sun 7:00am – 3:00pm',
    hoursShort: '7am – 3pm, 7 days',
    email: 'phillip@eightytwentyfood.com.au',
    gf: true,
  },
  {
    id: 'kingston',
    name: 'Kingston',
    address: '9/15 Tench St, Kingston ACT 2604',
    phone: '0461 507 674',
    hours: 'Mon–Sun 6:00am – 3:00pm',
    hoursShort: '6am – 3pm, 7 days',
    email: 'kingston@eightytwentyfood.com.au',
  },
  {
    id: 'akuna',
    name: 'Akuna St',
    address: 'Akuna St, Canberra City',
    phone: '',
    hours: 'Hours to be confirmed',
    hoursShort: 'Hours TBC',
    email: '',
    tbc: true,
  },
];

export const CATERING_PACKAGES: CateringPackage[] = [
  {
    id: 'Breakfast',
    pricePerPerson: 22,
    unit: 'per person',
    blurb: 'Rolls, wraps and croissants with fruit and sweets. The easy morning spread.',
    items: [
      'Sandwich, wrap, croissant or roll: chicken, vegan, ham cheese tomato, or bacon egg cheese',
      'Fruit bowl',
      'Vegan and gluten free sweets (raw slice and donut)',
    ],
  },
  {
    id: 'Lunch',
    pricePerPerson: 27.5,
    unit: 'per person',
    blurb: 'Sliders, burgers or grilled-protein salads, served with fresh juice.',
    items: [
      'Option 1: two sliders or a burger per person (chicken, beef, vegetarian, lamb or vegan) with fresh juice',
      'Option 2: Lamb, Japanese or Super Salad with grilled chicken or grilled salmon, with fresh juice',
      'Fresh juice: mixed vegetable or mixed fruit',
    ],
  },
  {
    id: 'Afternoon Tea',
    pricePerPerson: 16.5,
    unit: 'per person',
    blurb: 'Something sweet, a light snack and fresh juice for the mid-afternoon lull.',
    items: ['Something sweet: muffin, donut or raw slice', 'Light snacks: nachos', 'Fresh juice: mixed fruit or mixed vegetable'],
  },
];

export const TABLES: Table[] = [
  { id: 'T1', seats: 2, zone: 'Window' },
  { id: 'T2', seats: 2, zone: 'Window' },
  { id: 'T3', seats: 4, zone: 'Window' },
  { id: 'T4', seats: 4, zone: 'Main' },
  { id: 'T5', seats: 4, zone: 'Main' },
  { id: 'T6', seats: 6, zone: 'Main' },
  { id: 'T7', seats: 2, zone: 'Main' },
  { id: 'T8', seats: 2, zone: 'Shoppe' },
  { id: 'T9', seats: 4, zone: 'Shoppe' },
  { id: 'T10', seats: 8, zone: 'Courtyard' },
  { id: 'T11', seats: 4, zone: 'Courtyard' },
  { id: 'T12', seats: 4, zone: 'Courtyard' },
];

/** Test-only codes — not verified EightyTwenty promotions. */
export const PROMOS: PromoCode[] = [
  { code: 'WELCOME10', kind: 'pct', value: 10, label: 'Demo code · 10% off' },
  { code: 'LOCAL5', kind: 'amt', value: 5, label: 'Demo code · $5 off' },
  { code: 'KEEPCUP', kind: 'amt', value: 5, label: 'Demo code · Keep Cup $5' },
];
