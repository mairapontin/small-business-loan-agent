/**
 * @module: Small Business Loan Agent
 * @file: src/services/responseCache.ts
 * @description: In-memory response cache for Gemini API calls
 * @author: Maíra Pontin
 * @created: 2026-09-24
 * @updated: 260924_012808
 * @version: 1.0.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 100;

const cache = new Map<string, CacheEntry<any>>();
const TTL_MS = parseInt(process.env.GEMINI_CACHE_TTL_MS || String(DEFAULT_TTL_MS), 10);
const MAX_SIZE = parseInt(process.env.GEMINI_CACHE_MAX_SIZE || String(DEFAULT_MAX_SIZE), 10);

let hits = 0;
let misses = 0;

function hashKey(obj: unknown): string {
  const json = JSON.stringify(obj);
  return createHash('sha256').update(json).digest('hex');
}

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}

function evictOldest(): void {
  if (cache.size <= MAX_SIZE) return;
  const firstKey = cache.keys().next().value;
  if (firstKey) cache.delete(firstKey);
}

export function getCached<T>(key: unknown): T | null {
  const hash = hashKey(key);
  const entry = cache.get(hash);
  if (!entry) {
    misses++;
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    cache.delete(hash);
    misses++;
    return null;
  }
  hits++;
  return entry.value as T;
}

export function setCache<T>(key: unknown, value: T): void {
  evictExpired();
  evictOldest();
  const hash = hashKey(key);
  cache.set(hash, {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getCacheStats(): { size: number; hits: number; misses: number; hitRate: string } {
  const total = hits + misses;
  return {
    size: cache.size,
    hits,
    misses,
    hitRate: total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%',
  };
}

export function clearCache(): void {
  cache.clear();
  hits = 0;
  misses = 0;
}
