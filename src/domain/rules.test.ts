import { describe, expect, it } from 'vitest';
import { fmt, fmtHM, hoursFor, slots } from './hours';
import { addStamps, rewardValue, stampsFor } from './loyalty';
import { DEFAULT_ROLES, hasPermission, sanitizeRoles } from './permissions';
import { isLive, stockState, tablesOf } from './policies';
import type { Location, MenuItem, RoleMatrix } from './types';

const menu = {
  flat: { id: 'flat', cat: 'coffee' },
  toast: { id: 'toast', cat: 'allday' },
} as unknown as Record<string, MenuItem>;

describe('loyalty', () => {
  it('stamps one per coffee unit', () => {
    expect(
      stampsFor(
        [
          { itemId: 'flat', qty: 2 },
          { itemId: 'toast', qty: 1 },
        ],
        menu,
      ),
    ).toBe(2);
  });
  it('rolls stamps into rewards at the configured threshold', () => {
    expect(addStamps({ stamps: 8, rewards: 0 }, 3)).toEqual({ stamps: 2, rewards: 1 });
    expect(addStamps({ stamps: 8, rewards: 0 }, 3, 10)).toEqual({ stamps: 1, rewards: 1 });
    expect(addStamps({ stamps: 0, rewards: 0 }, 19)).toEqual({ stamps: 1, rewards: 2 });
  });
  it('values a reward at the cheapest eligible item', () => {
    expect(
      rewardValue(
        [
          { itemId: 'flat', price: 5.5 },
          { itemId: 'flat', price: 5 },
          { itemId: 'toast', price: 3 },
        ],
        menu,
      ),
    ).toBe(5);
    expect(rewardValue([{ itemId: 'toast', price: 3 }], menu)).toBe(0);
  });
});

describe('opening hours', () => {
  const phillip = { id: 'phillip', name: 'Phillip', hours: 'Mon–Sun 7:00am – 3:00pm' } as Location;
  const civic = { id: 'civic', name: 'Civic', hours: 'Mon–Fri 7:00am – 3:00pm · Sat–Sun closed' } as Location;
  it('parses published hours and weekday-only cafés', () => {
    expect(hoursFor(phillip, 0)).toEqual({ open: 420, close: 900 });
    expect(hoursFor(civic, 6)).toBeNull();
    expect(hoursFor(civic, 1)).toEqual({ open: 420, close: 900 });
    expect(hoursFor({ ...phillip, tbc: true }, 1)).toBeNull();
  });
  it('builds 30-minute slots until 30 minutes before close with capacity', () => {
    const s = slots(phillip, new Date('2026-10-12T00:00'), { '07:30': 16, '08:00': 10 }, 16, new Date(0));
    expect(s[0]).toMatchObject({ time: '07:00', label: '7:00am', available: true });
    expect(s.at(-1)?.time).toBe('14:30');
    expect(s.find((x) => x.time === '07:30')).toMatchObject({ available: false, reason: 'Full', left: 0 });
    expect(s.find((x) => x.time === '08:00')).toMatchObject({ available: true, left: 6 });
  });
  it('formats times', () => {
    expect(fmt(0)).toBe('12:00am');
    expect(fmtHM('13:05')).toBe('1:05pm');
  });
});

describe('permissions', () => {
  it('checks wildcard and explicit grants', () => {
    expect(hasPermission(['*'], 'settings')).toBe(true);
    expect(hasPermission(DEFAULT_ROLES.cashier.perms, 'orders.refund')).toBe(false);
    expect(hasPermission(DEFAULT_ROLES.manager.perms, 'orders.refund')).toBe(true);
  });
  it('drops unknown grants (e.g. retired CMS permissions) and keeps admin unrestricted', () => {
    const stored = {
      cashier: { label: 'x', perms: ['pos', 'cms.publish'] },
      manager: { label: 'Manager', perms: ['reports'] },
      admin: { label: 'Admin', perms: [] },
    } as unknown as RoleMatrix;
    const r = sanitizeRoles(stored);
    expect(r.cashier).toEqual({ label: 'Cashier', perms: ['pos'] });
    expect(r.admin.perms).toEqual(['*']);
  });
});

describe('policies', () => {
  it('classifies stock levels', () => {
    expect(stockState({ level: 0, par: 10 })).toBe('out');
    expect(stockState({ level: 4, par: 10 })).toBe('low');
    expect(stockState({ level: 5, par: 10 })).toBe('ok');
  });
  it('treats failed online orders as live but de-duplicates joined tables', () => {
    expect(isLive({ status: 'failed' })).toBe(true);
    expect(isLive({ status: 'completed' })).toBe(false);
    expect(tablesOf({ table: 'T4', tables: ['T4', 'T5'] })).toEqual(['T4', 'T5']);
  });
});
