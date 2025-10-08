import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

class RedisManager {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const redisConfig: RedisConfig = {
        host: 'localhost',
        port: 6379,
        db: 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      // Parse Redis URL if provided
      if (config.REDIS_URL) {
        const redisUrl = new URL(config.REDIS_URL);
        redisConfig.host = redisUrl.hostname;
        redisConfig.port = parseInt(redisUrl.port) || 6379;
        redisConfig.password = redisUrl.password || undefined;
        redisConfig.db = parseInt(redisUrl.pathname.slice(1)) || 0;
      }

      this.client = new Redis(redisConfig);

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis ready');
      });

      this.client.on('error', (error) => {
        logger.error({ error: error.message }, 'Redis error');
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.info('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting');
      });
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to initialize Redis');
      this.client = null;
    }
  }

  public async connect(): Promise<void> {
    if (this.client && !this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error({ error: (error as Error).message }, 'Failed to connect to Redis');
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  public isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Basic cache operations
  public async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to set cache');
      return false;
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const value = await this.client.get(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to get cache');
      return null;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to delete cache');
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to check cache existence');
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to set cache expiration');
      return false;
    }
  }

  // Advanced cache operations
  public async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client || keys.length === 0) return [];

    try {
      const values = await this.client.mget(...keys);
      return values.map((value) => (value ? (JSON.parse(value) as T) : null));
    } catch (error) {
      logger.error(
        { error: (error as Error).message, keys },
        'Failed to get multiple cache values',
      );
      return [];
    }
  }

  public async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    if (!this.client || Object.keys(keyValuePairs).length === 0) return false;

    try {
      const serializedPairs: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value));
      }

      await this.client.mset(...serializedPairs);

      if (ttl) {
        const pipeline = this.client.pipeline();
        for (const key of Object.keys(keyValuePairs)) {
          pipeline.expire(key, ttl);
        }
        await pipeline.exec();
      }

      return true;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to set multiple cache values');
      return false;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error({ error: (error as Error).message, pattern }, 'Failed to get cache keys');
      return [];
    }
  }

  public async flush(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to flush cache');
      return false;
    }
  }

  // Hash operations for complex data
  public async hset(key: string, field: string, value: any): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error({ error: (error as Error).message, key, field }, 'Failed to set hash field');
      return false;
    }
  }

  public async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const value = await this.client.hget(key, field);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error: (error as Error).message, key, field }, 'Failed to get hash field');
      return null;
    }
  }

  public async hgetall<T = any>(key: string): Promise<Record<string, T> | null> {
    if (!this.client) return null;

    try {
      const hash = await this.client.hgetall(key);
      if (Object.keys(hash).length === 0) return null;

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value) as T;
      }
      return result;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to get hash');
      return null;
    }
  }

  public async hdel(key: string, field: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.hdel(key, field);
      return result > 0;
    } catch (error) {
      logger.error({ error: (error as Error).message, key, field }, 'Failed to delete hash field');
      return false;
    }
  }

  // List operations
  public async lpush(key: string, value: any): Promise<number | null> {
    if (!this.client) return null;

    try {
      return await this.client.lpush(key, JSON.stringify(value));
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to push to list');
      return null;
    }
  }

  public async rpop<T = any>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const value = await this.client.rpop(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to pop from list');
      return null;
    }
  }

  public async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    if (!this.client) return [];

    try {
      const values = await this.client.lrange(key, start, stop);
      return values.map((value) => JSON.parse(value) as T);
    } catch (error) {
      logger.error({ error: (error as Error).message, key }, 'Failed to get list range');
      return [];
    }
  }

  // Cache statistics
  public async getStats(): Promise<any> {
    if (!this.client) return null;

    try {
      const info = await this.client.info('memory');
      const dbSize = await this.client.dbsize();

      return {
        connected: this.isConnected,
        dbSize,
        memoryInfo: info,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to get Redis stats');
      return null;
    }
  }
}

// Create singleton instance
export const redisManager = new RedisManager();

// Cache helper functions
export const cache = {
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    return redisManager.set(fullKey, value, options?.ttl);
  },

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    return redisManager.get<T>(fullKey);
  },

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    return redisManager.del(fullKey);
  },

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    return redisManager.exists(fullKey);
  },

  async invalidatePattern(pattern: string): Promise<boolean> {
    const keys = await redisManager.keys(pattern);
    if (keys.length === 0) return true;

    try {
      if (redisManager.client) {
        await redisManager.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(
        { error: (error as Error).message, pattern },
        'Failed to invalidate cache pattern',
      );
      return false;
    }
  },
};

export default redisManager;



