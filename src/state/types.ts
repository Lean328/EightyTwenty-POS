// Application state for one till session.
import type { StationFilter } from '../domain/kitchen';
import type {
  AppliedGiftCard,
  AuditEntry,
  BusinessRuleKey,
  CashShift,
  CateringEnquiry,
  CateringPackage,
  ClosedShift,
  Customer,
  DeviceStates,
  Discount,
  GiftCard,
  HeldOrder,
  Location,
  LocationField,
  LoyaltyCopy,
  LoyaltySettings,
  MenuCategory,
  MenuItem,
  ModSelection,
  Order,
  OrderActionMode,
  OrderLine,
  OrderType,
  PaymentSplitMode,
  Permission,
  PromoCode,
  ReportsData,
  Reservation,
  RoleMatrix,
  StaffMember,
  StockItem,
  StockLogEntry,
  SyncConflict,
  SyncLogEntry,
  SyncQueueItem,
  Table,
  TillToggles,
} from '../domain/types';

export const SECTIONS = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  reservations: 'Reservations',
  catering: 'Catering',
  customers: 'Customers',
  loyalty: 'Loyalty',
  gift: 'Gift cards',
  inventory: 'Inventory & menu',
  reports: 'Reports',
  staff: 'Staff & roles',
  settings: 'Settings',
} as const;

export type SectionRoute = keyof typeof SECTIONS;
export type Route = 'till' | SectionRoute;
export type TillView = 'till' | 'orders' | 'tables' | 'kitchen' | 'held';
export type MenuFilter = 'all' | 'featured' | 'vegan' | 'gf' | 'df';

/** What this device is used for. Assigned by a manager and remembered on the device. */
export type DeviceMode = 'counter' | 'kitchen';

export interface DeviceSetup {
  mode: DeviceMode;
  /** Kitchen display: which station's items this screen shows. */
  station: StationFilter;
  /** Kitchen display: new-order sound off. */
  muted: boolean;
  /** Who assigned the mode, and when (ISO). Empty for a device never set up. */
  by: string;
  at: string;
}

export interface Catalog {
  locations: Location[];
  categories: MenuCategory[];
  menu: MenuItem[];
  menuById: Record<string, MenuItem>;
  cateringPackages: CateringPackage[];
  tables: Table[];
  promotions: PromoCode[];
}

// ---------- dialogs ----------

export interface ItemDialog {
  kind: 'item';
  itemId: string;
  sel: ModSelection;
  adjust: string[];
  note: string;
  qty: number;
  editKey: string | null;
}

export interface PayDialog {
  kind: 'pay';
  forOrderId?: string;
  method: 'cash' | 'card' | 'wallet' | 'gift';
  mode: PaymentSplitMode;
  /** Idempotency reference for the next tender. */
  key: string;
  n?: number;
  count?: number;
  sel?: Record<string, number>;
  amount?: string;
  tender?: string;
  tip?: number;
  gift?: { last4: string; balance: number } | null;
  giftCode?: string;
  status?: 'idle' | 'processing' | 'failed';
  err?: string;
  /** Development simulator only. */
  declineNext?: boolean;
}

export interface ShiftDialog {
  kind: 'shift';
  summary?: string;
  /** Payment dialog to return to after opening a shift. */
  back?: PayDialog;
  float?: string;
  err?: string;
  mode?: '' | 'in' | 'out' | 'close';
  amt?: string;
  reason?: string;
  counted?: string;
  note?: string;
}

export interface PinDialog {
  expectedStaffId?: string;
  kind: 'pin';
  pin: string;
  title: string;
  body: string;
  perm: Permission;
  next: (staff: StaffMember) => void;
  err?: string;
  verifying?: boolean;
  /** Sign-in at start: cannot be dismissed. */
  required?: boolean;
}

export interface OrderActionDialog {
  kind: 'ordact';
  orderId: string;
  mode: OrderActionMode;
  sel: Record<string, number>;
  by: 'items' | 'amount';
  amount: string;
  reason: string;
  key: string;
  err?: string;
}

export type Dialog =
  | ItemDialog
  | { kind: 'customer'; q: string }
  | { kind: 'discount'; tab: 'discount' | 'promo' | 'gift' | 'reward'; code?: string; custom?: string; msg?: string; ok?: boolean }
  | PayDialog
  | { kind: 'receipt'; orderId: string; loyalty: string; printState?: 'printed' | 'reprinted' | 'failed' }
  | ShiftDialog
  | OrderActionDialog
  | { kind: 'table'; tableId: string }
  | { kind: 'sync' }
  | PinDialog
  | { kind: 'note' }
  | { kind: 'cafe' }
  | { kind: 'tablePick' }
  | { kind: 'staff' };

export type DialogOf<K extends Dialog['kind']> = Extract<Dialog, { kind: K }>;

// ---------- back-office forms ----------

export interface FormValues {
  [key: string]: string | number | string[] | undefined;
}

export interface OpsForm {
  kind: 'res' | 'cat' | 'gift' | 'staff';
  id?: string | null;
  v: FormValues;
  err?: string;
  busy?: boolean;
}

/** UI state for the back-office sections. */
export interface OpsUi {
  /** Café scope filter: 'all' or a location id. */
  cafe: string;
  cafeMenu: boolean;
  selOrder: string | null;
  selCat: string | null;
  selCust: string | null;
  selGift: string | null;
  custQ: string;
  custFilter: string;
  custEdit: '' | 'note' | 'profile';
  custExpand: '' | 'orders' | 'res';
  orderFilter: string;
  orderSrc: 'pos' | 'web' | 'app';
  resDay: number;
  invTab: 'items' | 'cats' | 'mods';
  invCat: string;
  invQ: string;
  form: OpsForm | null;
  staffTab: 'team' | 'shifts' | 'activity';
  auditQ: string;
  auditF: string;
  stockSel: string | null;
  stockAmt: string;
  stockReason: string;
  giftAmt: string;
  repHover: number | null;
}

export interface PosState {
  phase: 'loading' | 'ready' | 'error';
  loadError: string;
  /** Set when the till started from its saved copy because the server could not be reached. */
  offlineSince: string | null;
  /** Order changes from the backend (http provider only): did the last fetch work, and when the last one that did (ISO). */
  orderFeed: { ok: boolean; at: string } | null;

  catalog: Catalog;
  reports: ReportsData | null;
  loyaltyCopy: LoyaltyCopy;

  // shared records
  orders: Order[];
  customers: Customer[];
  giftcards: GiftCard[];
  reservations: Reservation[];
  catering: CateringEnquiry[];
  staff: StaffMember[];
  roles: RoleMatrix;
  stock: StockItem[];
  stockLog: StockLogEntry[];
  audit: AuditEntry[];
  shift: CashShift | null;
  shifts: ClosedShift[];
  soldOut: string[];
  branchOff: Record<string, string[]>;
  unavailableMods: string[];
  availSync: string;
  prices: Record<string, number>;
  catOrder: string[];
  loy: LoyaltySettings;
  rules: Partial<Record<BusinessRuleKey, string>>;
  toggles: TillToggles;
  cafeFields: Record<string, Partial<Record<LocationField, string>>>;

  // devices & connectivity
  devices: DeviceStates;
  online: boolean;
  queue: SyncQueueItem[];
  conflicts: SyncConflict[];
  syncLog: SyncLogEntry[];

  // session (this device)
  device: DeviceSetup;
  route: Route;
  sub: string;
  navOpen: boolean;
  narrow: boolean;
  tip: { label: string; y: number } | null;
  staffId: string;
  cafe: string;
  view: TillView;
  cat: string;
  q: string;
  filter: MenuFilter;
  filtersOpen: boolean;
  lines: OrderLine[];
  type: OrderType;
  table: string;
  customerId: string | null;
  discount: Discount | null;
  gift: AppliedGiftCard | null;
  note: string;
  held: HeldOrder[];
  dlg: Dialog | null;
  selOrder: string | null;
  orderChan: 'all' | 'pos' | 'web' | 'app';
  orderStatus: 'live' | 'completed' | 'refunded' | 'cancelled' | 'all';
  cartOpen: boolean;
  toast: string | null;
  ops: OpsUi;
}

export type Patch = Partial<PosState>;
