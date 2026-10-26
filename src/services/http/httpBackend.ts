import { withSessionRefresh } from './sessionHttpClient';
import { readJSON } from '../../lib/storage';
import { getAccessToken } from './authSession';
// HTTP adapter for EightyTwenty BOS.
// Core POS routes use the implemented Django API.
// Remaining proposed routes still require backend support.
import type { PosBackend, PosSnapshot } from '../contracts';
import { createHttpClient, type HttpClient } from './httpClient';

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
      adjust: (id, change, opts) => http.post(`/api/v1/pos/orders/${enc(id)}/adjustments`, change, opts),
      setTables: (id, tables, opts) => http.put(`/api/v1/pos/orders/${enc(id)}/tables`, tables, opts),
    },
    payments: {
      record: (orderId, payment, opts) => http.post(`/api/v1/pos/orders/${enc(orderId)}/payments`, payment, opts),
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
      issue: (req, opts) => http.post(`/gift-cards/v1`, req, opts),
      adjustBalance: (code, amount, reason, opts) =>
        http.post(`/gift-cards/v1/${enc(code.replace(/\s/g, ''))}/adjustments`, { amount, reason }, opts),
    },
    staffAuth: {
      verifyPin: async (pin, opts) => {
        const result = await http.post<
          | {
              staff: PosSnapshot['staff'][number];
              permissions: import('../../domain/types').Permission[];
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
