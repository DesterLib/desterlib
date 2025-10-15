/**
 * Cache Middleware
 *
 * Express middleware for caching route responses
 */

import type { Request, Response, NextFunction } from "express";
import { cacheService } from "./cache.js";
import logger from "../config/logger.js";

interface CacheOptions {
  /**
   * Time-to-live in seconds. Defaults to CACHE_TTL env variable
   */
  ttl?: number;

  /**
   * Custom key generator function
   * Default: Uses request path and query string
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Condition to determine if request should be cached
   * Default: Only caches GET requests
   */
  shouldCache?: (req: Request) => boolean;
}

/**
 * Default key generator - uses method, path, and query params
 */
function defaultKeyGenerator(req: Request): string {
  const queryString = JSON.stringify(req.query);
  return `cache:${req.method}:${req.path}:${queryString}`;
}

/**
 * Default cache condition - only cache GET requests
 */
function defaultShouldCache(req: Request): boolean {
  return req.method === "GET";
}

/**
 * Cache middleware factory
 *
 * @example
 * // Cache for 1 hour
 * router.get('/expensive-query', cacheMiddleware({ ttl: 3600 }), handler);
 *
 * // Custom key generator
 * router.get('/user/:id', cacheMiddleware({
 *   keyGenerator: (req) => `user:${req.params.id}`
 * }), handler);
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl,
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if cache is disabled
    if (!cacheService.isEnabled()) {
      return next();
    }

    // Check if this request should be cached
    if (!shouldCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cached = await cacheService.get<unknown>(cacheKey);

      if (cached !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        res.setHeader("X-Cache", "HIT");
        return res.jsonOk(cached);
      }

      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader("X-Cache", "MISS");

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache the response
      res.json = function (data: unknown) {
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch((error) => {
          logger.error(`Failed to cache response for ${cacheKey}:`, error);
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`Cache middleware error for ${cacheKey}:`, error);
      // Don't block request on cache errors
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 * Useful for invalidating cache after mutations
 *
 * @example
 * // After creating a new movie, invalidate movie listings
 * await invalidateCache('cache:GET:/api/v1/movies*');
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await cacheService.delPattern(pattern);
}

/**
 * Invalidate cache by exact key
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  await cacheService.del(key);
}
