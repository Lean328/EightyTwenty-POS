// Role-based permissions. The POS checks these to shape the UI and to ask for a manager PIN;
// the backend must enforce the same rules on every request (see services/contracts.ts → StaffAuthService).
import type { Permission, RoleId, RoleMatrix } from './types';

export const ROLE_IDS: RoleId[] = ['cashier', 'manager', 'admin'];

export const DEFAULT_ROLES: RoleMatrix = {
  cashier: {
    label: 'Cashier',
    perms: ['pos', 'orders', 'reservations.view', 'customers.view', 'loyalty.stamp', 'gift.redeem', 'kitchen'],
  },
  manager: {
    label: 'Manager',
    perms: [
      'pos',
      'orders',
      'orders.refund',
      'cash.out',
      'reservations',
      'catering',
      'customers',
      'loyalty',
      'loyalty.stamp',
      'gift',
      'inventory',
      'reports',
      'staff.view',
      'settings.view',
      'kitchen',
      'devices',
    ],
  },
  admin: { label: 'Admin', perms: ['*'] },
};

/** Editable permissions shown in Staff & roles, in display order. */
export const PERMISSIONS: [Permission, string][] = [
  ['pos', 'Take orders on the till'],
  ['orders.refund', 'Refund, void or cancel paid orders'],
  ['cash.out', 'Cash out & approve drawer variance'],
  ['reservations', 'Manage reservations'],
  ['catering', 'Manage catering'],
  ['customers', 'Edit customers'],
  ['loyalty', 'Adjust stamps & rewards'],
  ['gift', 'Issue gift cards'],
  ['inventory', 'Edit menu, prices & stock'],
  ['reports', 'View reports'],
  ['staff', 'Manage staff & roles'],
  ['settings', 'Change settings'],
  ['kitchen', 'Use the kitchen display'],
  ['devices', 'Set this device to front counter or kitchen display'],
];

const KNOWN = new Set<string>([
  '*',
  'orders',
  'reservations.view',
  'customers.view',
  'loyalty.stamp',
  'gift.redeem',
  'staff.view',
  'settings.view',
  ...PERMISSIONS.map(([p]) => p),
]);

export const hasPermission = (perms: readonly Permission[], perm: Permission): boolean =>
  perms.includes('*') || perms.includes(perm) || (perm === 'loyalty.stamp' && perms.includes('loyalty'));

/** Drop permissions this POS does not know about (e.g. retired CMS grants in stored role data). */
export function sanitizeRoles(roles: RoleMatrix | null | undefined): RoleMatrix {
  const src = roles || DEFAULT_ROLES;
  const out = {} as RoleMatrix;
  for (const id of ROLE_IDS) {
    const r = src[id] || DEFAULT_ROLES[id];
    out[id] = { label: DEFAULT_ROLES[id].label, perms: (r.perms || []).filter((p) => KNOWN.has(p)) };
  }
  // Admin is always full access and cannot be edited.
  out.admin = { ...DEFAULT_ROLES.admin };
  return out;
}

/** Sections that need a permission; any listed permission grants access. */
export const SECTION_GATES: Partial<Record<string, Permission[]>> = {
  dashboard: ['reports'],
  catering: ['catering'],
  inventory: ['inventory'],
  reports: ['reports'],
  staff: ['staff', 'staff.view'],
  settings: ['settings', 'settings.view'],
};
