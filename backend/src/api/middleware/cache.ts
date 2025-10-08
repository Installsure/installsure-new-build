import { Request, Response, NextFunction } from 'express';
import { cache } from '../../infra/redis.js';
import { logger } from '../../infra/logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

// Cache middleware for GET requests
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    prefix = 'api',
    keyGenerator = defaultKeyGenerator,
    condition = defaultCondition,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching is enabled for this request
    if (!condition(req, res)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const childLogger = logger.child({ requestId: req.requestId, cacheKey });

    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey, { prefix, ttl });

      if (cachedData !== null) {
        childLogger.debug('Cache hit');
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      childLogger.debug('Cache miss');

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response data
        cache.set(cacheKey, data, { prefix, ttl }).catch((error) => {
          childLogger.error({ error: error.message }, 'Failed to cache response');
        });

        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Cache middleware error');
      next();
    }
  };
};

// Default key generator
const defaultKeyGenerator = (req: Request): string => {
  const userId = req.user?.id || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  return `${userId}:${path}:${query}`;
};

// Default condition - cache all GET requests except those with no-cache header
const defaultCondition = (req: Request, res: Response): boolean => {
  return !req.headers['cache-control']?.includes('no-cache');
};

// Cache invalidation middleware
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data: any) {
      // Invalidate cache patterns after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          try {
            await cache.invalidatePattern(pattern);
            logger.debug({ pattern, requestId: req.requestId }, 'Cache invalidated');
          } catch (error) {
            logger.error(
              {
                error: (error as Error).message,
                pattern,
                requestId: req.requestId,
              },
              'Failed to invalidate cache',
            );
          }
        }
      }

      return originalJson(data);
    };

    next();
  };
};

// Cache decorator for service methods
export const cached = (options: CacheOptions = {}) => {
  const { ttl = 300, prefix = 'service', keyGenerator } = options;

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Try to get from cache
        const cachedResult = await cache.get(cacheKey, { prefix, ttl });

        if (cachedResult !== null) {
          logger.debug({ cacheKey }, 'Service cache hit');
          return cachedResult;
        }

        logger.debug({ cacheKey }, 'Service cache miss');

        // Execute the original method
        const result = await method.apply(this, args);

        // Cache the result
        await cache.set(cacheKey, result, { prefix, ttl });

        return result;
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            cacheKey,
          },
          'Service cache error',
        );

        // Fall back to original method
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
};

// Cache warming utility
export const warmCache = async (
  key: string,
  dataFetcher: () => Promise<any>,
  options: CacheOptions = {},
) => {
  const { ttl = 300, prefix = 'warm' } = options;

  try {
    logger.info({ key }, 'Warming cache');
    const data = await dataFetcher();
    await cache.set(key, data, { prefix, ttl });
    logger.info({ key }, 'Cache warmed successfully');
    return data;
  } catch (error) {
    logger.error({ error: (error as Error).message, key }, 'Failed to warm cache');
    throw error;
  }
};

// Cache statistics endpoint
export const getCacheStats = async (req: Request, res: Response) => {
  try {
    const stats = await cache.get('stats', { prefix: 'redis' });

    res.json({
      cache: {
        enabled: true,
        stats: stats || { message: 'Cache stats not available' },
      },
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to get cache stats');
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
};



