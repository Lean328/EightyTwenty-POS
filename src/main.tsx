import { StrictMode } from 'react';
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
