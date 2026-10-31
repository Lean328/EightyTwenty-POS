import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createLocalBackend } from '../../dev/localBackend';
import { createTestStore } from '../../test/createTestStore';
import { buildFormView } from './forms.view';
import { buildGift } from './guests.view';
import { buildOpsShell } from './ops.view';
import { GiftCards } from './GiftCards';

const stops: Array<() => void> = [];
afterEach(() => {
  cleanup();
  stops.splice(0).forEach((stop) => stop());
});

async function setup(live = true) {
  const local = createLocalBackend();
  const issue = vi.fn(local.giftCards.issue);
  const ctx = await createTestStore({ backend: { ...local, kind: live ? 'http' : 'local', giftCards: { ...local.giftCards, issue } } });
  ctx.outbox.setOnline(false);
  stops.push(() => ctx.store.stopPersisting());
  return { ...ctx, issue };
}

describe('live gift card availability', () => {
  it('does not issue a card from a restored legacy form or record a sale', async () => {
    const ctx = await setup();
    const form = { kind: 'gift' as const, v: { amount: '50', customerId: '', note: '' } };
    ctx.store.setOps({ form });
    const before = structuredClone(ctx.store.state.giftcards);
    await buildFormView(ctx.store, form).submit();
    expect(ctx.issue).not.toHaveBeenCalled();
    expect(ctx.store.state.giftcards).toEqual(before);
    expect(ctx.outbox.pending).toHaveLength(0);
    expect(ctx.store.state.ops.form?.err).toContain('BOS');
  });

  it('leaves cached balances and histories unchanged for standalone redeem and top-up', async () => {
    const ctx = await setup();
    const card = { code: '6011 2000 1234 4471', issued: 50, balance: 50, issuedOn: 'Today', customerId: null, history: [] };
    ctx.store.setState({ giftcards: [card] });
    ctx.store.setOps({ selGift: card.code, giftAmt: '10' });
    const detail = buildGift(ctx.store).gd!;
    detail.redeem();
    detail.topup();
    expect(ctx.store.state.giftcards).toEqual([card]);
    expect(ctx.outbox.pending).toHaveLength(0);
  });

  it('shows the supported payment workflow without demo balances or a sell button', async () => {
    const ctx = await setup();
    ctx.store.setState({ route: 'gift' });
    expect(buildOpsShell(ctx.store).primaryAction).toBeNull();
    render(<GiftCards o={buildGift(ctx.store)} />);
    expect(screen.getByRole('heading', { name: "Use a customer's gift card" })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Active cards')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Top up' })).not.toBeInTheDocument();
  });

  it('keeps demo card issuance available in local mode', async () => {
    const ctx = await setup(false);
    ctx.store.setState({ route: 'gift' });
    expect(buildOpsShell(ctx.store).primaryAction?.label).toContain('Sell gift card');
    expect(buildGift(ctx.store).liveGift).toBe(false);
    const form = { kind: 'gift' as const, v: { amount: '50', customerId: '', note: '' } };
    ctx.store.setOps({ form });
    await buildFormView(ctx.store, form).submit();
    expect(ctx.issue).toHaveBeenCalledOnce();
    expect(ctx.store.state.giftcards[0].balance).toBe(50);
  });
});
