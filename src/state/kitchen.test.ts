// Kitchen display workflows on the shared order store: station routing, item-level preparation, eligibility,
// amendments and cancellations, duplicate taps, offline queueing, device setup and permissions.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { linePrep, stationPrep } from '../domain/kitchen';
import type { Order } from '../domain/types';
import { buildPinDialog } from '../features/dialogs/till-dialogs.view';
import { buildKitchenView } from '../features/kitchen/kitchen.view';
import { KitchenMonitor } from '../features/kitchen/kitchenMonitor';
import { buildSettings } from '../features/ops/settings.view';
import { createLocalBackend } from '../dev/localBackend';
import { readJSON } from '../lib/storage';
import { flush, createTestStore } from '../test/createTestStore';
import { requireSignIn } from './actions/auth';
import { assignDevice, bumpStation, finishTicket, lockKitchen, recallTicket, toggleLine } from './actions/kitchen';
import { acceptOrder, applyOrderAction } from './actions/orders';
import { pullRemoteOrders, runSync, setOnline } from './actions/sync';
import type { PosStore } from './store';
import type { DialogOf } from './types';

// Seed order #8020-4469: dine-in open tab, preparing — Eggs Benedict + French Toast (kitchen), 2× coffee (barista).
const MIXED = '#8020-4469';
const get = (store: PosStore, id = MIXED) => store.state.orders.find((o) => o.id === id)!;
const prepOf = (store: PosStore, id = MIXED) => {
  const o = get(store, id);
  return Object.fromEntries(o.lines.map((l) => [l.itemId, linePrep(o, l)]));
};
const pressPin = async (store: PosStore, pin: string) => {
  for (const k of pin) {
    await buildPinDialog(store, store.state.dlg as DialogOf<'pin'>)
      .keys.find((x) => x.label === k)!
      .pick();
    await flush();
  }
};
/** Let the double-tap guard window pass (only Date is faked, so the outbox and other timers still run). */
const later = () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 1000);
};
afterEach(() => vi.useRealTimers());

const view = (store: PosStore) =>
  buildKitchenView(store, { now: Date.now(), monitor: { firstSeen: {}, alerts: [] }, dismissAlert: () => {}, pending: 0 });

describe('kitchen display · preparation', () => {
  it('readies a mixed order only when both kitchen and barista are done, and tells the backend each step', async () => {
    const { store, outbox, sent } = await createTestStore();
    store.setState((s) => ({ device: { ...s.device, mode: 'kitchen' } }));
    expect(bumpStation(store, MIXED, 'bar', 'preparing')).toBe(true);
    expect(prepOf(store)).toEqual({ benedict: 'preparing', hotcoffee: 'ready', ftoast: 'preparing' });
    expect(get(store).status).toBe('preparing');

    const benedict = get(store).lines.find((l) => l.itemId === 'benedict')!;
    expect(toggleLine(store, MIXED, benedict.key, 'preparing')).toBe(true);
    expect(get(store).status).toBe('preparing');
    expect(bumpStation(store, MIXED, 'kitchen', 'preparing')).toBe(true);
    expect(get(store).status).toBe('ready');
    expect(get(store).history!.at(-1)!.what).toMatch(/^Ready for pickup · Nadia Rahman/);

    await outbox.flush();
    const prep = sent.filter((c) => c.type === 'order.prep');
    expect(prep.map((c) => c.type === 'order.prep' && c.status)).toEqual(['preparing', 'preparing', 'ready']);
    expect(prep[2]).toMatchObject({ orderId: MIXED, lines: expect.arrayContaining([expect.objectContaining({ prep: 'ready' })]) });
  });

  it('ignores a double tap and a tap on a ticket that changed since it was drawn', async () => {
    const { store, outbox, sent } = await createTestStore();
    const id = '#8020-4471'; // app order, new
    expect(bumpStation(store, id, 'all', 'new')).toBe(true);
    expect(bumpStation(store, id, 'all', 'new')).toBe(false); // second tap of "Start"
    // A double tap that lands on the "Order ready" button which just replaced "Start" is ignored too.
    expect(bumpStation(store, id, 'all', 'preparing')).toBe(false);
    expect(store.state.toast ?? '').not.toMatch(/updated/);
    expect(get(store, id).status).toBe('preparing');
    later();
    expect(bumpStation(store, id, 'all', 'preparing')).toBe(true);
    later();
    // A stale "Start" from a screen that has not caught up: the order is ready now.
    expect(bumpStation(store, id, 'all', 'new')).toBe(false);
    expect(store.state.toast).toBe(`${id} was updated — check the ticket again`);
    await outbox.flush();
    expect(sent.filter((c) => c.type === 'order.prep')).toHaveLength(2);
    expect(get(store, id).status).toBe('ready');
  });

  it('recalls a ready ticket back to preparing at one station', async () => {
    const { store } = await createTestStore();
    const id = '#8020-4467'; // app order, ready: smoothie (bar) + açai bowl (kitchen)
    expect(recallTicket(store, id, 'bar')).toBe(true);
    expect(get(store, id).status).toBe('preparing');
    expect(stationPrep(get(store, id), 'bar', store.state.catalog.menuById)).toBe('preparing');
    expect(stationPrep(get(store, id), 'kitchen', store.state.catalog.menuById)).toBe('ready');
  });

  it('routes tickets to the food and drinks screens and shows what the other station is doing', async () => {
    const { store } = await createTestStore();
    bumpStation(store, MIXED, 'bar', 'preparing');
    store.setState((s) => ({ device: { ...s.device, station: 'bar' } }));
    let v = view(store);
    expect(v.tickets.map((t) => t.id)).not.toContain(MIXED);
    expect(v.readyRows.find((r) => r.id === MIXED)).toMatchObject({ waiting: true, label: 'Done here · waiting on Kitchen' });
    store.setState((s) => ({ device: { ...s.device, station: 'kitchen' } }));
    v = view(store);
    const t = v.tickets.find((x) => x.id === MIXED)!;
    expect(t.groups.map((g) => g.station)).toEqual(['kitchen']);
    expect(t.elsewhere).toBe('Also on this order: Barista ready');
    expect(t.primary!.label).toBe('Kitchen ready');
  });

  it('shows dietary and allergy alerts from items and the customer profile', async () => {
    const { store } = await createTestStore();
    const t = view(store).tickets.find((x) => x.id === '#8020-4468')!; // Brekky Roll with "No gluten (GFO)"
    expect(t.alerts).toEqual([{ text: 'No gluten (GFO)', severity: 'dietary' }]);
    expect(t.groups[0].lines[0].diet).toEqual([{ text: 'No gluten (GFO)', severity: 'dietary' }]);
    store.setState((s) => ({ orders: s.orders.map((o) => (o.id === '#8020-4468' ? { ...o, customerId: 'c4' } : o)) })); // nut allergy
    expect(view(store).tickets.find((x) => x.id === '#8020-4468')!).toMatchObject({ allergy: true });
  });
});

describe('kitchen display · eligibility, amendments and cancellations', () => {
  it('will not start an order whose online payment failed or that is waiting for acceptance', async () => {
    const { store } = await createTestStore();
    const failed: Order = { ...get(store, '#8020-4470'), id: '#8020-9001', status: 'failed', paid: false, payments: [] };
    const incoming: Order = { ...get(store, '#8020-4470'), id: '#8020-9002', accepted: false };
    store.setState((s) => ({ orders: [failed, incoming, ...s.orders] }));
    expect(bumpStation(store, failed.id, 'all', 'new')).toBe(false);
    expect(store.state.toast).toBe('#8020-9001: Payment not captured — do not prepare');
    expect(bumpStation(store, incoming.id, 'all', 'new')).toBe(false);
    const t = view(store).tickets.find((x) => x.id === incoming.id)!;
    expect(t.primary).toBeNull();
    expect(t.hold).toMatchObject({ text: 'Waiting for the counter to accept this order' });
    t.hold!.accept!();
    t.hold!.accept!(); // double tap: accepted once
    expect(get(store, incoming.id)).toMatchObject({ accepted: true, status: 'preparing' });
    expect(get(store, incoming.id).history!.filter((h) => h.what.startsWith('Accepted'))).toHaveLength(1);
    expect(bumpStation(store, incoming.id, 'all', 'preparing')).toBe(true);
  });

  it('stops work on a cancelled order and alerts the kitchen', async () => {
    const { store } = await createTestStore();
    const monitor = new KitchenMonitor(store);
    const stop = monitor.start();
    applyOrderAction(store, MIXED, { mode: 'cancel', sel: {}, amountC: 0, reason: 'Customer cancelled', key: 'R-cancel' }, null);
    expect(get(store).status).toBe('cancelled');
    expect(monitor.getSnapshot().alerts).toEqual([expect.objectContaining({ orderId: MIXED, kind: 'cancelled' })]);
    expect(bumpStation(store, MIXED, 'all', 'preparing')).toBe(false);
    expect(store.state.toast).toBe(`${MIXED} is cancelled — no change made`);
    expect(view(store).tickets.map((t) => t.id)).not.toContain(MIXED);
    stop();
  });

  it('handles items voided after preparation started, including finishing a ticket whose remaining items are done', async () => {
    const { store } = await createTestStore();
    const monitor = new KitchenMonitor(store);
    const stop = monitor.start();
    bumpStation(store, MIXED, 'bar', 'preparing'); // coffees ready, food still cooking
    const food = get(store).lines.filter((l) => l.itemId !== 'hotcoffee');
    applyOrderAction(
      store,
      MIXED,
      {
        mode: 'void',
        sel: Object.fromEntries(food.map((l) => [l.key, l.qty])),
        amountC: 0,
        reason: 'Customer changed order',
        key: 'R-void',
      },
      null,
    );
    expect(get(store).lines.map((l) => l.itemId)).toEqual(['hotcoffee']);
    expect(monitor.getSnapshot().alerts[0]).toMatchObject({ kind: 'changed', orderId: MIXED });
    const t = view(store).tickets.find((x) => x.id === MIXED)!;
    expect(t.removed).toEqual(['1 item', '1 item']);
    expect(t.primary!.label).toBe('Send to pickup');
    expect(finishTicket(store, MIXED)).toBe(true);
    expect(get(store).status).toBe('ready');
    stop();
  });

  it('announces new tickets once, not on start-up or when switching station', async () => {
    const { store } = await createTestStore();
    const monitor = new KitchenMonitor(store);
    const stop = monitor.start();
    expect(monitor.getSnapshot().firstSeen).toEqual({});
    store.setState((s) => ({ device: { ...s.device, station: 'bar' } }));
    expect(monitor.getSnapshot().firstSeen).toEqual({});
    const o: Order = { ...get(store, '#8020-4471'), id: '#8020-9100' };
    store.setState((s) => ({ orders: [o, ...s.orders] }));
    expect(Object.keys(monitor.getSnapshot().firstSeen)).toEqual(['#8020-9100']);
    stop();
  });
});

describe('kitchen display · connection', () => {
  it('keeps working offline: changes apply on screen and are delivered in order when back online', async () => {
    const { store, outbox, sent } = await createTestStore();
    setOnline(store, false);
    bumpStation(store, MIXED, 'all', 'preparing');
    expect(get(store).status).toBe('ready');
    expect(outbox.pending.map((e) => e.command.type)).toContain('order.prep');
    expect(sent.filter((c) => c.type === 'order.prep')).toHaveLength(0);
    expect(
      buildKitchenView(store, { now: Date.now(), monitor: { firstSeen: {}, alerts: [] }, dismissAlert: () => {}, pending: 1 }).banner,
    ).toMatchObject({
      title: 'Offline — working from this screen',
    });
    setOnline(store, true);
    await runSync(store);
    expect(sent.filter((c) => c.type === 'order.prep')).toHaveLength(1);
    expect(outbox.pending).toHaveLength(0);
  });

  it('shows reconnecting when the order feed fails, and the front counter hears when the kitchen marks an order ready', async () => {
    const local = createLocalBackend();
    let feed: () => Promise<{ orders: Order[]; cursor: string }> = async () => ({ orders: [], cursor: '1' });
    const backend = { ...local, kind: 'http' as const, orders: { ...local.orders, listChanged: () => feed() } };
    const { store } = await createTestStore({ backend });
    feed = async () => {
      throw new Error('unreachable');
    };
    await pullRemoteOrders(store, null);
    store.setState((s) => ({ device: { ...s.device, mode: 'kitchen' } }));
    expect(view(store).banner).toMatchObject({ title: 'Reconnecting to the EightyTwenty server…' });

    store.setState((s) => ({ device: { ...s.device, mode: 'counter' } }));
    const readyElsewhere: Order = { ...get(store), status: 'ready' };
    feed = async () => ({ orders: [readyElsewhere], cursor: '2' });
    await pullRemoteOrders(store, '1');
    expect(store.state.orderFeed).toMatchObject({ ok: true });
    expect(get(store).status).toBe('ready');
    expect(store.state.toast).toBe(`${MIXED} is ready for pickup`);
  });
});

describe('kitchen display · device setup and access', () => {
  it('needs a manager PIN to assign a device, then remembers it and opens the kitchen display on restart', async () => {
    const { store } = await createTestStore({ staffId: 's3' }); // Priya, cashier
    buildSettings(store)
      .thisDevice.kitchenOptions.find((k) => k.id === 'bar')!
      .pick();
    expect(store.state.dlg).toMatchObject({ kind: 'pin', perm: 'devices' });
    await pressPin(store, '1111'); // the cashier's own PIN is not enough
    expect((store.state.dlg as DialogOf<'pin'>).err).toMatch(/not permitted/);
    await pressPin(store, '1357'); // Tom, manager
    expect(store.state.device).toMatchObject({ mode: 'kitchen', station: 'bar', by: 'Tom Ellery' });
    expect(store.state.dlg).toBeNull(); // the cashier has kitchen access, so stays signed in
    expect(store.state.audit[0]).toMatchObject({
      action: 'Device assigned',
      detail: 'Kitchen display · Drinks · Barista',
      approver: 'Tom Ellery',
    });
    store.flushPersistence();
    expect(readJSON<{ device?: unknown }>('session', {}).device).toMatchObject({ mode: 'kitchen', station: 'bar' });
  });

  it('asks for a PIN with kitchen access on a kitchen device and refuses staff without it', async () => {
    const { store } = await createTestStore({ staffId: 's3' });
    store.setState((s) => ({
      device: { ...s.device, mode: 'kitchen' },
      roles: { ...s.roles, cashier: { ...s.roles.cashier, perms: s.roles.cashier.perms.filter((p) => p !== 'kitchen') } },
    }));
    expect(bumpStation(store, MIXED, 'all', 'preparing')).toBe(false);
    expect(store.state.toast).toBe('Sign in with a kitchen PIN to update tickets');
    lockKitchen(store);
    expect(store.state.dlg).toMatchObject({ kind: 'pin', title: 'Kitchen sign in', perm: 'kitchen', required: true });
    expect(store.signedIn).toBe(false);
    await pressPin(store, '1357'); // manager
    expect(store.state.staffId).toBe('s2');
  });

  it('keeps sign-in on a front counter device exactly as before', async () => {
    const { store } = await createTestStore();
    store.setState({ staffId: '' });
    requireSignIn(store);
    expect(store.state.dlg).toMatchObject({ title: 'Sign in', body: 'Enter your 4-digit PIN to start using the till.', perm: 'pos' });
  });

  it('switches a kitchen device back to the front counter with a manager PIN', async () => {
    const { store } = await createTestStore({ staffId: 's3' });
    store.setState((s) => ({ device: { ...s.device, mode: 'kitchen' } }));
    assignDevice(store, 'counter');
    await pressPin(store, '1357');
    expect(store.state.device.mode).toBe('counter');
  });

  it('acceptOrder on the counter and a kitchen tap on the same order do not double-apply', async () => {
    const { store } = await createTestStore();
    const incoming: Order = { ...get(store, '#8020-4470'), id: '#8020-9003', accepted: false };
    store.setState((s) => ({ orders: [incoming, ...s.orders] }));
    acceptOrder(store, incoming.id);
    expect(bumpStation(store, incoming.id, 'all', 'new')).toBe(false); // the counter already started it
    expect(get(store, incoming.id).status).toBe('preparing');
  });
});
