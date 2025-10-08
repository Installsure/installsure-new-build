/**
 * Redis Connection and Management Module
 * Production-grade Redis client with connection pooling, retry logic, and health monitoring
 * Production Hardening - Phase 2
 */

import Redis, { RedisOptions, Cluster } from 'ioredis';
import { config } from './env.js';
import { logger } from './logger.js';

// Redis connection states
export enum RedisConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting', 
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error'
}

// Redis client wrapper with enhanced functionality
export class RedisClient {
  private client: Redis | Cluster;
  private connectionState: RedisConnectionState = RedisConnectionState.Disconnected;
  private healthCheckInterval?: NodeJS.Timeout;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;

  constructor(options?: Partial<RedisOptions>) {
    const redisConfig: RedisOptions = {
      // Connection settings
      host: new URL(config.redis.url).hostname,
      port: parseInt(new URL(config.redis.url).port) || 6379,
      db: config.redis.db,
      password: config.redis.password,
      
      // Connection pool settings
      maxRetriesPerRequest: config.redis.retryAttempts,
      connectTimeout: 10000,
      commandTimeout: 5000,
      
      // Retry configuration
      retryDelayOnClusterDown: config.redis.retryDelay,
      
      // Keep-alive settings
      keepAlive: 30000,
      
      // Logging
      showFriendlyErrorStack: !config.isProduction,
      
      // Custom retry logic
      retryDelayOnFailover: (failoverCount) => {
        return Math.min(failoverCount * 1000, 10000);
      },
      
      // Override with provided options
      ...options,
    };

    // Create Redis client
    if (config.redis.url.includes('cluster')) {
      // Redis Cluster configuration
      const clusterNodes = config.redis.url.split(',').map(url => {
        const parsed = new URL(url);
        return {
          host: parsed.hostname,
          port: parseInt(parsed.port) || 6379,
        };
      });
      
      this.client = new Cluster(clusterNodes, {
        redisOptions: redisConfig,
        enableOfflineQueue: false,
        maxRetriesPerRequest: config.redis.retryAttempts,
      });
    } else {
      // Single Redis instance
      this.client = new Redis(redisConfig);
    }

    this.setupEventHandlers();
    this.startHealthCheck();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.connectionState = RedisConnectionState.Connected;
      this.connectionAttempts = 0;
      logger.info('✅ Redis connected successfully', {
        url: config.redis.url,
        db: config.redis.db,
      });
    });

    this.client.on('ready', () => {
      this.connectionState = RedisConnectionState.Connected;
      logger.info('🚀 Redis client ready for commands');
    });

    this.client.on('error', (error) => {
      this.connectionState = RedisConnectionState.Error;
      this.connectionAttempts++;
      
      logger.error('❌ Redis connection error', {
        error: error.message,
        attempts: this.connectionAttempts,
        maxAttempts: this.maxConnectionAttempts,
      });

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        logger.error('🚨 Max Redis connection attempts reached, giving up');
        this.disconnect();
      }
    });

    this.client.on('reconnecting', (delay) => {
      this.connectionState = RedisConnectionState.Reconnecting;
      logger.warn('🔄 Redis reconnecting...', { delay, attempts: this.connectionAttempts });
    });

    this.client.on('end', () => {
      this.connectionState = RedisConnectionState.Disconnected;
      logger.warn('🔌 Redis connection ended');
    });

    this.client.on('close', () => {
      this.connectionState = RedisConnectionState.Disconnected;
      logger.warn('📴 Redis connection closed');
    });
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        logger.error('💔 Redis health check failed', { error: error.message });
      }
    }, config.monitoring.healthCheck.interval);
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.connectionState === RedisConnectionState.Connected) {
      return;
    }

    this.connectionState = RedisConnectionState.Connecting;
    
    try {
      await this.client.ping();
      logger.info('🔗 Redis connection established');
    } catch (error) {
      this.connectionState = RedisConnectionState.Error;
      throw new Error(`Failed to connect to Redis: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.client) {
      await this.client.quit();
      this.connectionState = RedisConnectionState.Disconnected;
      logger.info('👋 Redis connection closed gracefully');
    }
  }

  // Health check
  async ping(): Promise<string> {
    try {
      const result = await this.client.ping();
      return result;
    } catch (error) {
      throw new Error(`Redis ping failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    memory: any;
    info: any;
  }> {
    try {
      const startTime = Date.now();
      await this.ping();
      const latency = Date.now() - startTime;

      const info = await this.client.info();
      const memory = await this.client.memory('usage');

      return {
        status: 'healthy',
        latency,
        memory,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1,
        memory: null,
        info: { error: error.message },
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const parsed: Record<string, any> = {};
    const sections = info.split('\r\n\r\n');
    
    sections.forEach(section => {
      const lines = section.split('\r\n');
      const sectionName = lines[0].replace('# ', '');
      parsed[sectionName] = {};
      
      lines.slice(1).forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value !== undefined) {
            parsed[sectionName][key] = isNaN(Number(value)) ? value : Number(value);
          }
        }
      });
    });
    
    return parsed;
  }

  // Key-Value operations
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      throw error;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<'OK'> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        return await this.client.setex(key, ttl, serialized);
      }
      return await this.client.set(key, serialized);
    } catch (error) {
      logger.error('Redis SET error', { key, ttl, error: error.message });
      throw error;
    }
  }

  async del(key: string | string[]): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, ttl, error: error.message });
      throw error;
    }
  }

  // Hash operations
  async hget<T = string>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis HGET error', { key, field, error: error.message });
      throw error;
    }
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    try {
      const serialized = JSON.stringify(value);
      return await this.client.hset(key, field, serialized);
    } catch (error) {
      logger.error('Redis HSET error', { key, field, error: error.message });
      throw error;
    }
  }

  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    try {
      const hash = await this.client.hgetall(key);
      if (Object.keys(hash).length === 0) return null;
      
      const parsed: Record<string, any> = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      return parsed as T;
    } catch (error) {
      logger.error('Redis HGETALL error', { key, error: error.message });
      throw error;
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      logger.error('Redis LPUSH error', { key, error: error.message });
      throw error;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis RPOP error', { key, error: error.message });
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error('Redis LLEN error', { key, error: error.message });
      throw error;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serialized = JSON.stringify(message);
      return await this.client.publish(channel, serialized);
    } catch (error) {
      logger.error('Redis PUBLISH error', { channel, error: error.message });
      throw error;
    }
  }

  // Transaction support
  multi() {
    return this.client.multi();
  }

  // Stream operations (for advanced use cases)
  async xadd(key: string, id: string, ...args: any[]): Promise<string> {
    try {
      return await this.client.xadd(key, id, ...args);
    } catch (error) {
      logger.error('Redis XADD error', { key, id, error: error.message });
      throw error;
    }
  }

  // Connection state getters
  get state(): RedisConnectionState {
    return this.connectionState;
  }

  get isConnected(): boolean {
    return this.connectionState === RedisConnectionState.Connected;
  }

  get isHealthy(): boolean {
    return this.connectionState === RedisConnectionState.Connected;
  }

  // Raw client access (use sparingly)
  get raw(): Redis | Cluster {
    return this.client;
  }
}

// Singleton instance
let redisClient: RedisClient | null = null;

export function createRedisClient(options?: Partial<RedisOptions>): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient(options);
  }
  return redisClient;
}

export function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}

// Default export
export default {
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  RedisConnectionState,
};