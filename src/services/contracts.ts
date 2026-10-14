// Service contracts between the POS and the shared EightyTwenty backend.
//
// The backend (shared with the website, mobile app, BOS and electronic invoicing) owns every record below.
// The POS never keeps its own database: it loads a working snapshot for one till, applies changes
// optimistically, and sends each change as an idempotent command (see services/outbox.ts).
//
// Implementations:
//   - services/http/httpBackend.ts  — HTTP adapter. Endpoint paths are PROPOSED and unverified; no backend exists yet.
//   - dev/localBackend.ts           — development-only, browser storage. Never a live service.
import type {
  AuditEntry,
  BusinessRuleKey,
  CashMove,
  CashShift,
  CateringEnquiry,
  CateringPackage,
  ClosedShift,
  Customer,
  GiftCard,
  Location,
  LocationField,
  LoyaltyCopy,
  LoyaltySettings,
  MenuCategory,
  MenuItem,
  Order,
  OrderAdjustment,
  OrderLine,
  OrderStatus,
  Payment,
  Permission,
  PromoCode,
  ReportsData,
  Reservation,
  RoleId,
  RoleMatrix,
  StaffMember,
  StockItem,
  StockLogEntry,
  Table,
  TillToggles,
} from '../domain/types';

export interface RequestOptions {
  signal?: AbortSignal;
  /** Sent as the Idempotency-Key header. The backend must treat a repeated key as the same request. */
  idempotencyKey?: string;
}

/** Everything one till needs to start trading. */
export interface PosSnapshot {
  locations: Location[];
  categories: MenuCategory[];
  menu: MenuItem[];
  cateringPackages: CateringPackage[];
  tables: Table[];
  promotions: PromoCode[];
  availability: CatalogAvailability;
  stock: StockItem[];
  stockLog: StockLogEntry[];
  orders: Order[];
  customers: Customer[];
  giftCards: GiftCard[];
  reservations: Reservation[];
  catering: CateringEnquiry[];
  staff: StaffMember[];
  roles: RoleMatrix;
  settings: PosSettings;
  currentShift: CashShift | null;
  closedShifts: ClosedShift[];
  audit: AuditEntry[];
  reports: ReportsData;
}

export interface CatalogAvailability {
  /** Sold out at every café. */
  soldOut: string[];
  /** Off the menu at a single café: cafe id → item ids. */
  branchOff: Record<string, string[]>;
  /** Modifier option labels switched off by a manager. */
  unavailableMods: string[];
  /** Manager price overrides: item id → AUD. */
  prices: Record<string, number>;
  /** When availability was last pushed to the app and website. */
  lastPushedAt: string;
}

export interface PosSettings {
  loyalty: LoyaltySettings;
  loyaltyCopy: LoyaltyCopy;
  rules: Partial<Record<BusinessRuleKey, string>>;
  toggles: TillToggles;
  /** Per-café overrides of published location details. */
  cafeFields: Record<string, Partial<Record<LocationField, string>>>;
  categoryOrder: string[];
}

// ---------- Orders & payments ----------

export interface OrdersService {
  /** Orders changed since `since` (ISO timestamp) for a café — used to pick up website and app orders. */
  listChanged(cafeId: string, since: string | null, opts?: RequestOptions): Promise<{ orders: Order[]; cursor: string }>;
  create(order: Order, opts?: RequestOptions): Promise<void>;
  setStatus(orderId: string, status: OrderStatus, note: string, opts?: RequestOptions): Promise<void>;
  accept(orderId: string, opts?: RequestOptions): Promise<void>;
  /** Refund, void or cancellation, with the order's resulting lines and total. */
  adjust(
    orderId: string,
    change: { adjustment: OrderAdjustment; lines: OrderLine[]; total: number; status: OrderStatus },
    opts?: RequestOptions,
  ): Promise<void>;
  setTables(orderId: string, tables: { table?: string; tables: string[]; cleared?: boolean }, opts?: RequestOptions): Promise<void>;
}

export interface PaymentsService {
  /** Record a tender already captured (cash, gift card, or an approved terminal transaction). Idempotent on payment.ref. */
  record(orderId: string, payment: Payment, opts?: RequestOptions): Promise<void>;
}

// ---------- Products, menu and availability ----------

export interface CatalogService {
  setSoldOut(itemId: string, soldOut: boolean, opts?: RequestOptions): Promise<void>;
  setBranchAvailability(cafeId: string, itemId: string, available: boolean, opts?: RequestOptions): Promise<void>;
  setPrice(itemId: string, price: number, opts?: RequestOptions): Promise<void>;
  setModifierAvailability(label: string, available: boolean, opts?: RequestOptions): Promise<void>;
  setCategoryOrder(categoryIds: string[], opts?: RequestOptions): Promise<void>;
  adjustStock(stockId: string, delta: number, reason: string, opts?: RequestOptions): Promise<void>;
}

// ---------- Customers and loyalty ----------

export interface CustomersService {
  update(customerId: string, patch: Partial<Omit<Customer, 'id' | 'stamps' | 'rewards'>>, opts?: RequestOptions): Promise<void>;
}

export interface LoyaltyService {
  /** Set a customer's card to the given balance. `reason` is recorded against the change (order id, manual stamp, redemption…). */
  setBalance(customerId: string, balance: { stamps: number; rewards: number }, reason: string, opts?: RequestOptions): Promise<void>;
  updateSettings(settings: LoyaltySettings, opts?: RequestOptions): Promise<void>;
}

// ---------- Reservations and catering ----------

export interface ReservationsService {
  upsert(reservation: Reservation, opts?: RequestOptions): Promise<void>;
}

export interface CateringService {
  upsert(enquiry: CateringEnquiry, opts?: RequestOptions): Promise<void>;
}

// ---------- Gift cards ----------

export interface IssueGiftCardRequest {
  /** Dollars, $10–$500. */
  amount: number;
  customerId: string | null;
  note: string;
  cafeId: string;
  /** Human label for the card history, e.g. "Phillip POS". */
  issuedAt: string;
}

export interface GiftCardsService {
  /** Issue a new card. The card number is assigned by the gift card provider, never by the till. */
  issue(req: IssueGiftCardRequest, opts?: RequestOptions): Promise<GiftCard>;
  /** Positive amount = top up / refund restored, negative = redeemed. Dollars. */
  adjustBalance(code: string, amount: number, reason: string, opts?: RequestOptions): Promise<void>;
}

// ---------- Staff authentication and permissions ----------

export interface PinVerification {
  staff: StaffMember;
  permissions: Permission[];
}

export interface StaffAuthService {
  /**
   * Verify a 4-digit PIN. Resolves null when the PIN is not recognised.
   * The backend must rate-limit attempts and return the permissions it will enforce for this staff member.
   */
  verifyPin(pin: string, opts?: RequestOptions): Promise<PinVerification | null>;
  createStaff(profile: Omit<StaffMember, 'id'>, pin: string, opts?: RequestOptions): Promise<StaffMember>;
  setRole(staffId: string, role: RoleId, opts?: RequestOptions): Promise<void>;
  setRoleMatrix(roles: RoleMatrix, opts?: RequestOptions): Promise<void>;
}

// ---------- Transactions, cash and invoicing records ----------

/** Immutable record of money moving, for the ledger and electronic invoicing. */
export interface TransactionRecord {
  kind: 'sale' | 'payment' | 'refund' | 'void' | 'cancel' | 'gift-issue' | 'cash-in' | 'cash-out';
  orderId?: string;
  cafeId: string;
  terminalId: string;
  /** Cents, GST inclusive; negative for money returned. */
  amountC: number;
  gstC: number;
  at: string;
  staff: string;
  reference: string;
}

export interface TransactionRecordsService {
  submit(record: TransactionRecord, opts?: RequestOptions): Promise<void>;
  appendAudit(entry: AuditEntry, opts?: RequestOptions): Promise<void>;
  openShift(shift: CashShift, opts?: RequestOptions): Promise<void>;
  recordCashMove(shiftId: string, move: CashMove, opts?: RequestOptions): Promise<void>;
  closeShift(shift: ClosedShift, opts?: RequestOptions): Promise<void>;
  /** Ask electronic invoicing to issue a tax invoice for a completed order. Not yet available. */
  requestTaxInvoice(orderId: string, recipient: { name: string; email: string; abn?: string }, opts?: RequestOptions): Promise<void>;
}

// ---------- Settings ----------

export interface SettingsService {
  update(patch: Partial<Omit<PosSettings, 'loyalty' | 'loyaltyCopy' | 'categoryOrder'>>, opts?: RequestOptions): Promise<void>;
}

/** The full backend surface the POS depends on. */
export interface PosBackend {
  readonly kind: 'local' | 'http';
  /** Development backend only: sample PINs shown under the PIN pad. */
  readonly pinHint?: string;
  loadSnapshot(opts?: RequestOptions): Promise<PosSnapshot>;
  orders: OrdersService;
  payments: PaymentsService;
  catalog: CatalogService;
  customers: CustomersService;
  loyalty: LoyaltyService;
  reservations: ReservationsService;
  catering: CateringService;
  giftCards: GiftCardsService;
  staffAuth: StaffAuthService;
  records: TransactionRecordsService;
  settings: SettingsService;
}
