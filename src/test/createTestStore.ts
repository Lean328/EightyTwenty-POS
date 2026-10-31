import type { AppConfig } from '../config/env';
import { createLocalBackend } from '../dev/localBackend';
import { simulatedDevices } from '../dev/simulatedDevices';
import { dispatchCommand, type PosCommand } from '../services/commands';
import type { PosBackend } from '../services/contracts';
import { Outbox } from '../services/outbox';
import { PosStore } from '../state/store';

export const testConfig: AppConfig = {
  dataProvider: 'local',
  apiBaseUrl: '',
  apiTimeoutMs: 1000,
  terminalId: 'TEST-TILL',
  devTools: true,
  errors: [],
};

/** A signed-in store on the development backend, with every command the outbox delivers recorded in `sent`. */
export async function createTestStore(opts: { staffId?: string; backend?: PosBackend } = {}) {
  localStorage.clear();
  const backend = opts.backend ?? createLocalBackend();
  const sent: PosCommand[] = [];
  const outbox = new Outbox(async (command, key) => {
    sent.push(command);
    return dispatchCommand(backend, command, { idempotencyKey: key });
  });
  const store = new PosStore({ backend, devices: simulatedDevices, outbox, config: testConfig });
  await store.load();
  store.setState({ staffId: opts.staffId ?? 's1' });
  outbox.setOnline(true);
  const types = () => sent.map((c) => c.type);
  return { store, outbox, sent, types };
}

export const flush = () => new Promise((r) => setTimeout(r, 0));
