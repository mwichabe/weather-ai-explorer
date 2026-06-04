const PREFIX = 'wai-explorer:v1:';

export interface CacheEntry<T> {
  data: T;
  storedAt: number;
}

function safeStorage(): Storage | null {
  try {
    const probe = '__wai_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = typeof window !== 'undefined' ? safeStorage() : null;

export function cacheGet<T>(key: string): CacheEntry<T> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (typeof parsed?.storedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T): void {
  if (!storage) return;
  try {
    storage.setItem(PREFIX + key, JSON.stringify({ data, storedAt: Date.now() } satisfies CacheEntry<T>));
  } catch {
    // Quota exceeded — evict our oldest entries and retry once.
    evictOldest(5);
    try {
      storage.setItem(PREFIX + key, JSON.stringify({ data, storedAt: Date.now() }));
    } catch {
      /* give up silently — cache is an optimization, never a requirement */
    }
  }
}

export function isFresh(entry: CacheEntry<unknown>, ttlMs: number): boolean {
  return Date.now() - entry.storedAt < ttlMs;
}

function evictOldest(count: number): void {
  if (!storage) return;
  const ours: Array<{ key: string; storedAt: number }> = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const entry = JSON.parse(storage.getItem(key) ?? '') as CacheEntry<unknown>;
      ours.push({ key, storedAt: entry.storedAt ?? 0 });
    } catch {
      storage.removeItem(key);
    }
  }
  ours
    .sort((a, b) => a.storedAt - b.storedAt)
    .slice(0, count)
    .forEach(({ key }) => storage.removeItem(key));
}
