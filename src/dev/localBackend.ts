// DEVELOPMENT-ONLY backend: keeps everything in this browser's storage, seeded with sample data.
// It is not a live service — nothing leaves the device, no payment is taken and no other system sees changes.
// Selected with VITE_DATA_PROVIDER=local (the default for `npm run dev`).
import type { StaffMember } from '../domain/types';
import type { PosBackend, PosSnapshot } from '../services/contracts';
import { ApiError } from '../services/http/httpClient';
import { readCachedSnapshot } from '../services/recordCache';
import { readJSON, writeJSON } from '../lib/storage';
import { shortDate, uid } from '../lib/ids';
import { DEFAULT_ROLES, sanitizeRoles } from '../domain/permissions';
import { CATEGORIES, MENU } from './seed/menu';
import { CATERING_PACKAGES, LOCATIONS, PROMOS, TABLES } from './seed/locations';
import {
  BRANCH_OFF,
  CATERING_ENQUIRIES,
  CUSTOMERS,
  DEV_STAFF_PINS,
  GIFT_CARDS,
  LOYALTY_COPY,
  ORDERS,
  REPORTS,
  RESERVATIONS,
  SOLD_OUT,
  STAFF,
  STOCK,
} from './seed/records';

const PINS_KEY = 'dev-pins';
const STAFF_KEY = 'dev-staff';
const ok = async (): Promise<void> => {};

export function seedSnapshot(): PosSnapshot {
  return {
    locations: LOCATIONS,
    categories: CATEGORIES,
    menu: MENU,
    cateringPackages: CATERING_PACKAGES,
    tables: TABLES,
    promotions: PROMOS,
    availability: { soldOut: SOLD_OUT, branchOff: BRANCH_OFF, unavailableMods: [], prices: {}, lastPushedAt: '' },
    stock: STOCK,
    stockLog: [],
    orders: ORDERS,
    customers: CUSTOMERS,
    giftCards: GIFT_CARDS,
    reservations: RESERVATIONS(),
    catering: CATERING_ENQUIRIES(),
    staff: STAFF,
    roles: DEFAULT_ROLES,
    settings: {
      loyalty: { per: 9, wallet: true, online: true },
      loyaltyCopy: LOYALTY_COPY,
      rules: {},
      toggles: { kitchen: true, receipt: false, tips: false, openDrawer: true, autoStamp: true },
      cafeFields: {},
      categoryOrder: CATEGORIES.map((c) => c.id),
    },
    currentShift: null,
    closedShifts: [],
    audit: [],
    reports: REPORTS,
  };
}

const pins = (): Record<string, string> => ({ ...DEV_STAFF_PINS, ...readJSON<Record<string, string>>(PINS_KEY, {}) });

export function createLocalBackend(): PosBackend {
  const current = () => readCachedSnapshot()?.snapshot ?? seedSnapshot();
  return {
    kind: 'local',
    pinHint: 'Demo PINs · Admin 2468 · Manager 1357 · Cashier 1111',
    loadSnapshot: async () => {
      const snap = current();
      // Reference data always comes from the approved snapshot so menu updates in development show up.
      return {
        ...snap,
        locations: LOCATIONS,
        categories: CATEGORIES,
        menu: MENU,
        cateringPackages: CATERING_PACKAGES,
        tables: TABLES,
        promotions: PROMOS,
        reports: REPORTS,
      };
    },
    orders: { listChanged: async () => ({ orders: [], cursor: '' }), create: ok, setStatus: ok, accept: ok, adjust: ok, setTables: ok },
    payments: { record: ok },
    catalog: {
      setSoldOut: ok,
      setBranchAvailability: ok,
      setPrice: ok,
      setModifierAvailability: ok,
      setCategoryOrder: ok,
      adjustStock: ok,
    },
    customers: { update: ok },
    loyalty: { setBalance: ok, updateSettings: ok },
    reservations: { upsert: ok },
    catering: { upsert: ok },
    giftCards: {
      // Development card numbers only — real numbers come from the gift card provider.
      issue: async (req) => {
        const digits = () => String(1000 + (crypto.getRandomValues(new Uint16Array(1))[0] % 9000));
        return {
          code: '6011 2000 ' + digits() + ' ' + digits(),
          issued: req.amount,
          balance: req.amount,
          issuedOn: shortDate(),
          customerId: req.customerId,
          history: [{ d: 'Today', what: `Issued · ${req.issuedAt}`, amt: req.amount }],
        };
      },
      adjustBalance: ok,
    },
    staffAuth: {
      verifyPin: async (pin) => {
        const snap = current();
        const id = Object.entries(pins()).find(([, p]) => p === pin)?.[0];
        const staff = id ? [...snap.staff, ...readJSON<StaffMember[]>(STAFF_KEY, [])].find((s) => s.id === id) : undefined;
        if (!staff) return null;
        return { staff, permissions: sanitizeRoles(snap.roles)[staff.role].perms };
      },
      createStaff: async (profile, pin) => {
        if (Object.values(pins()).includes(pin)) throw new ApiError('conflict', 'That PIN is already in use.', 409, 'pin_in_use');
        const staff = { ...profile, id: uid('s', 6) };
        writeJSON(PINS_KEY, { ...readJSON<Record<string, string>>(PINS_KEY, {}), [staff.id]: pin });
        writeJSON(STAFF_KEY, [...readJSON<StaffMember[]>(STAFF_KEY, []), staff]);
        return staff;
      },
      setRole: ok,
      setRoleMatrix: ok,
    },
    records: {
      submit: ok,
      appendAudit: ok,
      openShift: ok,
      recordCashMove: ok,
      closeShift: ok,
      requestTaxInvoice: async () => {
        throw new ApiError('validation', 'Electronic invoicing is not connected in development.', 400, 'not_connected');
      },
    },
    settings: { update: ok },
  };
}
