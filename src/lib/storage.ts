// Namespaced, failure-tolerant localStorage access (private mode, quota and disabled storage all degrade to no-ops).

let NS = 'et-pos:v2:';

/** Set before creating the store or outbox. Existing namespaces are preserved. */
export function setStorageScope(scope: string): void {
  NS = `et-pos:bos-v1:${encodeURIComponent(scope)}:`;
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Returns false when the value could not be stored (quota exceeded, storage disabled). */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* storage unavailable */
  }
}
