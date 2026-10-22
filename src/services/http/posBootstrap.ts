import type { MenuCategory } from '../../domain/types';
import { config } from '../../config/env';
import { getAccessToken } from './authSession';
import { createHttpClient } from './httpClient';
import { mapMenu, type PosMenuItemDto } from './posMapping';
import type { PosPinSession } from './posPinAuth';

export interface PosBootstrapDto {
  schemaVersion: number;
  session: Omit<PosPinSession, 'access'> & {
    terminalId: string;
  };
  location: {
    id: string;
    slug: string;
    name: string;
    address: string;
    status: string;
  };
  categories: MenuCategory[];
  menu: PosMenuItemDto[];
  unavailableItemIds: string[];
  capabilities: Record<string, boolean>;
}

export async function loadPosBootstrap() {
  const client = createHttpClient({
    baseUrl: config.apiBaseUrl,
    timeoutMs: config.apiTimeoutMs,
    terminalId: config.terminalId,
    getAccessToken,
  });

  const data = await client.get<PosBootstrapDto>(
    '/api/v1/pos/bootstrap',
  );

  if (data.schemaVersion !== 1) {
    throw new Error('Unsupported POS bootstrap version.');
  }

  if (data.session.terminalId !== config.terminalId) {
    throw new Error('Bootstrap belongs to another terminal.');
  }

  const mapped = mapMenu(data.menu);

  return {
    session: data.session,
    location: data.location,
    categories: data.categories,
    menu: mapped.menu,
    unavailableItemIds: mapped.unavailableItemIds,
    capabilities: data.capabilities,
  };
}