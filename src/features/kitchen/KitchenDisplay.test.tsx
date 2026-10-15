import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { createLocalBackend } from '../../dev/localBackend';
import { simulatedDevices } from '../../dev/simulatedDevices';
import { writeJSON } from '../../lib/storage';
import { dispatchCommand } from '../../services/commands';
import { Outbox } from '../../services/outbox';
import { PosStore } from '../../state/store';
import { testConfig } from '../../test/createTestStore';

function setup(width = 1440) {
  localStorage.clear();
  location.hash = '';
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  // A device a manager has already assigned to the kitchen.
  writeJSON('session', { device: { mode: 'kitchen', station: 'all', muted: false, by: 'Tom Ellery', at: '' } });
  const backend = createLocalBackend();
  const outbox = new Outbox((c, key) => dispatchCommand(backend, c, { idempotencyKey: key }));
  const store = new PosStore({ backend, devices: simulatedDevices, outbox, config: testConfig });
  render(<App store={store} />);
  return store;
}

afterEach(() => vi.useRealTimers());

const pressPin = async (pin: string) => {
  const dialog = screen.getByRole('dialog');
  for (const k of pin) {
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: k }));
    });
  }
};

describe('Kitchen display', () => {
  it('opens on a kitchen device after a kitchen PIN, and runs a ticket from new to ready', async () => {
    const store = setup();
    expect(await screen.findByText('Kitchen sign in')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('Kitchen sign in')).toBeInTheDocument();
    await pressPin('1111'); // Priya, cashier — has kitchen access
    expect(screen.queryByText('Kitchen sign in')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /EightyTwenty Kitchen/ })).toBeInTheDocument();
    // No till, prices or back office on the kitchen screen.
    expect(screen.queryByRole('navigation', { name: 'POS navigation' })).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();

    const ticket = () => screen.getByRole('article', { name: 'Order #8020-4471' });
    fireEvent.click(within(ticket()).getByRole('button', { name: 'Start' }));
    expect(store.state.orders.find((o) => o.id === '#8020-4471')!.status).toBe('preparing');
    // Past the double-tap guard: a deliberate second tap.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 1000);
    fireEvent.click(within(ticket()).getByRole('button', { name: 'Order ready' }));
    expect(store.state.orders.find((o) => o.id === '#8020-4471')!.status).toBe('ready');
    expect(screen.queryByRole('article', { name: 'Order #8020-4471' })).not.toBeInTheDocument();
    vi.setSystemTime(Date.now() + 1000);
    fireEvent.click(screen.getByRole('button', { name: 'Recall #8020-4471' }));
    expect(screen.getByRole('article', { name: 'Order #8020-4471' })).toBeInTheDocument();
  });

  it('filters by station and ignores back-office links', async () => {
    const store = setup(800);
    await screen.findByText('Kitchen sign in');
    await pressPin('1357');
    fireEvent.click(screen.getByRole('button', { name: /^Drinks/ }));
    expect(store.state.device.station).toBe('bar');
    const t = screen.getByRole('article', { name: 'Order #8020-4469' });
    expect(within(t).queryByText('Eggs Benedict')).not.toBeInTheDocument();
    expect(within(t).getByText('Milk Based Coffee')).toBeInTheDocument();
    expect(within(t).getByRole('button', { name: 'Barista ready' })).toBeInTheDocument();
    // Narrow (tablet) layout: ready orders open from a button.
    expect(screen.getByRole('button', { name: 'Show ready and recent orders' })).toBeInTheDocument();
    await act(async () => {
      location.hash = '#reports';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.queryByText('Manager access')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /EightyTwenty Kitchen/ })).toBeInTheDocument();
  });
});
