// Building an order on the till: adding items, holding, sending to the kitchen, re-ordering.
import { fmtHM } from '../../domain/hours';
import { missingRequired, unitPrice } from '../../domain/pricing';
import type { MenuItem, ModSelection, OrderLine } from '../../domain/types';
import { nowHM, uid } from '../../lib/ids';
import type { PosStore } from '../store';
import { effective } from './catalog';
import { printDocket } from './orders';
import { cartToOrder } from './payments';

export function openItem(store: PosStore, item: MenuItem, line?: OrderLine): void {
  const sel: ModSelection = line ? structuredClone(line.sel) : {};
  if (!line) for (const g of item.mods) if (g.required && g.max === 1 && g.options.length === 1) sel[g.id] = [g.options[0][0]];
  store.setState({
    dlg: {
      kind: 'item',
      itemId: item.id,
      sel,
      adjust: line ? [...line.adjust] : [],
      note: line ? line.note : '',
      qty: line ? line.qty : 1,
      editKey: line ? line.key : null,
    },
  });
}

export function quickAdd(store: PosStore, item: MenuItem): void {
  if (missingRequired(item).length) return openItem(store, item);
  store.setState((s) => {
    const ex = s.lines.find((l) => l.itemId === item.id && !Object.keys(l.sel).length && !l.adjust.length && !l.note);
    const lines = ex
      ? s.lines.map((l) => (l === ex ? { ...l, qty: l.qty + 1 } : l))
      : [...s.lines, { key: uid('L'), itemId: item.id, name: item.name, price: item.price, qty: 1, sel: {}, adjust: [], note: '' }];
    return { lines };
  });
}

const clearedCart = { lines: [], table: '', customerId: null, discount: null, gift: null, note: '' };

export function holdCart(store: PosStore): void {
  const s = store.state;
  if (!s.lines.length) return store.say('Nothing to hold');
  const customer = s.customers.find((c) => c.id === s.customerId);
  const time = fmtHM(nowHM());
  const h = {
    id: uid('H'),
    label: s.table ? `Table ${s.table}` : customer ? customer.name : `Held ${time}`,
    time,
    lines: s.lines,
    type: s.type,
    table: s.table,
    customerId: s.customerId,
    note: s.note,
  };
  store.setState((st) => ({ held: [h, ...st.held], ...clearedCart }));
  store.say('Order held');
}

/** Send the cart to the kitchen as an open tab (pay later). */
export function sendKitchen(store: PosStore): void {
  const s = store.state;
  if (!s.lines.length) return store.say('Add items first');
  const sold = new Set(s.soldOut || []);
  const bad = s.lines.find((l) => sold.has(l.itemId));
  if (bad) return store.say(`${bad.name} is sold out — remove it first`);
  const { o, giftcards } = cartToOrder(store);
  o.status = 'preparing';
  store.setState((st) => ({ orders: [o, ...st.orders], giftcards, ...clearedCart }));
  store.send({ type: 'order.create', order: o }, s.online ? undefined : `${o.id} · sent to kitchen offline`);
  setTimeout(() => printDocket(store, o.id), 0);
  store.say(`${o.id} sent to kitchen · open tab${o.table ? ' on ' + o.table : ''}`);
}

/** Re-price cart lines whose menu price changed since they were added. */
export function applyCurrentPrices(store: PosStore): void {
  const { menuById } = store.state.catalog;
  store.setState((st) => ({
    lines: st.lines.map((l) => {
      const it = menuById[l.itemId];
      return it ? { ...l, price: unitPrice(effective(store, it), l.sel) } : l;
    }),
  }));
  store.say('Cart updated to current prices');
}
