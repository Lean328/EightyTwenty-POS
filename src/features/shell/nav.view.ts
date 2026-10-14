import type { MouseEvent } from 'react';
import { isActive } from '../../domain/policies';
import { isLocked } from '../../state/actions/auth';
import type { PosStore } from '../../state/store';
import { SECTIONS, type Route } from '../../state/types';

const LABELS: Record<Route, string> = { till: 'Till · new order', ...SECTIONS, orders: 'Orders & kitchen' };
const GROUPS: [string, Route[]][] = [
  ['Sell', ['till', 'orders']],
  ['Operations', ['dashboard', 'reservations', 'catering', 'customers', 'loyalty', 'gift', 'inventory', 'reports', 'staff']],
  ['System', ['settings']],
];
/** Sections with a custom raster icon (assets/nav/<id>.png and <id>-on-dark.png). Staff uses a line icon. */
const NAV_IMG = new Set<Route>([
  'till',
  'orders',
  'dashboard',
  'reservations',
  'catering',
  'customers',
  'loyalty',
  'gift',
  'inventory',
  'reports',
  'settings',
]);

export function buildNavView(store: PosStore) {
  const s = store.state,
    r = s.route;
  const expanded = !!s.navOpen,
    narrow = !!s.narrow;
  const counts: Partial<Record<Route, number>> = {
    orders: s.orders.filter((o) => isActive(o) && o.cafe === s.cafe).length,
    reservations: s.reservations.filter((x) => x.status === 'pending').length,
    catering: s.catering.filter((x) => ['enquiry', 'quoted'].includes(x.status)).length,
  };
  const tipAt = (label: string) => (e: MouseEvent<HTMLElement>) => {
    if (expanded) return;
    const rc = e.currentTarget.getBoundingClientRect();
    store.setState({ tip: { label, y: Math.round(rc.top + rc.height / 2) } });
  };
  const navGroups = GROUPS.map(([name, ids], gi) => ({
    name,
    divider: !expanded && gi > 0,
    items: ids.map((id) => {
      const cur = r === id,
        locked = isLocked(store, id),
        count = counts[id] || 0,
        nm = LABELS[id];
      return {
        id,
        name: nm,
        label: nm + (locked ? ' · PIN required' : '') + (count ? ' · ' + count : ''),
        href: '#' + id,
        cur,
        locked,
        count,
        dot: !expanded && count > 0,
        img: NAV_IMG.has(id) ? `${import.meta.env.BASE_URL}assets/nav/${id}${cur ? '' : '-on-dark'}.png` : '',
        bg: cur ? '#F0E4D4' : 'transparent',
        fg: cur ? '#2C1A12' : 'rgba(245,237,226,.78)',
        weight: cur ? 600 : 500,
        tipOn: tipAt(nm + (locked ? ' · PIN' : '') + (count ? ' · ' + count : '')),
      };
    }),
  }));
  const st = store.signedIn ? store.staff() : null;
  const navW = expanded ? '256px' : '72px';
  return {
    navGroups,
    cafeName: store.location(s.cafe)?.name || '',
    navExpanded: expanded,
    navW,
    navSpace: narrow ? '72px' : navW,
    navZ: narrow && expanded ? 80 : 40,
    navShadow: narrow && expanded ? '20px 0 60px rgba(44,26,18,.3)' : 'none',
    navBackdrop: narrow && expanded,
    navToggleLabel: expanded ? 'Collapse navigation' : 'Expand navigation',
    toggleNav: () => store.setState({ navOpen: !s.navOpen, tip: null }),
    closeNav: () => store.setState({ navOpen: false }),
    tip: !expanded && s.tip ? s.tip : null,
    hideTip: () => {
      if (store.state.tip) store.setState({ tip: null });
    },
    staffTip: tipAt('Switch staff' + (st ? ' · ' + st.name : '')),
    openStaff: () => store.setState({ dlg: { kind: 'staff' } }),
    navStaffName: st ? st.name : '',
    navStaffInitials: st ? st.initials : '',
    navStaffRole: st ? store.roleLabel(st) : '',
  };
}

export type NavView = ReturnType<typeof buildNavView>;
