// Back-office header: title, café scope menu, and the section's primary action.
import type { PosStore } from '../../state/store';
import { devSim } from '../devSim';
import type { SectionRoute } from '../../state/types';
import { buildFormView, openCatForm, openResForm } from './forms.view';
import { gate, scope } from './common';
import { customerList } from './guests.view';

export function buildOpsShell(store: PosStore) {
  const s = store.state,
    o = s.ops,
    route = s.route as SectionRoute;
  const { scopeName } = scope(store);
  const cafeOpt = (id: string, name: string) => ({
    id,
    name,
    on: o.cafe === id,
    bg: o.cafe === id ? '#2C1A12' : 'transparent',
    fg: o.cafe === id ? '#F5EDE2' : '#3A2B24',
    pick: () => store.setOps({ cafe: id, selOrder: null, cafeMenu: false }),
  });
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const titles: Record<SectionRoute, [string, string]> = {
    dashboard: ['Dashboard', `${scopeName} · ${today}`],
    orders: ['Orders', `${scopeName} · POS, website and app`],
    reservations: ['Reservations', scopeName],
    catering: ['Catering', 'Enquiries, quotes and confirmed jobs'],
    customers: ['Customers', `${s.customers.length} profiles`],
    loyalty: ['Loyalty', 'Coffee card programme'],
    gift: ['Gift cards', store.backend.kind === 'http' ? 'Customer gift card payments and refunds' : 'Issue, redeem and track balances'],
    inventory: ['Inventory & menu', scopeName],
    reports: ['Reports', `${scopeName} · week to date`],
    staff: ['Staff & roles', 'Who can do what'],
    settings: ['Settings', scopeName],
  };
  if (route === 'customers') {
    const n = customerList(store).length;
    titles.customers[1] = `${n} profile${n === 1 ? '' : 's'}${o.cafe !== 'all' ? ' · ' + scopeName : ''}`;
  }
  const [title, subtitle] = titles[route] || ['POS', ''];
  const focus = scope(store).focusCafe;
  const primary: Partial<Record<SectionRoute, { label: string; go: () => void }>> = {
    reservations: { label: '+ New reservation', go: () => gate(store, 'reservations', 'Create a reservation', () => openResForm(store)) },
    catering: { label: '+ New enquiry', go: () => openCatForm(store) },
    gift: {
      label: '+ Sell gift card',
      go: () =>
        gate(store, 'gift', 'Sell a gift card', () =>
          store.setOps({ form: { kind: 'gift', v: { amount: '50', customerId: '', note: '' } } }),
        ),
    },
    staff: {
      label: '+ Add team member',
      go: () =>
        gate(store, 'staff', 'Add a team member', () =>
          store.setOps({ form: { kind: 'staff', v: { name: '', role: 'cashier', cafe: focus, pin: '', shift: '' } } }),
        ),
    },
  };
  // Mock website / app intake exists only in development builds.
  const sims: [string, 'res' | 'cat', 'web' | 'app', string][] = store.config.devTools
    ? route === 'reservations'
      ? [
          ['web', 'res', 'web', 'Website request'],
          ['app', 'res', 'app', 'App request'],
        ]
      : route === 'catering'
        ? [
            ['web', 'cat', 'web', 'Website enquiry'],
            ['app', 'cat', 'app', 'App enquiry'],
          ]
        : []
    : [];
  return {
    title,
    subtitle,
    scopeName,
    cafeMenu: o.cafeMenu,
    toggleCafeMenu: () => store.setOps({ cafeMenu: !o.cafeMenu }),
    cafes: [cafeOpt('all', 'All cafés'), ...s.catalog.locations.filter((l) => !l.tbc).map((l) => cafeOpt(l.id, l.name))],
    simActions: sims.map(([id, kind, platform, label]) => ({
      id,
      label: 'Simulate ' + label.toLowerCase(),
      go: () => devSim(store, (m) => m.simulateIntake(store, kind, platform)),
    })),
    primaryAction: route === 'gift' && store.backend.kind === 'http' ? null : primary[route] || null,
    route,
    form: o.form ? buildFormView(store, o.form) : null,
  };
}

export type OpsShellView = ReturnType<typeof buildOpsShell>;
