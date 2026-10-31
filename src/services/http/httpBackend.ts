import { withSessionRefresh } from './sessionHttpClient';
import { readJSON } from '../../lib/storage';
import { getAccessToken } from './authSession';
// HTTP adapter for EightyTwenty BOS.
// Core POS routes use the implemented Django API.
// Remaining proposed routes still require backend support.
import type { GiftCardBalance, PosBackend, PosSnapshot } from '../contracts';
import { ApiError, createHttpClient, type HttpClient } from './httpClient';
import type { Order, Permission } from '../../domain/types';

const enc = encodeURIComponent;

export function createHttpBackend(http: HttpClient): PosBackend {
  return {
    kind: 'http',
    loadSnapshot: (opts) =>
      http.get<PosSnapshot>(`/api/v1/pos/snapshot?cafe=${enc(readJSON<{ cafe?: string }>('session', {}).cafe || '')}`, opts),
    orders: {
      listChanged: (cafeId, since, opts) => http.get(`/api/v1/pos/orders?cafe=${enc(cafeId)}${since ? `&since=${enc(since)}` : ''}`, opts),
      create: (order, opts) => http.post(`/api/v1/pos/orders`, order, opts),
      setStatus: (id, status, note, opts) => http.post(`/api/v1/pos/orders/${enc(id)}/status`, { status, note }, opts),
      accept: (id, opts) => http.post(`/api/v1/pos/orders/${enc(id)}/accept`, {}, opts),
      setPrep: (id, change, opts) => http.put(`/api/v1/pos/orders/${enc(id)}/preparation`, change, opts),
      adjust: async (id, change, opts) => {
        const result = await http.post<Order>(`/api/v1/pos/orders/${enc(id)}/adjustments`, change, opts);
        if (change.adjustment.alloc.some((row) => row.method === 'gift') &&
          (!result || result.id !== id || typeof result.paid !== 'boolean' || !Array.isArray(result.lines) || !Array.isArray(result.payments) || !Array.isArray(result.refunds) || !result.refunds.some((row) => row.key === change.adjustment.key))) {
          throw new ApiError('server', 'Gift refund confirmation could not be verified. Check Sync before trying another refund.');
        }
        return result;
      },
      setTables: (id, tables, opts) => http.put(`/api/v1/pos/orders/${enc(id)}/tables`, tables, opts),
    },
    payments: {
      record: async (orderId, payment, opts) => {
        const result = await http.post<Order>(`/api/v1/pos/orders/${enc(orderId)}/payments`, payment, opts);
        if (payment.method === 'gift' && (!result || result.id !== orderId || typeof result.paid !== 'boolean' || !Number.isFinite(result.total) || !Array.isArray(result.lines) || !Array.isArray(result.payments) ||
          !result.payments.some((row) => row.ref === payment.ref && row.method === 'gift' && row.amount === payment.amount && row.giftCardId === payment.giftCardId))) {
          throw new ApiError('server', 'Gift payment confirmation could not be verified. Retry the same pending payment through Sync.');
        }
        return result;
      },
    },
    catalog: {
      setSoldOut: (itemId, soldOut, opts) => http.put(`/api/v1/pos/items/${enc(itemId)}/sold-out`, { soldOut }, opts),
      setBranchAvailability: (cafeId, itemId, available, opts) =>
        http.put(`/api/v1/pos/locations/${enc(cafeId)}/items/${enc(itemId)}/availability`, { available }, opts),
      setPrice: (itemId, price, opts) =>
        http.put(
          `/api/v1/pos/locations/${enc(readJSON<{ cafe: string }>('session', { cafe: '' }).cafe)}/items/${enc(itemId)}/price`,
          { price },
          opts,
        ),
      setModifierAvailability: (label, available, opts) =>
        http.put(
          `/api/v1/pos/locations/${enc(readJSON<{ cafe: string }>('session', { cafe: '' }).cafe)}/modifiers/availability`,
          { label, available },
          opts,
        ),
      setCategoryOrder: (ids, opts) =>
        http.put(`/api/v1/pos/locations/${enc(readJSON<{ cafe: string }>('session', { cafe: '' }).cafe)}/categories/order`, { ids }, opts),
      adjustStock: (stockId, delta, reason, opts) => http.post(`/inventory/v1/stock/${enc(stockId)}/adjustments`, { delta, reason }, opts),
    },
    customers: {
      update: (id, patch, opts) => http.put(`/api/v1/pos/customers/${enc(id)}`, patch, opts),
    },
    loyalty: {
      getBalance: (id, opts) => http.get(`/api/v1/pos/customers/${enc(id)}/loyalty`, opts),
      applyAction: (id, cafe, action, opts) => http.post(`/api/v1/pos/customers/${enc(id)}/loyalty/actions`, { cafe, action }, opts),
      setBalance: (id, balance, reason, opts) => http.put(`/api/v1/pos/customers/${enc(id)}/loyalty`, { ...balance, reason }, opts),
      updateSettings: (settings, opts) => http.put(`/loyalty/v1/settings`, settings, opts),
    },
    reservations: {
      upsert: (r, opts) => http.put(`/api/v1/pos/reservations/${enc(r.id)}`, r, opts),
    },
    catering: {
      upsert: (c, opts) => http.put(`/api/v1/pos/catering/${enc(c.id)}`, c, opts),
    },
    giftCards: {
      getBalance: async (customerId, opts) => {
        const result = await http.get<GiftCardBalance>(`/api/v1/pos/customers/${enc(customerId)}/gift-card`, opts);
        if (!result || typeof result.id !== 'string' || !result.id || typeof result.last4 !== 'string' || result.customerId !== customerId || !/^\d{4}$/.test(result.last4) ||
          !Number.isSafeInteger(result.balance) || result.balance < 0) {
          throw new ApiError('server', 'The gift card balance could not be verified.');
        }
        return result;
      },
      issue: async () => {
        throw new ApiError('validation', 'Issue gift cards in BOS.');
      },
      adjustBalance: async () => {
        throw new ApiError('validation', 'Top up in BOS. Redeem through Payment; refund through the original order.');
      },
    },
    staffAuth: {
      verifyPin: async (pin, opts) => {
        const result = await http.post<
          | {
              staff: PosSnapshot['staff'][number];
              permissions: Permission[];
            }
          | undefined
        >('/api/v1/pos/staff/verify-pin', { pin }, opts);

        if (!result) return null;
        if (opts?.expectedStaffId && result.staff.id !== opts.expectedStaffId) {
          return null;
        }
        return result;
      },
      createStaff: (profile, pin, opts) => http.post(`/staff/v1`, { ...profile, pin }, opts),
      setRole: (staffId, role, opts) => http.put(`/staff/v1/${enc(staffId)}/role`, { role }, opts),
      setRoleMatrix: (roles, opts) => http.put(`/staff/v1/roles`, roles, opts),
    },
    records: {
      submit: (record, opts) => http.post(`/api/v1/pos/transactions`, record, opts),
      appendAudit: (entry, opts) => http.post(`/api/v1/pos/audit`, entry, opts),
      openShift: (shift, opts) => http.post(`/api/v1/pos/shifts`, shift, opts),
      recordCashMove: (shiftId, move, opts) => http.post(`/api/v1/pos/shifts/${enc(shiftId)}/moves`, move, opts),
      closeShift: (shift, opts) => http.put(`/api/v1/pos/shifts/${enc(shift.id)}`, shift, opts),
      requestTaxInvoice: (orderId, recipient, opts) => http.post(`/invoicing/v1/invoices`, { orderId, recipient }, opts),
    },
    settings: {
      update: (patch, opts) =>
        http.put(`/api/v1/pos/locations/${enc(readJSON<{ cafe: string }>('session', { cafe: '' }).cafe)}/settings/toggles`, patch, opts),
    },
  };
}

export function createHttpBackendFromConfig(c: { apiBaseUrl: string; apiTimeoutMs: number; terminalId: string }): PosBackend {
  const client = createHttpClient({
    baseUrl: c.apiBaseUrl,
    timeoutMs: c.apiTimeoutMs,
    terminalId: c.terminalId,
    getAccessToken,
  });
  return createHttpBackend(withSessionRefresh(client, c.apiBaseUrl));
}
