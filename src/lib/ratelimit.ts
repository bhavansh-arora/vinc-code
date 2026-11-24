import 'server-only';
import { headers } from 'next/headers';

/* Simple in-memory limits for public sign-up endpoints (one app instance). */
const store = globalThis as unknown as { __vincHits?: Map<string, number[]> };
const hits: Map<string, number[]> = store.__vincHits ??= new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'local').trim();
}

/** True if this key has made fewer than `limit` calls in the last `windowMs`; records the call. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const t = Date.now(), list = (hits.get(key) ?? []).filter(x => t - x < windowMs);
  if (list.length >= limit) { hits.set(key, list); return false; }
  list.push(t); hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(x => t - x < 3600_000)) hits.delete(k);
  return true;
}
