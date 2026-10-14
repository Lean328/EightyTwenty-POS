import type { ChangeEvent } from 'react';
import { fmtC, shiftExpectedC, VARIANCE_LIMIT_C } from '../../domain/ledger';
import { PERMISSIONS, ROLE_IDS } from '../../domain/permissions';
import type { AuditEntry, Permission, RoleId } from '../../domain/types';
import type { PosStore } from '../../state/store';
import type { OpsUi } from '../../state/types';
import { gate, scope, sel, tab } from './common';

const areaOf = (e: AuditEntry) =>
  /refund|void|cancel/i.test(e.action)
    ? 'refunds'
    : /discount/i.test(e.action)
      ? 'discounts'
      : e.area === 'Cash'
        ? 'cash'
        : e.area === 'Inventory'
          ? 'inventory'
          : /role|access|pin|staff/i.test(e.action)
            ? 'access'
            : 'other';

export function buildStaff(store: PosStore) {
  const s = store.state,
    o = s.ops,
    { cafeName } = scope(store);
  const roles = store.roles();
  const stab = o.staffTab || 'team';
  const tabDefs: [OpsUi['staffTab'], string][] = [
    ['team', 'Team & permissions'],
    ['shifts', 'Shifts & cash'],
    ['activity', 'Activity log'],
  ];
  const sh = s.shift;
  const AQ = (o.auditQ || '').toLowerCase(),
    AF = o.auditF || 'all';
  const filterDefs: [string, string][] = [
    ['all', 'All'],
    ['refunds', 'Refunds & voids'],
    ['discounts', 'Discounts'],
    ['cash', 'Cash'],
    ['inventory', 'Inventory'],
    ['access', 'Access'],
  ];
  const auditRows = (s.audit || [])
    .filter(
      (e) =>
        (AF === 'all' || areaOf(e) === AF) &&
        (!AQ || [e.action, e.detail, e.staff, e.reason, e.approver].join(' ').toLowerCase().includes(AQ)),
    )
    .slice(0, 150)
    .map((e) => ({
      id: e.id,
      at: e.at,
      action: e.action,
      detail: e.detail,
      who: `${e.staff} · ${e.role}`,
      reason: e.reason,
      approver: e.approver ? 'Approved by ' + e.approver : '',
      amtS: e.amount == null ? '' : fmtC(e.amount),
      amtFg: e.amount != null && e.amount < 0 ? '#9A4436' : '#2C1A12',
    }));
  const setRole = (staffId: string, name: string, r: RoleId) =>
    gate(store, 'staff', `Change ${name}'s role`, () => {
      store.setState((st) => ({ staff: st.staff.map((y) => (y.id === staffId ? { ...y, role: r } : y)) }));
      store.send({ type: 'staff.role', staffId, role: r });
      store.say(`${name} is now ${roles[r].label}`);
      store.logAudit('Role changed', `${name} → ${roles[r].label}`, { area: 'Access' });
    });
  const togglePerm = (role: RoleId, perm: Permission, on: boolean) =>
    gate(store, 'staff', 'Change role permissions', () => {
      const cur = store.roles();
      const next = { ...cur, [role]: { ...cur[role], perms: on ? cur[role].perms.filter((p) => p !== perm) : [...cur[role].perms, perm] } };
      store.setState({ roles: next });
      store.sendDebounced('role-matrix', { type: 'staff.roleMatrix', roles: next });
      store.logAudit('Role permissions changed', `${roles[role].label}: ${perm} ${on ? 'removed' : 'granted'}`, { area: 'Access' });
    });
  return {
    staffTabs: tabDefs.map(([id, name]) => ({
      id,
      name,
      on: stab === id,
      ...tab(stab === id),
      pick: () => store.setOps({ staffTab: id }),
    })),
    staffTeam: stab === 'team',
    staffShifts: stab === 'shifts',
    staffActivity: stab === 'activity',
    curShift: sh
      ? {
          line: `Open since ${sh.openedAt} · ${sh.staffName} · ${cafeName(sh.cafe)}`,
          rows: (
            [
              ['Float', sh.float],
              ['Cash sales', sh.cashSales],
              ['Cash refunds', -sh.cashRefunds],
              ['Movements', sh.moves.reduce((n, m) => n + (m.type === 'in' ? m.amount : -m.amount), 0)],
              ['Expected', shiftExpectedC(sh)],
            ] as [string, number][]
          ).map(([k, v]) => ({ k, v: fmtC(v) })),
        }
      : null,
    noShift: !sh,
    manageShift: () => store.setState({ dlg: { kind: 'shift' } }),
    shiftRows: (s.shifts || []).map((x) => ({
      id: x.id,
      when: `${x.openedAt} → ${x.closedAt}`,
      who: `${x.staffName}${x.closedBy && x.closedBy !== x.staffName ? ' · closed by ' + x.closedBy : ''}`,
      cafeName: cafeName(x.cafe),
      expS: fmtC(x.expected),
      cntS: fmtC(x.counted),
      varS: fmtC(x.variance),
      varFg: Math.abs(x.variance) > VARIANCE_LIMIT_C ? '#9A4436' : x.variance ? '#8B5827' : '#3E6B47',
      approved: x.approvedBy ? 'Approved · ' + x.approvedBy : '',
      note: x.note || '',
    })),
    noShifts: !(s.shifts || []).length,
    auditFilters: filterDefs.map(([id, name]) => ({
      id,
      name,
      on: AF === id,
      ...sel(AF === id),
      pick: () => store.setOps({ auditF: id }),
    })),
    auditQ: o.auditQ || '',
    setAuditQ: (e: ChangeEvent<HTMLInputElement>) => store.setOps({ auditQ: e.target.value }),
    auditRows,
    noAudit: !auditRows.length,
    staffRows: s.staff.map((x) => ({
      id: x.id,
      name: x.name,
      initials: x.initials,
      cafeName: cafeName(x.cafe),
      role: x.role,
      shift: x.shift,
      roleOpts: ROLE_IDS.map((r) => ({
        id: r,
        name: roles[r].label,
        on: x.role === r,
        ...tab(x.role === r),
        pick: () => {
          if (x.role !== r) setRole(x.id, x.name, r);
        },
      })),
    })),
    permRows: PERMISSIONS.map(([perm, label]) => ({
      id: perm,
      label,
      cells: ROLE_IDS.map((role) => {
        const perms = roles[role].perms;
        const on = perms.includes('*') || perms.includes(perm);
        const locked = role === 'admin';
        return {
          role,
          on,
          locked,
          aria: `${roles[role].label}: ${label}${on ? ' — allowed' : ' — not allowed'}`,
          mark: on ? '✓' : '',
          bg: on ? (locked ? '#9A8B80' : '#2C1A12') : 'transparent',
          border: on ? 'transparent' : 'rgba(44,26,18,.2)',
          opacity: locked ? 0.6 : 1,
          toggle: () => {
            if (!locked) togglePerm(role, perm, on);
          },
        };
      }),
    })),
  };
}

export type StaffView = ReturnType<typeof buildStaff>;
