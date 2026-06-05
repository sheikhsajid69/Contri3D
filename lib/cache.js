let kv;
try {
  kv = (await import('@vercel/kv')).kv;
} catch {
  kv = null;
}

const memStore = new Map();

export async function get(key) {
  if (kv) {
    try {
      return await kv.get(key);
    } catch {}
  }
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

export async function set(key, value, ttlSeconds = 3600) {
  if (kv) {
    try {
      await kv.set(key, value, { ex: ttlSeconds });
      return;
    } catch {}
  }
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
