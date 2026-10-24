import type { ChangeEvent } from 'react';
import { INGREDIENT_MODS, STOCK_REASONS, stockState } from '../../domain/policies';
import type { MenuItem } from '../../domain/types';
import { stamp } from '../../lib/ids';
import { adjustStock, photo, unavailableMods } from '../../state/actions/catalog';
import type { PosStore } from '../../state/store';
import type { OpsUi } from '../../state/types';
import { scope, sel, statusStyle, tab } from './common';

type Input = ChangeEvent<HTMLInputElement>;

export function buildInventory(store: PosStore) {
  const s = store.state,
    o = s.ops,
    { cafeName, focusCafe: invCafe } = scope(store);
  const { categories: allCats, menu } = s.catalog;
  const t = o.invTab;
  const tabDefs: [OpsUi['invTab'], string][] = [
    ['items', 'Menu items'],
    ['cats', 'Categories'],
    ['mods', 'Modifiers'],
  ];
  const categories = s.catOrder.map((id) => allCats.find((c) => c.id === id)).filter((c) => c !== undefined);
  const q = o.invQ.toLowerCase();
  const off = new Set(s.branchOff[invCafe] || []);
  const level = (id: string) => s.stock.find((x) => x.id === id) || { level: 1, par: 1 };
  const bad = (id: string) => stockState(level(id));
  const stockFor = (m: MenuItem): string => {
    if (m.cat === 'coffee') return bad('oat') === 'ok' ? 'ok' : 'oat milk ' + bad('oat');
    if (/GF|Gluten/.test(m.diet.join()) && /burger|roll|brekky|benedict|avo/i.test(m.name))
      return bad('gfbun') === 'ok' ? 'ok' : 'GF buns ' + bad('gfbun');
    return m.id === 'original-allday-1' ? 'out' : 'ok';
  };
  const markAvailability = () => store.setState({ availSync: stamp() });

  const invRows = menu
    .filter((m) => (o.invCat === 'all' || m.cat === o.invCat) && (!q || m.name.toLowerCase().includes(q)))
    .map((m) => {
      const sold = s.soldOut.includes(m.id),
        branch = off.has(m.id),
        on = !sold && !branch;
      const stk = stockFor(m);
      const [stBg, stFg] = statusStyle(stk === 'ok' ? 'ok' : stk === 'out' ? 'out' : 'low');
      return {
        id: m.id,
        name: m.name,
        diet: m.diet.join(', ') || (m.desc ? m.desc.slice(0, 60) : ''),
        catName: allCats.find((c) => c.id === m.cat)?.name,
        mods: m.mods.length ? m.mods.map((g) => g.name).join(', ') : '—',
        price: s.prices[m.id] != null ? s.prices[m.id] : m.price,
        ...photo(m),
        canEditPrice: store.backend.kind === 'local' || store.staff()?.role === 'admin',
        setPrice: (e: Input) => {
          if (store.backend.kind === 'http' && store.staff()?.role !== 'admin') return;
          const v = parseFloat(e.target.value);
          if (isNaN(v) || v < 0) return;
          const price = Math.round(v * 100) / 100;
          store.setState((st) => ({ prices: { ...st.prices, [m.id]: price }, availSync: stamp() }));
          store.sendDebounced('price:' + m.id, { type: 'catalog.price', itemId: m.id, price });
        },
        logPrice: () => {
          if (store.backend.kind === 'http' && store.staff()?.role !== 'admin') return;
          const v = store.state.prices[m.id];
          if (v != null && v !== m.price)
            store.logAudit('Price changed', `${m.name} → $${(+v).toFixed(2)} (was $${m.price.toFixed(2)})`, { area: 'Inventory' });
        },
        on,
        opacity: on ? 1 : 0.6,
        availLabel: sold ? 'Sold out · all cafés' : branch ? `Off menu at ${cafeName(invCafe)}` : 'Available',
        availFg: on ? '#3E6B47' : '#9A4436',
        swBg: on ? '#3E6B47' : 'rgba(44,26,18,.2)',
        knob: on ? '19px' : '3px',
        toggle: () => {
          if (on) {
            store.setState((st) => ({ soldOut: [...st.soldOut, m.id] }));
            store.send({ type: 'catalog.soldOut', itemId: m.id, soldOut: true });
          } else {
            store.setState((st) => ({
              soldOut: st.soldOut.filter((x) => x !== m.id),
              branchOff: { ...st.branchOff, [invCafe]: (st.branchOff[invCafe] || []).filter((x) => x !== m.id) },
            }));
            if (sold) store.send({ type: 'catalog.soldOut', itemId: m.id, soldOut: false });
            if (branch) store.send({ type: 'catalog.branch', cafeId: invCafe, itemId: m.id, available: true });
          }
          markAvailability();
          store.logAudit(on ? 'Marked sold out' : 'Back on sale', m.name, { area: 'Inventory' });
        },
        stock: stk === 'ok' ? 'In stock' : stk,
        stBg,
        stFg,
      };
    });

  const moveCat = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= s.catOrder.length) return;
    const next = s.catOrder.slice();
    [next[j], next[i]] = [next[i], next[j]];
    store.setState({ catOrder: next });
    store.sendDebounced('category-order', { type: 'catalog.categoryOrder', ids: next });
  };
  const catCards = categories.map((c, i) => ({
    id: c.id,
    n: String(i + 1).padStart(2, '0'),
    name: c.name,
    meta: `${menu.filter((m) => m.cat === c.id).length} items${c.note ? ' · ' + c.note : ''}`,
    up: () => moveCat(i, -1),
    down: () => moveCat(i, 1),
  }));

  const groups: Record<string, { g: MenuItem['mods'][number]; items: string[] }> = {};
  menu.forEach((m) =>
    m.mods.forEach((g) => {
      const k = g.name + '|' + g.options.length;
      (groups[k] = groups[k] || { g, items: [] }).items.push(m.name);
    }),
  );
  const unav = unavailableMods(store);
  const modGroups = Object.values(groups)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 12)
    .map(({ g, items }) => ({
      id: g.id + g.name,
      name: g.name,
      meta: `${g.required ? 'Required' : 'Optional'} · ${g.max === 1 ? 'choose one' : 'choose any'}`,
      used: items.length > 3 ? `${items.slice(0, 3).join(', ')} +${items.length - 3} more` : items.join(', '),
      opts: g.options.map(([label, price]) => {
        const lbl = label + (price ? ' +$' + price : '');
        const isOff = unav.has(label);
        const forced = !(s.unavailableMods || []).includes(label) && isOff;
        return {
          label: lbl,
          off: isOff,
          bg: isOff ? '#FBE9E4' : '#F7F2EA',
          fg: isOff ? '#8A2E1C' : '#2C1A12',
          deco: isOff ? 'line-through' : 'none',
          title: forced
            ? 'Switched off automatically — ingredient out of stock'
            : isOff
              ? 'Unavailable on POS, app and website'
              : 'Available',
          toggle: () => {
            if (forced) return store.say('Restock the ingredient to bring this back');
            const list = store.state.unavailableMods || [];
            store.setState({ unavailableMods: isOff ? list.filter((x) => x !== label) : [...list, label], availSync: stamp() });
            store.send({ type: 'catalog.modifier', label, available: isOff });
            store.logAudit(isOff ? 'Modifier available' : 'Modifier unavailable', label, { area: 'Inventory' });
          },
        };
      }),
    }));

  const stockRows = s.stock.map((x) => {
    const stt = stockState(x);
    const [bg, fg] = statusStyle(stt);
    return {
      id: x.id,
      name: x.name,
      level: `${x.level} ${x.unit}`,
      par: `par ${x.par}`,
      pct: Math.min(100, Math.round((x.level / x.par) * 100)) + '%',
      bar: stt === 'ok' ? '#3E6B47' : stt === 'low' ? '#B67A4B' : '#9A4436',
      state: stt === 'ok' ? 'OK' : stt,
      bg,
      fg,
      links: (INGREDIENT_MODS[x.id] || []).join(', '),
      on: o.stockSel === x.id,
      open: () => store.setOps({ stockSel: o.stockSel === x.id ? null : x.id, stockAmt: '', stockReason: '' }),
    };
  });
  const sx = s.stock.find((x) => x.id === o.stockSel);
  const adjust = (sign: 1 | -1) => () => {
    const v = +o.stockAmt;
    if (!v || !o.stockReason || !sx) return store.say('Enter a quantity and a reason');
    adjustStock(store, sx.id, sign * Math.abs(v), o.stockReason);
    store.setOps({ stockAmt: '' });
  };
  const stockForm = sx
    ? {
        name: sx.name,
        unit: sx.unit,
        amt: o.stockAmt || '',
        setAmt: (e: Input) => store.setOps({ stockAmt: e.target.value }),
        reasons: STOCK_REASONS.map((r) => ({
          label: r,
          on: o.stockReason === r,
          bg: o.stockReason === r ? '#2C1A12' : '#F7F2EA',
          fg: o.stockReason === r ? '#F5EDE2' : '#3A2B24',
          pick: () => store.setOps({ stockReason: r }),
        })),
        add: adjust(1),
        remove: adjust(-1),
        close: () => store.setOps({ stockSel: null }),
      }
    : null;
  const lowN = s.stock.filter((x) => stockState(x) !== 'ok');
  return {
    invTabs: tabDefs.map(([id, name]) => ({ id, name, on: t === id, ...tab(t === id), pick: () => store.setOps({ invTab: id }) })),
    invItems: t === 'items',
    invCats: t === 'cats',
    invMods: t === 'mods',
    invCatChips: [{ id: 'all', name: 'All categories' }, ...categories].map((c) => ({
      id: c.id,
      name: c.name,
      on: o.invCat === c.id,
      ...sel(o.invCat === c.id),
      pick: () => store.setOps({ invCat: c.id }),
    })),
    invQ: o.invQ,
    setInvQ: (e: Input) => store.setOps({ invQ: e.target.value }),
    invCafeName: cafeName(invCafe),
    invRows,
    catCards,
    modGroups,
    stockRows,
    stockForm,
    stockLog: (s.stockLog || []).slice(0, 12).map((e) => ({
      id: e.id,
      at: e.at,
      what: `${e.item} ${e.delta > 0 ? '+' : ''}${e.delta} ${e.unit} → ${e.level}`,
      sub: `${e.reason} · ${e.by}`,
    })),
    hasStockLog: (s.stockLog || []).length > 0,
    lowStock: lowN.length ? `${lowN.length} low or out: ${lowN.map((x) => x.name + (x.level <= 0 ? ' (out)' : '')).join(', ')}` : '',
    syncNote: store.config.devTools
      ? `Availability syncs to the EightyTwenty app and website (simulated)${s.availSync ? ' · last pushed ' + s.availSync : ''}`
      : `Availability is shared with the EightyTwenty app and website through the EightyTwenty server${s.availSync ? ' · last changed ' + s.availSync : ''}`,
  };
}

export type InventoryView = ReturnType<typeof buildInventory>;
