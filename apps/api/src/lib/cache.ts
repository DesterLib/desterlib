/**
 * Redis Cache Service
 *
 * Provides a caching layer for expensive queries and operations.
 * Cache is optional and can be enabled via CACHE_ENABLED env variable.
 */

import { Redis } from "ioredis";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

class CacheService {
  private client: Redis | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = env.CACHE_ENABLED;
    if (this.enabled) {
      this.connect();
    } else {
      logger.info(
        "Cache is disabled. Set CACHE_ENABLED=true to enable Redis caching."
      );
    }
  }

  /**
   * Connect to Redis
   */
  private connect(): void {
    try {
      // Use Redis URL if provided, otherwise use individual config
      if (env.REDIS_URL) {
        this.client = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      } else {
        this.client = new Redis({
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
          db: env.REDIS_DB,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      }

      this.client.on("connect", () => {
        logger.info(
          `✅ Redis cache connected to ${env.REDIS_HOST}:${env.REDIS_PORT}`
        );
      });

      this.client.on("error", (error: Error) => {
        logger.error("Redis cache error:", error);
        // Don't crash the app, just disable cache
        this.enabled = false;
      });

      this.client.on("close", () => {
        logger.warn("Redis cache connection closed");
      });
    } catch (error) {
      logger.error("Failed to initialize Redis cache:", error);
      this.enabled = false;
      this.client = null;
    }
  }

  /**
   * Check if cache is available and enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled() || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const expirationSeconds = ttl || env.CACHE_TTL;

      await this.client.setex(key, expirationSeconds, serialized);
      logger.debug(`Cache set: ${key} (TTL: ${expirationSeconds}s)`);
    } catch (error) {
      logger.error(`Cache set error for key "${key}":`, error);
    }
  }

  /**
   * Delete a specific key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key "${key}":`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(
          `Cache deleted ${keys.length} keys matching pattern: ${pattern}`
        );
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for "${pattern}":`, error);
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    try {
      await this.client.flushdb();
      logger.info("Cache cleared");
    } catch (error) {
      logger.error("Cache clear error:", error);
    }
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    logger.debug(`Cache miss: ${key}`);

    // If not in cache, execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);

    return result;
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled() || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key in seconds
   */
  async ttl(key: string): Promise<number> {
    if (!this.isEnabled() || !this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key "${key}":`, error);
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (!this.isEnabled() || !this.client) {
      return 0;
    }

    try {
      const value = await this.client.incr(key);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error(`Cache incr error for key "${key}":`, error);
      return 0;
    }
  }

  /**
   * Gracefully close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info("Redis cache connection closed gracefully");
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
