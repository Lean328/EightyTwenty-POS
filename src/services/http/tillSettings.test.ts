import { beforeEach, expect, it, vi } from 'vitest';
import { writeJSON } from '../../lib/storage';
import { createHttpBackend } from './httpBackend';
import type { HttpClient } from './httpClient';

beforeEach(() => {
  localStorage.clear();
  writeJSON('session', { cafe: 'braddon' });
});

it('sends operational toggles to the selected cafe with the original command key', async () => {
  const put = vi.fn().mockResolvedValue(undefined);
  const http = { get: vi.fn(), post: vi.fn(), put } as HttpClient;
  const backend = createHttpBackend(http);
  const patch = { toggles: { kitchen: true, receipt: false, tips: false, openDrawer: false, autoStamp: true } };
  const opts = { idempotencyKey: 'SETTINGS-001' };

  await backend.settings.update(patch, opts);

  expect(put).toHaveBeenCalledWith('/api/v1/pos/locations/braddon/settings/toggles', patch, opts);
});
