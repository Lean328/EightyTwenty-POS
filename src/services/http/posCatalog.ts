import type { MenuCategory } from '../../domain/types';
import { config } from '../../config/env';
import { getAccessToken } from './authSession';
import { createHttpClient } from './httpClient';
import { mapMenu } from './posMapping';
import type { PosMenuItemDto } from './posMapping';

export async function loadPosCatalog(slug: string) {
  const client = createHttpClient({
    baseUrl: config.apiBaseUrl,
    timeoutMs: config.apiTimeoutMs,
    terminalId: config.terminalId,
    getAccessToken,
  });

  const base = `/api/v1/pos/locations/${encodeURIComponent(slug)}`;

  const categories = await client.get<MenuCategory[]>(
    `${base}/categories`,
  );

  const items = await client.get<PosMenuItemDto[]>(
    `${base}/menu`,
  );

  return {
    categories,
    ...mapMenu(items),
  };
}
