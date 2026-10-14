import { useEffect } from 'react';
import type { MenuCategory, MenuItem } from '../domain/types';
import { MenuGrid } from '../features/till/MenuGrid';
import { buildTillView } from '../features/till/till.view';
import type { PosStore } from '../state/store';
import { StoreContext, useStore } from './storeContext';

interface Props {
  store: PosStore;
  slug: string;
  menu: MenuItem[];
  categories: MenuCategory[];
  unavailableItemIds: string[];
}

function PreviewGrid() {
  const store = useStore();
  const view = buildTillView(store);

  const readOnlyView = {
    ...view,
    products: view.products.map((product) => ({
      ...product,
      canQuick: false,
      open: () => {},
      quick: () => {},
    })),
  };

  return <MenuGrid v={readOnlyView} />;
}

export function PosMenuPreview({ store, slug, menu, categories, unavailableItemIds }: Props) {
  useEffect(() => {
    // The store has not loaded a demo snapshot on this check page.
    // Keep phase=loading so preview changes are not persisted.
    store.setState({
      catalog: {
        ...store.state.catalog,
        menu,
        menuById: Object.fromEntries(menu.map((item) => [item.id, item])),
        categories,
      },
      cafe: slug,
      cat: categories[0]?.id ?? '',
      catOrder: categories.map((category) => category.id),
      branchOff: { [slug]: unavailableItemIds },
      soldOut: [],
      prices: {},
      unavailableMods: [],
      lines: [],
      q: '',
      filter: 'all',
      filtersOpen: false,
    });
  }, [store, slug, menu, categories, unavailableItemIds]);

  return (
    <StoreContext.Provider value={store}>
      <section style={{ padding: 16, background: '#F5EDE2', borderRadius: 14 }}>
        <h3>Till menu preview</h3>
        <p>Live catalogue. Adding items and taking payments are disabled.</p>
        <PreviewGrid />
      </section>
    </StoreContext.Provider>
  );
}
