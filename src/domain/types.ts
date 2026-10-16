// Domain models for the EightyTwenty POS.
// These are the shapes the UI works with. Backend DTOs are mapped onto them in the service layer
// (src/services); nothing outside src/services should depend on transport formats.
//
// Money conventions:
//   - Order.total, OrderLine.price, GiftCard.balance, CateringEnquiry.quote: AUD dollars, GST inclusive,
//     always rounded to cents with r2().
//   - Payment / refund / shift / cash-movement amounts: integer cents.

export type Channel = 'pos' | 'web' | 'app';
export type RecordSource = Channel;
export type OrderType = 'dinein' | 'pickup' | 'takeaway' | 'delivery';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'refunded' | 'cancelled' | 'failed';
/** Preparation state of one order line on the kitchen display. */
export type PrepStatus = 'new' | 'preparing' | 'ready';
/** Where a line is prepared: food in the kitchen, drinks at the coffee / drinks bar. */
export type Station = 'kitchen' | 'bar';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'gift' | 'reward';
export type RoleId = 'cashier' | 'manager' | 'admin';
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type CateringStatus = 'enquiry' | 'quoted' | 'confirmed' | 'delivered' | 'cancelled';
export type FulfilMethod = 'delivery' | 'pickup';

// ---------- locations & catalogue ----------

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  /** Published hours string, e.g. "Mon–Sun 7:00am – 3:00pm". Parsed by domain/hours.ts. */
  hours: string;
  hoursShort: string;
  email: string;
  /** 100% gluten free café. */
  gf?: boolean;
  /** Listed but not trading yet — hidden from the till and booking. */
  tbc?: boolean;
}

/** Editable location fields shown in POS Settings. */
export type LocationField = 'name' | 'address' | 'phone' | 'hours' | 'email';

export interface MenuCategory {
  id: string;
  name: string;
  note?: string;
}

/** [label, surcharge in dollars] */
export type ModifierOption = [label: string, surcharge: number];

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  /** 1 = single choice, 0 = any number. */
  max: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  cat: string;
  name: string;
  /** AUD, GST inclusive. */
  price: number;
  /** Dietary labels (GF*, DF*, Vegan, Vegetarian…). */
  diet: string[];
  /** Photo path relative to the public folder, e.g. "img/menu-original/food/x.jpg". Empty = no photo. */
  img: string;
  desc: string;
  mods: ModifierGroup[];
  featured?: boolean;
  /** Preparation station. When absent it follows the category (see domain/kitchen.ts). */
  station?: Station;
}

export interface CateringPackage {
  id: string;
  /** AUD per person, GST inclusive. */
  pricePerPerson: number;
  unit: string;
  blurb: string;
  items: string[];
}

export interface PromoCode {
  code: string;
  kind: 'pct' | 'amt';
  value: number;
  label: string;
}

export interface Table {
  id: string;
  seats: number;
  zone: string;
}

// ---------- orders & payments ----------

/** Modifier group id → chosen option labels. */
export type ModSelection = Record<string, string[]>;

export interface OrderLine {
  key: string;
  itemId: string;
  name: string;
  /** Unit price incl. selected modifiers (dollars). */
  price: number;
  qty: number;
  sel: ModSelection;
  adjust: string[];
  note: string;
  /** Kitchen display progress for this line. Absent until the kitchen first changes the order (see domain/kitchen.ts). */
  prep?: PrepStatus;
}

export interface Payment {
  method: PaymentMethod;
  /** Cents applied to the order (excludes tip and surcharge). */
  amount: number;
  tip: number;
  surcharge: number;
  /** Idempotency reference — a retried terminal response with the same ref is never recorded twice. */
  ref: string;
  giftLast4?: string | null;
  at?: string;
  by?: string;
  mode?: PaymentSplitMode;
  /** Units paid, by line key, when splitting by item. */
  items?: Record<string, number>;
  cashPaid?: number;
  rounding?: number;
  change?: number;
}

export type PaymentSplitMode = 'full' | 'equal' | 'items' | 'amount';

export interface RefundAllocation {
  method: PaymentMethod;
  amount: number;
  ref: string;
  giftLast4: string | null;
}

export type OrderActionMode = 'cancel' | 'void' | 'refund';

/** A refund, void or cancellation applied to an order. */
export interface OrderAdjustment {
  key: string;
  mode: OrderActionMode;
  /** Cents returned to the customer. */
  amount: number;
  alloc: RefundAllocation[];
  reason: string;
  by: string;
  approver: string;
  at: string;
  items: Record<string, number>;
}

export interface HistoryEntry {
  at: string;
  what: string;
}

export interface Order {
  /** Human reference, e.g. "#8020-4471". */
  id: string;
  channel: Channel;
  type: OrderType;
  status: OrderStatus;
  /** false = online order waiting for the café to accept it. */
  accepted?: boolean;
  cafe: string;
  /** HH:MM, 24h, café local time. */
  time: string;
  /** ISO timestamp the order was placed, when known. Kitchen timers fall back to `time`. */
  placedAt?: string;
  table?: string;
  tables?: string[];
  customerId?: string;
  lines: OrderLine[];
  /** Dollars, GST inclusive. */
  total: number;
  paid: boolean;
  methods: PaymentMethod[];
  payments?: Payment[];
  note?: string;
  discounts?: { label: string; amount: number }[];
  rewardUsed?: boolean;
  staff?: string;
  /** Recorded while offline and not yet confirmed by the server. */
  queued?: boolean;
  history?: HistoryEntry[];
  refunds?: OrderAdjustment[];
  /** Reference from the website / app platform. */
  extRef?: string;
  docket?: 'printed' | 'failed';
  docketTries?: number;
  prints?: number;
  /** Loyalty stamps already awarded for this order. */
  stamped?: boolean;
  /** Table released after the guests left. */
  cleared?: boolean;
}

export interface Discount {
  kind: 'pct' | 'amt' | 'reward';
  value: number;
  label: string;
}

export interface AppliedGiftCard {
  last4: string;
  /** Dollars. */
  amount: number;
}

export interface HeldOrder {
  id: string;
  label: string;
  time: string;
  lines: OrderLine[];
  type: OrderType;
  table: string;
  customerId: string | null;
  note: string;
}

// ---------- guests ----------

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  stamps: number;
  rewards: number;
  homeCafe: string;
  dietary: string[];
  notes: string;
  since: string;
  /** Apple Wallet pass installed. */
  wallet: boolean;
  visits?: number;
  /** Lifetime spend, dollars. */
  spend?: number;
  lastDays?: number;
}

export interface Reservation {
  id: string;
  cafe: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  guests: number;
  name: string;
  phone: string;
  email?: string;
  notes: string;
  status: ReservationStatus;
  customerId?: string;
  table?: string;
  source?: RecordSource;
  extRef?: string;
  seating?: string;
  history?: HistoryEntry[];
}

export interface CateringEnquiry {
  id: string;
  packageId: string;
  guests: number;
  date: string;
  time: string;
  fulfil: FulfilMethod;
  address: string;
  cafe: string;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  occasion?: string;
  dietary: string[];
  notes: string;
  /** Dollars, GST inclusive estimate. */
  quote: number;
  status: CateringStatus;
  customerId?: string;
  source?: RecordSource;
  extRef?: string;
}

export interface GiftCardTxn {
  d: string;
  what: string;
  /** Dollars; negative = redeemed. */
  amt: number;
}

export interface GiftCard {
  /** 16-digit card number, displayed as last 4. */
  code: string;
  issued: number;
  balance: number;
  issuedOn: string;
  customerId: string | null;
  history: GiftCardTxn[];
}

export interface LoyaltySettings {
  /** Stamps needed for a free coffee. */
  per: number;
  wallet: boolean;
  online: boolean;
}

export interface LoyaltyCopy {
  reward: string;
  eligible: string;
}

// ---------- staff & access ----------

export type Permission =
  | '*'
  | 'pos'
  | 'orders'
  | 'orders.refund'
  | 'cash.out'
  | 'reservations'
  | 'reservations.view'
  | 'catering'
  | 'customers'
  | 'customers.view'
  | 'loyalty'
  | 'loyalty.stamp'
  | 'gift'
  | 'gift.redeem'
  | 'inventory'
  | 'reports'
  | 'staff'
  | 'staff.view'
  | 'settings'
  | 'settings.view'
  | 'kitchen'
  | 'devices';

export interface Role {
  label: string;
  perms: Permission[];
}

export type RoleMatrix = Record<RoleId, Role>;

/** Staff profile as seen by the POS. PINs are never part of this record — they are verified by the auth service. */
export interface StaffMember {
  id: string;
  name: string;
  initials: string;
  role: RoleId;
  cafe: string;
  shift: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  ts: number;
  staff: string;
  role: string;
  action: string;
  detail: string;
  reason: string;
  approver: string;
  /** Cents, signed; null when the action has no amount. */
  amount: number | null;
  area: string;
  cafe: string;
}

// ---------- cash ----------

export interface CashMove {
  id: string;
  type: 'in' | 'out';
  /** Cents. */
  amount: number;
  reason: string;
  by: string;
  approver: string;
  at: string;
}

export interface CashShift {
  id: string;
  cafe: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  /** All amounts in cents. */
  float: number;
  cashSales: number;
  cashRefunds: number;
  moves: CashMove[];
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  counted?: number;
  expected?: number;
  variance?: number;
  note?: string;
  approvedBy?: string;
}

export interface ClosedShift extends CashShift {
  status: 'closed';
  closedAt: string;
  closedBy: string;
  counted: number;
  expected: number;
  variance: number;
  note: string;
  approvedBy: string;
}

// ---------- inventory ----------

export type StockState = 'ok' | 'low' | 'out';

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  level: number;
  par: number;
}

export interface StockLogEntry {
  id: string;
  at: string;
  item: string;
  delta: number;
  unit: string;
  level: number;
  reason: string;
  by: string;
}

// ---------- devices & sync ----------

export type DeviceId = 'receipt' | 'kitchen' | 'drawer' | 'terminal';
export type DeviceState = 'online' | 'offline' | 'paper';
export type DeviceStates = Record<DeviceId, DeviceState>;

export interface SyncQueueItem {
  id: string;
  kind: 'order' | 'payment';
  orderId: string;
  label: string;
  at: string;
}

export interface SyncConflict {
  id: string;
  orderId: string;
  msg: string;
}

export interface SyncLogEntry {
  id: string;
  at: string;
  msg: string;
}

// ---------- settings ----------

export interface TillToggles {
  kitchen: boolean;
  receipt: boolean;
  tips: boolean;
  openDrawer: boolean;
  autoStamp: boolean;
}

export type BusinessRuleKey = 'gst' | 'surcharge' | 'delivery' | 'lead' | 'slot' | 'cutoff';

// ---------- reporting (read-only, owned by the backend) ----------

export interface ReportsData {
  /** Most recent day last; the last day may be a partial trading day. */
  days: { d: string; sales: number; orders: number; partial?: boolean }[];
  weeks: { w: string; sales: number }[];
  best: { itemId: string; qty: number; rev: number }[];
  payments: { m: string; pct: number; amt: number }[];
  channels: { c: string; pct: number }[];
  loyalty: { stamps: number; rewards: number; newMembers: number; walletPasses: number };
  reservations: { week: number; covers: number; noShow: number; avgParty: number };
  catering: { enquiries: number; confirmed: number; revenue: number };
  /** Comparison line under "Sales today" on the dashboard, e.g. "+8% vs last Friday". */
  salesTodayComparison: string;
  /** Comparison line under 7-day revenue, e.g. "+4.2% vs previous week". */
  weekComparison: string;
  /** Recent loyalty activity shown on the Loyalty page. */
  loyaltyActivity: { what: string; when: string }[];
}
