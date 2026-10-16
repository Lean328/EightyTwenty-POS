// Commands the till sends to the backend. Each one is queued in the outbox with its own idempotency key,
// so a retry after a timeout can never double-charge, double-refund or duplicate an order.
import type {
  AuditEntry,
  CashMove,
  CashShift,
  CateringEnquiry,
  ClosedShift,
  Customer,
  LoyaltySettings,
  Order,
  OrderAdjustment,
  OrderLine,
  OrderStatus,
  Payment,
  PrepStatus,
  Reservation,
  RoleId,
  RoleMatrix,
} from '../domain/types';
import type { PosBackend, PosSettings, RequestOptions, TransactionRecord } from './contracts';

export type PosCommand =
  | { type: 'order.create'; order: Order }
  | { type: 'order.status'; orderId: string; status: OrderStatus; note: string }
  | { type: 'order.accept'; orderId: string }
  | { type: 'order.prep'; orderId: string; lines: { key: string; prep: PrepStatus }[]; status: OrderStatus; note: string }
  | { type: 'order.adjust'; orderId: string; adjustment: OrderAdjustment; lines: OrderLine[]; total: number; status: OrderStatus }
  | { type: 'order.tables'; orderId: string; table?: string; tables: string[]; cleared?: boolean }
  | { type: 'payment.record'; orderId: string; payment: Payment }
  | { type: 'catalog.soldOut'; itemId: string; soldOut: boolean }
  | { type: 'catalog.branch'; cafeId: string; itemId: string; available: boolean }
  | { type: 'catalog.price'; itemId: string; price: number }
  | { type: 'catalog.modifier'; label: string; available: boolean }
  | { type: 'catalog.categoryOrder'; ids: string[] }
  | { type: 'stock.adjust'; stockId: string; delta: number; reason: string }
  | { type: 'customer.update'; customerId: string; patch: Partial<Omit<Customer, 'id' | 'stamps' | 'rewards'>> }
  | { type: 'loyalty.balance'; customerId: string; stamps: number; rewards: number; reason: string }
  | { type: 'loyalty.settings'; settings: LoyaltySettings }
  | { type: 'reservation.upsert'; reservation: Reservation }
  | { type: 'catering.upsert'; enquiry: CateringEnquiry }
  | { type: 'giftcard.adjust'; code: string; amount: number; reason: string }
  | { type: 'shift.open'; shift: CashShift }
  | { type: 'shift.cashMove'; shiftId: string; move: CashMove }
  | { type: 'shift.close'; shift: ClosedShift }
  | { type: 'staff.role'; staffId: string; role: RoleId }
  | { type: 'staff.roleMatrix'; roles: RoleMatrix }
  | { type: 'audit.append'; entry: AuditEntry }
  | { type: 'transaction.record'; record: TransactionRecord }
  | { type: 'settings.update'; patch: Partial<Omit<PosSettings, 'loyalty' | 'loyaltyCopy' | 'categoryOrder'>> };

/** Send one command to the backend. Exhaustive: adding a command type without a route is a compile error. */
export function dispatchCommand(b: PosBackend, c: PosCommand, opts: RequestOptions): Promise<void> {
  switch (c.type) {
    case 'order.create':
      return b.orders.create(c.order, opts);
    case 'order.status':
      return b.orders.setStatus(c.orderId, c.status, c.note, opts);
    case 'order.accept':
      return b.orders.accept(c.orderId, opts);
    case 'order.prep':
      return b.orders.setPrep(c.orderId, { lines: c.lines, status: c.status, note: c.note }, opts);
    case 'order.adjust':
      return b.orders.adjust(c.orderId, { adjustment: c.adjustment, lines: c.lines, total: c.total, status: c.status }, opts);
    case 'order.tables':
      return b.orders.setTables(c.orderId, { table: c.table, tables: c.tables, cleared: c.cleared }, opts);
    case 'payment.record':
      return b.payments.record(c.orderId, c.payment, opts);
    case 'catalog.soldOut':
      return b.catalog.setSoldOut(c.itemId, c.soldOut, opts);
    case 'catalog.branch':
      return b.catalog.setBranchAvailability(c.cafeId, c.itemId, c.available, opts);
    case 'catalog.price':
      return b.catalog.setPrice(c.itemId, c.price, opts);
    case 'catalog.modifier':
      return b.catalog.setModifierAvailability(c.label, c.available, opts);
    case 'catalog.categoryOrder':
      return b.catalog.setCategoryOrder(c.ids, opts);
    case 'stock.adjust':
      return b.catalog.adjustStock(c.stockId, c.delta, c.reason, opts);
    case 'customer.update':
      return b.customers.update(c.customerId, c.patch, opts);
    case 'loyalty.balance':
      return b.loyalty.setBalance(c.customerId, { stamps: c.stamps, rewards: c.rewards }, c.reason, opts);
    case 'loyalty.settings':
      return b.loyalty.updateSettings(c.settings, opts);
    case 'reservation.upsert':
      return b.reservations.upsert(c.reservation, opts);
    case 'catering.upsert':
      return b.catering.upsert(c.enquiry, opts);
    case 'giftcard.adjust':
      return b.giftCards.adjustBalance(c.code, c.amount, c.reason, opts);
    case 'shift.open':
      return b.records.openShift(c.shift, opts);
    case 'shift.cashMove':
      return b.records.recordCashMove(c.shiftId, c.move, opts);
    case 'shift.close':
      return b.records.closeShift(c.shift, opts);
    case 'staff.role':
      return b.staffAuth.setRole(c.staffId, c.role, opts);
    case 'staff.roleMatrix':
      return b.staffAuth.setRoleMatrix(c.roles, opts);
    case 'audit.append':
      return b.records.appendAudit(c.entry, opts);
    case 'transaction.record':
      return b.records.submit(c.record, opts);
    case 'settings.update':
      return b.settings.update(c.patch, opts);
  }
}
