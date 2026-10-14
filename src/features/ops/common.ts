// Shared helpers for the back-office sections.
import { fmtHM } from '../../domain/hours';
import { money } from '../../domain/pricing';
import type { OrderLine, Permission } from '../../domain/types';
import type { PosStore } from '../../state/store';

export const M = money;
export const M0 = (n: number): string => '$' + Math.round(+n).toLocaleString('en-AU');
export const fmtT = fmtHM;

const STATUS: Record<string, [string, string]> = {
  new: ['#E9C89E', '#2C1A12'],
  preparing: ['#2C1A12', '#F5EDE2'],
  ready: ['#EEF1E4', '#4E6538'],
  completed: ['rgba(44,26,18,.06)', '#8C7A6E'],
  refunded: ['#FBE9E4', '#8A2E1C'],
  pending: ['#E9C89E', '#2C1A12'],
  confirmed: ['#EEF1E4', '#4E6538'],
  cancelled: ['#FBE9E4', '#8A2E1C'],
  enquiry: ['#E9C89E', '#2C1A12'],
  quoted: ['#ECE4D7', '#3A2B24'],
  delivered: ['rgba(44,26,18,.06)', '#8C7A6E'],
  ok: ['#EEF1E4', '#4E6538'],
  low: ['#E9C89E', '#2C1A12'],
  out: ['#FBE9E4', '#8A2E1C'],
};
/** Status chip colours in the back office. */
export const statusStyle = (st: string): [string, string] => STATUS[st] || ['#ECE4D7', '#3A2B24'];

export const sel = (on: boolean) =>
  on ? { bg: '#2C1A12', fg: '#F5EDE2', border: '#2C1A12' } : { bg: 'transparent', fg: '#3A2B24', border: 'rgba(44,26,18,.14)' };
export const tab = (on: boolean) => (on ? { bg: '#FFFCF7', fg: '#2C1A12' } : { bg: 'transparent', fg: '#8C7A6E' });
export const toggleStyle = (on: boolean, onColor = '#B67A4B') => ({ bg: on ? onColor : 'rgba(44,26,18,.2)', knob: on ? '21px' : '3px' });

export const modsText = (l: Pick<OrderLine, 'sel' | 'adjust'>): string =>
  Object.values(l.sel || {})
    .flat()
    .concat(l.adjust || [])
    .join(' · ');

export const CHAN_STYLE = { pos: ['#ECE4D7', '#3A2B24'], web: ['#E9C89E', '#2C1A12'], app: ['#2C1A12', '#F5EDE2'] } as const;

/** Scope helpers bound to the current café filter. */
export function scope(store: PosStore) {
  const s = store.state;
  const cafeName = (id: string) => store.location(id)?.name || '—';
  return {
    cafeName,
    scopeName: s.ops.cafe === 'all' ? 'All cafés' : cafeName(s.ops.cafe),
    inScope: (cafeId: string) => s.ops.cafe === 'all' || cafeId === s.ops.cafe,
    /** Café used for single-café pages (reservations, inventory, settings) when "All cafés" is selected. */
    focusCafe: s.ops.cafe === 'all' ? 'phillip' : s.ops.cafe,
  };
}

/**
 * Run an edit only if the signed-in staff member holds `perm`; otherwise ask for a manager / admin PIN first
 * (same approval flow the till uses for refunds). The backend must enforce the same permission.
 */
export function gate(store: PosStore, perm: Permission, what: string, fn: () => void): void {
  store.approve(perm, 'Manager approval', what, (approver) => {
    if (approver) store.setState({ dlg: null });
    fn();
  });
}
