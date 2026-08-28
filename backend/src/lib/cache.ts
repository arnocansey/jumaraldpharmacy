import Redis from "ioredis";

// In-memory cache entry interface
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache storage (LRU / TTL Map)
const memoryCache = new Map<string, CacheEntry<any>>();
const MAX_MEMORY_KEYS = 5000;

// Cache performance stats
let cacheHits = 0;
let cacheMisses = 0;

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        connectTimeout: 3000,
        retryStrategy(times) {
          if (times > 3) return null; // stop reconnecting after 3 tries if redis is down
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true,
      });
      redis.on("error", (err) => {
        console.warn("[Redis] Connection warning (falling back to in-memory cache):", err.message);
      });
      redis.connect().catch(() => {
        console.info("[Cache] Redis not available, using in-memory high-speed cache.");
      });
    } catch {
      redis = null;
    }
  }
  return redis;
}

/**
 * Get value from Cache (Checks Memory first -> Redis second)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const now = Date.now();

  // 1. Check in-memory cache first (0.05ms)
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    if (memEntry.expiresAt > now) {
      cacheHits++;
      return memEntry.value as T;
    }
    // Expired
    memoryCache.delete(key);
  }

  // 2. Check Redis if configured
  const r = getRedis();
  if (r && r.status === "ready") {
    try {
      const data = await r.get(key);
      if (data) {
        cacheHits++;
        const parsed = JSON.parse(data) as T;
        // Populate local memory cache for faster subsequent reads
        memoryCache.set(key, { value: parsed, expiresAt: now + 30000 }); // 30s local buffer
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  cacheMisses++;
  return null;
}

/**
 * Set value in Cache (Writes to Memory + Redis)
 */
export async function cacheSet(key: string, value: any, ttlSeconds = 120): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;

  // 1. Write to in-memory cache
  if (memoryCache.size >= MAX_MEMORY_KEYS) {
    // Evict oldest 10%
    const keysToDelete = Array.from(memoryCache.keys()).slice(0, 500);
    for (const k of keysToDelete) memoryCache.delete(k);
  }
  memoryCache.set(key, { value, expiresAt });

  // 2. Write to Redis if configured
  const r = getRedis();
  if (r && r.status === "ready") {
    try {
      await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Memory cache is already populated
    }
  }
}

/**
 * Delete key(s) matching pattern (e.g. "products:*")
 */
export async function cacheDel(pattern: string): Promise<void> {
  // 1. Delete from in-memory cache
  const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  for (const k of memoryCache.keys()) {
    if (regexPattern.test(k)) {
      memoryCache.delete(k);
    }
  }

  // 2. Delete from Redis
  const r = getRedis();
  if (r && r.status === "ready") {
    try {
      const keys = await r.keys(pattern);
      if (keys.length > 0) {
        await r.del(...keys);
      }
    } catch {}
  }
}

/**
 * Fetch with automatic cache: checks cache, executes fetcher on miss, stores in cache
 */
export async function cacheFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 120
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const result = await fetcher();
  if (result !== null && result !== undefined) {
    await cacheSet(key, result, ttlSeconds);
  }
  return result;
}

/**
 * Flush all cache
 */
export async function cacheFlush(): Promise<void> {
  memoryCache.clear();
  const r = getRedis();
  if (r && r.status === "ready") {
    try {
      await r.flushdb();
    } catch {}
  }
}

/**
 * Get Cache Performance Metrics
 */
export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRatio = total > 0 ? ((cacheHits / total) * 100).toFixed(1) : "0.0";
  return {
    inMemoryKeysCount: memoryCache.size,
    cacheHits,
    cacheMisses,
    hitRatio: `${hitRatio}%`,
    redisActive: !!(redis && redis.status === "ready"),
  };
}
