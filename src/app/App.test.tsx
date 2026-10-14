import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createLocalBackend } from '../dev/localBackend';
import { simulatedDevices } from '../dev/simulatedDevices';
import { dispatchCommand } from '../services/commands';
import { Outbox } from '../services/outbox';
import { PosStore } from '../state/store';
import { testConfig } from '../test/createTestStore';
import { App } from './App';

function setup() {
  localStorage.clear();
  location.hash = '';
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
  const backend = createLocalBackend();
  const outbox = new Outbox((c, key) => dispatchCommand(backend, c, { idempotencyKey: key }));
  const store = new PosStore({ backend, devices: simulatedDevices, outbox, config: testConfig });
  render(<App store={store} />);
  return store;
}

const pressPin = async (pin: string) => {
  const dialog = screen.getByRole('dialog');
  for (const k of pin) {
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: k }));
    });
  }
};

describe('App', () => {
  it('requires a PIN, then opens the till and runs a sale to the receipt', async () => {
    const store = setup();
    expect(await screen.findByText('Sign in')).toBeInTheDocument();
    // The sign-in dialog cannot be dismissed.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    await pressPin('9999');
    expect(screen.getByText('PIN not recognised')).toBeInTheDocument();
    await pressPin('2468');
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Coffee & Hot Drinks' })).toBeInTheDocument();

    // Open a shift, add an item, take cash.
    fireEvent.click(screen.getByRole('button', { name: 'Shift and cash' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /open shift/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Turmeric Latte' }));
    expect(store.state.lines).toEqual([expect.objectContaining({ itemId: 'turmeric', qty: 1 })]);
    fireEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    const pay = within(screen.getByRole('dialog'));
    fireEvent.click(pay.getByRole('radio', { name: /Cash/ }));
    fireEvent.change(pay.getByPlaceholderText('Tendered'), { target: { value: '10' } });
    fireEvent.click(pay.getByRole('button', { name: /Take cash/ }));
    expect(store.state.dlg?.kind).toBe('receipt');
    expect(store.state.orders[0]).toMatchObject({ paid: true, total: 5.5 });
  });

  it('asks for a manager PIN before opening a locked section for a cashier', async () => {
    setup();
    await screen.findByText('Sign in');
    await pressPin('1111'); // Priya, cashier
    await act(async () => {
      location.hash = '#reports';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByText('Manager access')).toBeInTheDocument();
    expect(screen.getByText('Reports needs a manager or admin PIN.')).toBeInTheDocument();
  });
});
