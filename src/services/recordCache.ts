// Last known working snapshot, kept on this till so it can start and keep trading through a connection drop.
// In the local development provider this cache *is* the data store.
import { readJSON, writeJSON } from '../lib/storage';
import type { PosSnapshot } from './contracts';

const KEY = 'records';
const VERSION = 1;

interface CacheEnvelope {
  version: number;
  savedAt: string;
  snapshot: PosSnapshot;
}

export function readCachedSnapshot(): { snapshot: PosSnapshot; savedAt: string } | null {
  const env = readJSON<CacheEnvelope | null>(KEY, null);
  if (!env || env.version !== VERSION || !env.snapshot) return null;
  return { snapshot: env.snapshot, savedAt: env.savedAt };
}

export function writeCachedSnapshot(snapshot: PosSnapshot): boolean {
  return writeJSON(KEY, { version: VERSION, savedAt: new Date().toISOString(), snapshot } satisfies CacheEnvelope);
}
