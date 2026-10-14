import type * as Simulations from '../dev/simulations';
import type { PosStore } from '../state/store';

/**
 * Run a development-only simulation (mock website/app traffic). The module is loaded on demand and is compiled
 * out of builds that use the real backend (VITE_DATA_PROVIDER=http).
 */
export function devSim(store: PosStore, run: (sims: typeof Simulations) => void): void {
  if (import.meta.env.VITE_DATA_PROVIDER === 'http' || !store.config.devTools) return;
  void import('../dev/simulations').then(run);
}
