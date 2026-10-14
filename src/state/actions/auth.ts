// Staff sign-in, manager approval by PIN, and permission-gated navigation.
import { hasPermission, SECTION_GATES } from '../../domain/permissions';
import type { StaffMember } from '../../domain/types';
import { ApiError } from '../../services/http/httpClient';
import type { PosStore } from '../store';
import { SECTIONS, type Route } from '../types';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
let failures = 0;
let lockedUntil = 0;

/** Section needs a permission the signed-in staff member does not have. */
export function isLocked(store: PosStore, id: string): boolean {
  const g = SECTION_GATES[id];
  return !!(g && !g.some((p) => store.can(p)));
}

export function requireSignIn(store: PosStore): void {
  store.setState({
    dlg: {
      kind: 'pin',
      pin: '',
      title: 'Sign in',
      body: 'Enter your 4-digit PIN to start using the till.',
      perm: 'pos',
      required: true,
      next: (st) => {
        store.setState({ staffId: st.id, dlg: null });
        store.say(`Signed in as ${st.name}`);
      },
    },
  });
}

export function closeDialog(store: PosStore): void {
  const d = store.state.dlg;
  if (d && d.kind === 'pin' && d.required) return;
  store.setState({ dlg: null });
}

/** Apply the current location hash: route, sub-route and the permission gate. */
export function onRoute(store: PosStore): void {
  const s = store.state;
  const parts = location.hash.replace('#', '').split('/');
  let r = (parts[0] || 'till') as Route;
  if (r !== 'till' && !(r in SECTIONS)) r = 'till';
  if (s.phase === 'ready' && store.signedIn && isLocked(store, r)) {
    const target = location.hash,
      g = SECTION_GATES[r]!;
    history.replaceState(null, '', '#' + s.route + (s.sub ? '/' + s.sub : ''));
    store.setState({
      navOpen: false,
      dlg: {
        kind: 'pin',
        pin: '',
        title: 'Manager access',
        body: SECTIONS[r as keyof typeof SECTIONS] + ' needs a manager or admin PIN.',
        perm: g[g.length - 1],
        next: (st) => {
          store.setState({ staffId: st.id, dlg: null });
          setTimeout(() => {
            location.hash = target;
          }, 0);
        },
      },
    });
    return;
  }
  store.setState({ route: r, sub: parts[1] || '', navOpen: s.narrow ? false : s.navOpen, tip: null });
  if (r !== 'till') store.setOps({ form: null, cafeMenu: false, ...(r === 'customers' && parts[1] ? { selCust: parts[1] } : {}) });
}

/** One key on the PIN pad. Verifies with the staff auth service once four digits are entered. */
export async function pinKey(store: PosStore, k: string): Promise<void> {
  const d = store.state.dlg;
  if (!d || d.kind !== 'pin' || d.verifying) return;
  const set = (p: Partial<typeof d>) => {
    const cur = store.state.dlg;
    if (cur && cur.kind === 'pin') store.setState({ dlg: { ...cur, ...p } });
  };
  if (Date.now() < lockedUntil)
    return set({ pin: '', err: `Too many attempts — wait ${Math.ceil((lockedUntil - Date.now()) / 1000)} seconds` });
  const pin = d.pin || '';
  if (k === '⌫') return set({ pin: pin.slice(0, -1), err: '' });
  const np = k === 'OK' ? pin : pin + k;
  if (np.length < 4) return set({ pin: np });
  set({ pin: np, verifying: true, err: '' });
  let res;
  try {
    res = await store.backend.staffAuth.verifyPin(np);
  } catch (e) {
    const offline = e instanceof ApiError && (e.kind === 'offline' || e.kind === 'network' || e.kind === 'timeout');
    return set({ pin: '', verifying: false, err: offline ? 'Cannot check PINs while offline' : 'Could not check the PIN — try again' });
  }
  // The dialog was closed or replaced while the PIN was being checked.
  const cur = store.state.dlg;
  if (!cur || cur.kind !== 'pin' || !cur.verifying || cur.title !== d.title) return;
  if (!res) {
    failures += 1;
    if (failures >= MAX_ATTEMPTS) {
      failures = 0;
      lockedUntil = Date.now() + LOCKOUT_MS;
    }
    return set({ pin: '', verifying: false, err: 'PIN not recognised' });
  }
  failures = 0;
  const staff: StaffMember = res.staff;
  if (!store.state.staff.some((x) => x.id === staff.id)) store.setState((s) => ({ staff: [...s.staff, staff] }));
  if (!hasPermission(res.permissions, d.perm))
    return set({ pin: '', verifying: false, err: `${staff.name} is a ${store.roles()[staff.role].label} — not permitted` });
  d.next(staff);
}
