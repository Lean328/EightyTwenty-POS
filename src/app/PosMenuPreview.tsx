import { CreatePickupOrder } from './CreatePickupOrder';
import { useEffect, useState } from 'react';
import type { MenuCategory, MenuItem, ModSelection } from '../domain/types';
import { config } from '../config/env';
import { MenuGrid } from '../features/till/MenuGrid';
import { buildTillView } from '../features/till/till.view';
import { getAccessToken } from '../services/http/authSession';
import { createHttpClient } from '../services/http/httpClient';
import type { PosStore } from '../state/store';
import { StoreContext, useStore } from './storeContext';

interface Props {
  store: PosStore;
  slug: string;
  menu: MenuItem[];
  categories: MenuCategory[];
  unavailableItemIds: string[];
}

interface Quote {
  subtotalCents: number;
  lines: {
    itemId: string;
    name: string;
    qty: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
}

const money = (cents: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);

function PreviewGrid({ onPick, busy }: { onPick: (id: string) => void; busy: boolean }) {
  const store = useStore();
  const view = buildTillView(store);

  const mappedView = {
    ...view,
    products: view.products.map((product) => ({
      ...product,
      canQuick: false,
      open: () => {
        if (!busy && !product.soldOut) onPick(product.id);
      },
      quick: () => {},
    })),
  };

  return <MenuGrid v={mappedView} />;
}

function QuotePicker({
  item,
  slug,
  busy,
  setBusy,
  onClose,
}: {
  item: MenuItem;
  slug: string;
  busy: boolean;
  setBusy: (value: boolean) => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<ModSelection>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');

  function toggle(groupId: string, name: string) {
    if (busy) return;
    const group = item.mods.find((entry) => entry.id === groupId);
    if (!group) return;

    const current = selections[groupId] ?? [];
    let next: string[];

    if (current.includes(name)) {
      next = current.filter((option) => option !== name);
    } else if (group.max === 1) {
      next = [name];
    } else {
      if (group.max > 0 && current.length >= group.max) {
        setError(`Choose at most ${group.max} options for ${group.name}.`);
        return;
      }
      next = [...current, name];
    }

    setSelections({ ...selections, [groupId]: next });
    setQuote(null);
    setError('');
  }

  async function requestQuote() {
    if (busy) return;
    setQuote(null);
    setError('');

    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      setError('Quantity must be a whole number from 1 to 99.');
      return;
    }

    const missing = item.mods.find((group) => group.required && !selections[group.id]?.length);
    if (missing) {
      setError(`Choose an option for ${missing.name}.`);
      return;
    }

    setBusy(true);
    try {
      const client = createHttpClient({
        baseUrl: config.apiBaseUrl,
        timeoutMs: config.apiTimeoutMs,
        terminalId: config.terminalId,
        getAccessToken,
      });

      const result = await client.post<Quote>(`/api/v1/pos/locations/${encodeURIComponent(slug)}/quote`, {
        lines: [
          {
            itemId: item.id,
            qty,
            selections,
          },
        ],
      });

      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get quote.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 20, padding: 16, background: '#FFFCF7' }}>
      <h3>{item.name}</h3>
      <label>
        Quantity{' '}
        <input
          type="number"
          min={1}
          max={99}
          step={1}
          value={Number.isNaN(qty) ? '' : qty}
          disabled={busy}
          onChange={(event) => {
            setQty(event.target.valueAsNumber);
            setQuote(null);
            setError('');
          }}
        />
      </label>
      {item.mods.map((group) => (
        <fieldset key={group.id} disabled={busy}>
          <legend>
            {group.name}
            {group.required ? ' (required)' : ''}
          </legend>
          {group.options.map(([name, price]) => (
            <label key={name} style={{ display: 'block', margin: 8 }}>
              <input type="checkbox" checked={(selections[group.id] ?? []).includes(name)} onChange={() => toggle(group.id, name)} /> {name}{' '}
              +{money(Math.round(price * 100))}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="button" disabled={busy} onClick={() => void requestQuote()}>
        {busy ? 'Getting price…' : 'Get server quote'}
      </button>{' '}
      <button type="button" disabled={busy} onClick={onClose}>
        Close
      </button>
      {error && <p role="alert">{error}</p>}
      {quote && (
        <div role="status">
          {quote.lines.map((line) => (
            <p key={line.itemId}>
              {line.qty} × {line.name}: {money(line.unitPriceCents)} each
            </p>
          ))}
          <strong>Server subtotal: {money(quote.subtotalCents)}</strong>
          <p>A quote does not reserve the price; Django recalculates when creating the order.</p>
          <CreatePickupOrder slug={slug} line={{ itemId: item.id, qty, selections }} />
        </div>
      )}
    </section>
  );
}

export function PosMenuPreview(props: Props) {
  return <PreviewSession key={props.slug} {...props} />;
}

function PreviewSession({ store, slug, menu, categories, unavailableItemIds }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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

  const selected = menu.find((item) => item.id === selectedId && !unavailableItemIds.includes(item.id));

  return (
    <StoreContext.Provider value={store}>
      <section style={{ padding: 16, background: '#F5EDE2', borderRadius: 14 }}>
        <h3>Till integration preview</h3>
        <p>Select an item, request a server quote, create a pickup order and record cash received.</p>
        <PreviewGrid onPick={setSelectedId} busy={busy} />
        {selected && (
          <QuotePicker key={selected.id} item={selected} slug={slug} busy={busy} setBusy={setBusy} onClose={() => setSelectedId('')} />
        )}
      </section>
    </StoreContext.Provider>
  );
}
