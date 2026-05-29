const store = new Map();

export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
  return entry.value;
}

export function set(key, value, ttlSeconds = 3600) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
