// Mapping between backend snapshots, the persisted device session, and in-memory state.
import { sanitizeRoles, DEFAULT_ROLES } from '../domain/permissions';
import type { DeviceStates } from '../domain/types';
import type { PosSnapshot } from '../services/contracts';
import type { OpsUi, PosState } from './types';

/** Keys saved per device (cart in progress, parked orders, who is signed in, layout). */
export const sessionKeys = [
  'lines',
  'type',
  'table',
  'customerId',
  'discount',
  'gift',
  'note',
  'held',
  'staffId',
  'cafe',
  'navOpen',
  'online',
] as const satisfies readonly (keyof PosState)[];

export type SessionState = Pick<PosState, (typeof sessionKeys)[number]>;

export const initialOps = (): OpsUi => ({
  cafe: 'all',
  cafeMenu: false,
  selOrder: null,
  selCat: null,
  selCust: null,
  selGift: null,
  custQ: '',
  custFilter: 'all',
  custEdit: '',
  custExpand: '',
  orderFilter: 'all',
  orderSrc: 'pos',
  resDay: 0,
  invTab: 'items',
  invCat: 'all',
  invQ: '',
  form: null,
  staffTab: 'team',
  auditQ: '',
  auditF: 'all',
  stockSel: null,
  stockAmt: '',
  stockReason: '',
  giftAmt: '',
  repHover: null,
});

const wide = () => (typeof window === 'undefined' ? 1440 : window.innerWidth);

export function initialState(session: Partial<SessionState>, devices: DeviceStates): PosState {
  return {
    phase: 'loading',
    loadError: '',
    offlineSince: null,
    catalog: { locations: [], categories: [], menu: [], menuById: {}, cateringPackages: [], tables: [], promotions: [] },
    reports: null,
    loyaltyCopy: { reward: '', eligible: '' },
    orders: [],
    customers: [],
    giftcards: [],
    reservations: [],
    catering: [],
    staff: [],
    roles: DEFAULT_ROLES,
    stock: [],
    stockLog: [],
    audit: [],
    shift: null,
    shifts: [],
    soldOut: [],
    branchOff: {},
    unavailableMods: [],
    availSync: '',
    prices: {},
    catOrder: [],
    loy: { per: 9, wallet: true, online: true },
    rules: {},
    toggles: { kitchen: true, receipt: false, tips: false, openDrawer: true, autoStamp: true },
    cafeFields: {},
    devices,
    online: session.online !== false,
    queue: [],
    conflicts: [],
    syncLog: [],
    route: 'till',
    sub: '',
    navOpen: session.navOpen != null ? session.navOpen : wide() >= 1280,
    narrow: wide() < 1080,
    tip: null,
    staffId: session.staffId || '',
    cafe: session.cafe || 'phillip',
    view: 'till',
    cat: 'coffee',
    q: '',
    filter: 'all',
    filtersOpen: false,
    lines: session.lines || [],
    type: session.type || 'takeaway',
    table: session.table || '',
    customerId: session.customerId || null,
    discount: session.discount || null,
    gift: session.gift || null,
    note: session.note || '',
    held: session.held || [],
    dlg: null,
    selOrder: null,
    orderChan: 'all',
    orderStatus: 'live',
    cartOpen: false,
    toast: null,
    ops: initialOps(),
  };
}

/** Device states and simulated connectivity are kept with the records in development so a reload keeps them. */
interface DevExtras {
  devices?: DeviceStates;
  conflicts?: PosState['conflicts'];
  syncLog?: PosState['syncLog'];
}

export function stateFromSnapshot(prev: PosState, snap: PosSnapshot & DevExtras, session: Partial<SessionState>): PosState {
  const menuById = Object.fromEntries(snap.menu.map((m) => [m.id, m]));
  const locations = snap.locations;
  const trading = locations.filter((l) => !l.tbc);
  const cafe = trading.some((l) => l.id === session.cafe)
    ? (session.cafe as string)
    : trading.find((l) => l.id === 'phillip')?.id || trading[0]?.id || '';
  // No valid signed-in staff member → '' and the till asks for a PIN before anything else.
  const staffId = snap.staff.some((x) => x.id === session.staffId) ? (session.staffId as string) : '';
  // Drop cart lines for items that are no longer on the menu.
  const lines = (session.lines || []).filter((l) => menuById[l.itemId]);
  const catOrder = [
    ...snap.settings.categoryOrder.filter((id) => snap.categories.some((c) => c.id === id)),
    ...snap.categories.map((c) => c.id).filter((id) => !snap.settings.categoryOrder.includes(id)),
  ];
  return {
    ...prev,
    phase: 'ready',
    catalog: {
      locations,
      categories: snap.categories,
      menu: snap.menu,
      menuById,
      cateringPackages: snap.cateringPackages,
      tables: snap.tables,
      promotions: snap.promotions,
    },
    reports: snap.reports,
    loyaltyCopy: snap.settings.loyaltyCopy,
    orders: snap.orders,
    customers: snap.customers,
    giftcards: snap.giftCards,
    reservations: snap.reservations,
    catering: snap.catering,
    staff: snap.staff,
    roles: sanitizeRoles(snap.roles),
    stock: snap.stock,
    stockLog: snap.stockLog,
    audit: snap.audit,
    shift: snap.currentShift,
    shifts: snap.closedShifts,
    soldOut: snap.availability.soldOut,
    branchOff: snap.availability.branchOff,
    unavailableMods: snap.availability.unavailableMods,
    availSync: snap.availability.lastPushedAt,
    prices: snap.availability.prices,
    catOrder,
    loy: snap.settings.loyalty,
    rules: snap.settings.rules,
    toggles: snap.settings.toggles,
    cafeFields: snap.settings.cafeFields,
    devices: snap.devices || prev.devices,
    conflicts: snap.conflicts || [],
    syncLog: snap.syncLog || [],
    cafe,
    staffId,
    lines,
  };
}

export function snapshotFromState(s: PosState): PosSnapshot & DevExtras {
  return {
    locations: s.catalog.locations,
    categories: s.catalog.categories,
    menu: s.catalog.menu,
    cateringPackages: s.catalog.cateringPackages,
    tables: s.catalog.tables,
    promotions: s.catalog.promotions,
    availability: {
      soldOut: s.soldOut,
      branchOff: s.branchOff,
      unavailableMods: s.unavailableMods,
      prices: s.prices,
      lastPushedAt: s.availSync,
    },
    stock: s.stock,
    stockLog: s.stockLog,
    orders: s.orders,
    customers: s.customers,
    giftCards: s.giftcards,
    reservations: s.reservations,
    catering: s.catering,
    staff: s.staff,
    roles: s.roles,
    settings: {
      loyalty: s.loy,
      loyaltyCopy: s.loyaltyCopy,
      rules: s.rules,
      toggles: s.toggles,
      cafeFields: s.cafeFields,
      categoryOrder: s.catOrder,
    },
    currentShift: s.shift,
    closedShifts: s.shifts,
    audit: s.audit,
    reports: s.reports as PosSnapshot['reports'],
    devices: s.devices,
    conflicts: s.conflicts,
    syncLog: s.syncLog,
  };
}
