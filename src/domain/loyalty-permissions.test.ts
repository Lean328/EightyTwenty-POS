import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLES, hasPermission } from './permissions';

describe('Loyalty permissions', () => {
  it('allows managers and cashiers to stamp', () => {
    expect(hasPermission(DEFAULT_ROLES.manager.perms, 'loyalty.stamp')).toBe(true);
    expect(hasPermission(DEFAULT_ROLES.cashier.perms, 'loyalty.stamp')).toBe(true);
  });

  it('includes stamping in loyalty management for saved roles', () => {
    expect(hasPermission(['loyalty'], 'loyalty.stamp')).toBe(true);
  });

  it('does not grant loyalty management to stamp-only staff', () => {
    expect(hasPermission(['loyalty.stamp'], 'loyalty')).toBe(false);
    expect(hasPermission([], 'loyalty.stamp')).toBe(false);
  });
});
