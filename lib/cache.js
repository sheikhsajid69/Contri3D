const memStore = new Map();

export async function get(key) {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

export async function set(key, value, ttlSeconds = 3600) {
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
