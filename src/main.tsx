import { StrictMode } from 'react';
import { BosDeviceSignIn } from './app/BosDeviceSignIn';
import { readJSON, writeJSON, setStorageScope } from './lib/storage';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { StatusScreen } from './app/StatusScreen';
import { config } from './config/env';
import type { PosBackend } from './services/contracts';
import { dispatchCommand } from './services/commands';
import { unconnectedDevices, type DeviceHub } from './services/devices';
import { Outbox } from './services/outbox';
import { PosStore } from './state/store';
import './styles/global.css';

async function createDependencies(): Promise<{ backend: PosBackend; devices: DeviceHub }> {
  // VITE_DATA_PROVIDER is replaced at build time, so an http build never includes the development modules.
  if (import.meta.env.VITE_DATA_PROVIDER !== 'http') {
    const [{ createLocalBackend }, { simulatedDevices }] = await Promise.all([
      import('./dev/localBackend'),
      import('./dev/simulatedDevices'),
    ]);
    return { backend: createLocalBackend(), devices: config.devTools ? simulatedDevices : unconnectedDevices };
  }
  const { createHttpBackendFromConfig } = await import('./services/http/httpBackend');
  return { backend: createHttpBackendFromConfig(config), devices: unconnectedDevices };
}

async function main() {
  const root = createRoot(document.getElementById('root')!);
  if (config.errors.length) {
    root.render(
      <StatusScreen title="This till is not configured">
        {config.errors.map((e) => (
          <p key={e} style={{ margin: '0 0 6px' }}>
            {e}
          </p>
        ))}
        <p style={{ margin: 0 }}>See .env.example and README.md.</p>
      </StatusScreen>,
    );
    return;
  }
  if (config.dataProvider === 'http') {
    root.render(
      <StrictMode>
        <BosDeviceSignIn
          onReady={async (cafe, account) => {
            const scope = JSON.stringify([config.apiBaseUrl, config.terminalId, account, cafe]);
            setStorageScope(scope);

            const session = readJSON<Record<string, unknown>>('session', {});
            if (!writeJSON('session', { ...session, cafe, staffId: '' })) {
              throw new Error('Browser storage is unavailable. Allow storage before opening this till.');
            }

            const { backend, devices } = await createDependencies();
            const outbox = new Outbox((command, key) => dispatchCommand(backend, command, { idempotencyKey: key }));
            const store = new PosStore({ backend, devices, outbox, config });
            root.render(
              <StrictMode>
                <App store={store} />
              </StrictMode>,
            );
          }}
        />
      </StrictMode>,
    );
    return;
  }

  const { backend, devices } = await createDependencies();
  const outbox = new Outbox((command, key) => dispatchCommand(backend, command, { idempotencyKey: key }));
  const store = new PosStore({ backend, devices, outbox, config });
  root.render(
    <StrictMode>
      <App store={store} />
    </StrictMode>,
  );
}

void main();
