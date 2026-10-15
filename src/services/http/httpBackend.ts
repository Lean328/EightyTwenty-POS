// HTTP adapter for the shared EightyTwenty backend.
//
// STATUS: PROPOSED CONTRACT — NOT CONNECTED. No backend exists yet. Every path below is a proposal for the
// backend team to confirm or replace; nothing here has been tested against a real server. Keep all paths in
// this one file so the mapping can be updated in a single place once the API is published.
import type { PosBackend, PosSnapshot } from '../contracts';
import { createHttpClient, type HttpClient } from './httpClient';

const enc = encodeURIComponent;

export function createHttpBackend(http: HttpClient): PosBackend {
  return {
    kind: 'http',
    loadSnapshot: (opts) => http.get<PosSnapshot>('/pos/v1/snapshot', opts),
    orders: {
      listChanged: (cafeId, since, opts) => http.get(`/pos/v1/orders?cafe=${enc(cafeId)}${since ? `&since=${enc(since)}` : ''}`, opts),
      create: (order, opts) => http.post(`/pos/v1/orders`, order, opts),
      setStatus: (id, status, note, opts) => http.post(`/pos/v1/orders/${enc(id)}/status`, { status, note }, opts),
      accept: (id, opts) => http.post(`/pos/v1/orders/${enc(id)}/accept`, {}, opts),
      setPrep: (id, change, opts) => http.put(`/pos/v1/orders/${enc(id)}/preparation`, change, opts),
      adjust: (id, change, opts) => http.post(`/pos/v1/orders/${enc(id)}/adjustments`, change, opts),
      setTables: (id, tables, opts) => http.put(`/pos/v1/orders/${enc(id)}/tables`, tables, opts),
    },
    payments: {
      record: (orderId, payment, opts) => http.post(`/pos/v1/orders/${enc(orderId)}/payments`, payment, opts),
    },
    catalog: {
      setSoldOut: (itemId, soldOut, opts) => http.put(`/catalog/v1/items/${enc(itemId)}/sold-out`, { soldOut }, opts),
      setBranchAvailability: (cafeId, itemId, available, opts) =>
        http.put(`/catalog/v1/locations/${enc(cafeId)}/items/${enc(itemId)}/availability`, { available }, opts),
      setPrice: (itemId, price, opts) => http.put(`/catalog/v1/items/${enc(itemId)}/price`, { price }, opts),
      setModifierAvailability: (label, available, opts) => http.put(`/catalog/v1/modifiers/availability`, { label, available }, opts),
      setCategoryOrder: (ids, opts) => http.put(`/catalog/v1/categories/order`, { ids }, opts),
      adjustStock: (stockId, delta, reason, opts) => http.post(`/inventory/v1/stock/${enc(stockId)}/adjustments`, { delta, reason }, opts),
    },
    customers: {
      update: (id, patch, opts) => http.put(`/customers/v1/${enc(id)}`, patch, opts),
    },
    loyalty: {
      setBalance: (id, balance, reason, opts) => http.put(`/loyalty/v1/customers/${enc(id)}/balance`, { ...balance, reason }, opts),
      updateSettings: (settings, opts) => http.put(`/loyalty/v1/settings`, settings, opts),
    },
    reservations: {
      upsert: (r, opts) => http.put(`/reservations/v1/${enc(r.id)}`, r, opts),
    },
    catering: {
      upsert: (c, opts) => http.put(`/catering/v1/enquiries/${enc(c.id)}`, c, opts),
    },
    giftCards: {
      issue: (req, opts) => http.post(`/gift-cards/v1`, req, opts),
      adjustBalance: (code, amount, reason, opts) =>
        http.post(`/gift-cards/v1/${enc(code.replace(/\s/g, ''))}/adjustments`, { amount, reason }, opts),
    },
    staffAuth: {
      verifyPin: (pin, opts) => http.post(`/auth/v1/pin`, { pin }, opts),
      createStaff: (profile, pin, opts) => http.post(`/staff/v1`, { ...profile, pin }, opts),
      setRole: (staffId, role, opts) => http.put(`/staff/v1/${enc(staffId)}/role`, { role }, opts),
      setRoleMatrix: (roles, opts) => http.put(`/staff/v1/roles`, roles, opts),
    },
    records: {
      submit: (record, opts) => http.post(`/ledger/v1/transactions`, record, opts),
      appendAudit: (entry, opts) => http.post(`/ledger/v1/audit`, entry, opts),
      openShift: (shift, opts) => http.post(`/ledger/v1/shifts`, shift, opts),
      recordCashMove: (shiftId, move, opts) => http.post(`/ledger/v1/shifts/${enc(shiftId)}/moves`, move, opts),
      closeShift: (shift, opts) => http.put(`/ledger/v1/shifts/${enc(shift.id)}`, shift, opts),
      requestTaxInvoice: (orderId, recipient, opts) => http.post(`/invoicing/v1/invoices`, { orderId, recipient }, opts),
    },
    settings: {
      update: (patch, opts) => http.put(`/pos/v1/settings`, patch, opts),
    },
  };
}

export function createHttpBackendFromConfig(c: { apiBaseUrl: string; apiTimeoutMs: number; terminalId: string }): PosBackend {
  return createHttpBackend(createHttpClient({ baseUrl: c.apiBaseUrl, timeoutMs: c.apiTimeoutMs, terminalId: c.terminalId }));
}
