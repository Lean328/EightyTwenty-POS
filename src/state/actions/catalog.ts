// Sellable product data (menu record + POS price overrides), photos, availability and stock.
import { INGREDIENT_MODS, stockState } from '../../domain/policies';
import type { MenuItem } from '../../domain/types';
import { stamp, uid } from '../../lib/ids';
import type { PosStore } from '../store';

/** The item as it sells right now: approved menu record with any manager price override applied. */
export function effective(store: PosStore, m: MenuItem): MenuItem {
  const p = store.state.prices[m.id];
  return p != null && p >= 0 && !isNaN(p) ? { ...m, price: p } : m;
}

export interface Photo {
  img: string;
  noImg: boolean;
  fit: 'cover' | 'contain';
}

/** Product photo, served from the optimised copies in public/img-pos (800px JPEG). */
export function photo(item: MenuItem | undefined): Photo {
  const orig = item?.img || '';
  const src = orig ? import.meta.env.BASE_URL + orig.replace(/^img\//, 'img-pos/').replace(/\.[^.]+$/, '.jpg') : '';
  return { img: src, noImg: !src, fit: /\.png$/i.test(orig) ? 'contain' : 'cover' };
}

/** Modifier options off the menu: switched off by a manager, or automatically because an ingredient ran out. */
export function unavailableMods(store: PosStore): Set<string> {
  const s = store.state,
    set = new Set(s.unavailableMods || []);
  (s.stock || []).forEach((x) => {
    if (x.level <= 0) (INGREDIENT_MODS[x.id] || []).forEach((m) => set.add(m));
  });
  return set;
}

export function adjustStock(store: PosStore, id: string, delta: number, reason: string): void {
  const s = store.state,
    item = s.stock.find((x) => x.id === id);
  if (!item) return;
  const level = Math.max(0, Math.round((item.level + delta) * 10) / 10);
  const stock = s.stock.map((x) => (x.id === id ? { ...x, level } : x));
  const entry = { id: uid('S'), at: stamp(), item: item.name, delta, unit: item.unit, level, reason, by: store.staff().name };
  store.setState({ stock, stockLog: [entry, ...(s.stockLog || [])].slice(0, 200), availSync: stamp() });
  store.send({ type: 'stock.adjust', stockId: id, delta, reason });
  store.logAudit('Stock adjusted', `${item.name} ${delta > 0 ? '+' : ''}${delta} ${item.unit} → ${level}`, { reason, area: 'Inventory' });
}

export const stockOf = (store: PosStore, id: string) => store.state.stock.find((x) => x.id === id);
export { stockState };
