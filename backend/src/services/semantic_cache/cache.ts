/**
 * Semantic cache implementation using Redis
 */

import Redis from 'ioredis';

const TTL = parseInt(process.env.SEMANTIC_CACHE_TTL_SECONDS || '3600', 10);
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';

let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true
    });
  }
  return redisClient;
}

/**
 * Get cached value by key
 * @param key - Cache key
 * @returns Cached object or null if not found
 */
export async function get_cached(key: string): Promise<Record<string, any> | null> {
  try {
    const client = getRedisClient();
    
    // Ensure connection
    if (client.status !== 'ready') {
      await client.connect();
    }
    
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('[Cache] Error getting cached value:', error);
    return null;
  }
}

/**
 * Set cached value with TTL
 * @param key - Cache key
 * @param obj - Object to cache
 */
export async function set_cached(key: string, obj: any): Promise<void> {
  try {
    const client = getRedisClient();
    
    // Ensure connection
    if (client.status !== 'ready') {
      await client.connect();
    }
    
    await client.setex(key, TTL, JSON.stringify(obj));
  } catch (error) {
    console.error('[Cache] Error setting cached value:', error);
  }
}

/**
 * Clear all cache entries (use with caution)
 */
export async function clear_cache(): Promise<void> {
  try {
    const client = getRedisClient();
    
    if (client.status !== 'ready') {
      await client.connect();
    }
    
    await client.flushdb();
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Close Redis connection
 */
export async function close_cache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
