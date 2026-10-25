import { expect, it, vi } from 'vitest';
import { dispatchCommand } from '../commands';
import { createHttpBackend } from './httpBackend';
import { createHttpClient } from './httpClient';

it('sends the staff session captured on the command in an HTTP header', async () => {
  const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const http = createHttpClient({
    baseUrl: 'https://api.test',
    timeoutMs: 1000,
    terminalId: 'TILL-1',
    getAccessToken: () => 'device-access',
    fetchImpl,
  });
  const backend = createHttpBackend(http);

  await dispatchCommand(
    backend,
    {
      type: 'order.status',
      orderId: 'ORDER-1',
      status: 'ready',
      note: '',
      staffToken: 'original-staff-session',
    },
    { idempotencyKey: 'CMD-1' },
  );

  const [, init] = fetchImpl.mock.calls[0];
  expect(init.headers).toMatchObject({
    Authorization: 'Bearer device-access',
    'X-Pos-Staff': 'original-staff-session',
    'Idempotency-Key': 'CMD-1',
  });
  expect(JSON.parse(init.body)).toEqual({ status: 'ready', note: '' });
});
