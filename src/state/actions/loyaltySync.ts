import { getStaffToken } from '../../services/http/staffSession';
import type { PosStore } from '../store';

const versions = new WeakMap<PosStore, number>();

/** Refresh a customer's loyalty balance when there are no unresolved commands. */
export async function refreshCustomerLoyalty(store: PosStore, customerId: string): Promise<boolean> {
  const getBalance = store.backend.loyalty.getBalance;
  const token = getStaffToken();

  if (store.backend.kind !== 'http' || !store.state.online || !getBalance || !token) return false;
  if (store.outbox.pending.length || store.outbox.rejected.length) return false;
  if (!store.state.customers.some((customer) => customer.id === customerId)) return false;

  const cafe = store.state.cafe;
  const staffId = store.state.staffId;
  const version = (versions.get(store) || 0) + 1;
  versions.set(store, version);

  let queueChanged = false;
  const unsubscribe = store.outbox.subscribe(() => {
    queueChanged = true;
  });

  try {
    const balance = await getBalance(customerId, { staffToken: token });

    if (queueChanged || versions.get(store) !== version || balance.id !== customerId) return false;
    if (!store.state.online || store.state.cafe !== cafe || store.state.staffId !== staffId) return false;
    if (getStaffToken() !== token || store.outbox.pending.length || store.outbox.rejected.length) return false;

    store.setState((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === customerId ? { ...customer, stamps: balance.stamps, rewards: balance.rewards } : customer,
      ),
    }));
    return true;
  } catch {
    return false;
  } finally {
    unsubscribe();
  }
}
