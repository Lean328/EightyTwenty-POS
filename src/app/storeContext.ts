import { createContext, useContext, useSyncExternalStore } from 'react';
import type { PosStore } from '../state/store';

export const StoreContext = createContext<PosStore | null>(null);

/** The till store; re-renders the calling component whenever state changes. */
export function useStore(): PosStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreContext.Provider>');
  useSyncExternalStore(store.subscribe, store.getSnapshot);
  return store;
}
