import { kv } from '@vercel/kv';

export async function get(key) {
  try {
    return await kv.get(`contrib3d:${key}`);
  } catch (error) {
    return null; // Fault-tolerant fallback to live API fetch
  }
}

export async function set(key, value, ttl = 3600) {
  try {
    await kv.set(`contrib3d:${key}`, value, { ex: ttl });
  } catch (e) {
    console.error("Cache persistence layer write error:", e);
  }
}
