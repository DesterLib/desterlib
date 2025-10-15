/**
 * Enhanced Rate Limiting
 *
 * Provides flexible rate limiting with:
 * - Per-IP rate limiting (default)
 * - Per-user rate limiting (authenticated)
 * - Endpoint-specific rate limits
 * - Redis-backed distributed rate limiting (optional)
 */

import { rateLimit, type Options } from "express-rate-limit";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { cacheService } from "./cache.js";
import logger from "../config/logger.js";

/**
 * Standard error response for rate limit exceeded
 */
const rateLimitResponse = {
  success: false,
  error: {
    code: "TOO_MANY_REQUESTS",
    message: "Too many requests, please try again later",
  },
};

/**
 * Rate limit tiers
 */
export const RATE_LIMITS = {
  // Very restrictive (auth endpoints to prevent brute force)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },

  // Restrictive (mutation endpoints)
  MUTATIONS: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
  },

  // Standard (read endpoints)
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.RATE_LIMIT_MAX_REQUESTS || 100,
  },

  // Generous (public read-only endpoints)
  PUBLIC: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
  },

  // Search (special case - moderate limit)
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 20,
  },

  // File uploads (very restrictive)
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
  },
};

/**
 * Key generator that considers both IP and user
 */
function generateKey(req: Request): string {
  // Use user ID if authenticated
  if (req.user?.id) {
    return `ratelimit:user:${req.user.id}`;
  }

  // Fall back to IP
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `ratelimit:ip:${ip}`;
}

/**
 * Create a rate limiter with Redis store if available
 */
function createRateLimiter(
  options: Partial<Options>
): ReturnType<typeof rateLimit> {
  const config: Partial<Options> = {
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitResponse,
    keyGenerator: generateKey,

    // Skip rate limiting for successful requests if user wants to
    skipSuccessfulRequests: false,

    // Skip rate limiting for failed requests (track all requests)
    skipFailedRequests: false,

    // Add custom headers
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for ${generateKey(req)}`, {
        ip: req.ip,
        path: req.path,
        userId: req.user?.id,
      });

      // CORS headers are already set by cors middleware, just send response
      res.status(429).json(rateLimitResponse);
    },

    // Skip rate limiting in development
    skip: () => env.NODE_ENV === "development",
  };

  // Use Redis store if cache is enabled (distributed rate limiting)
  if (cacheService.isEnabled()) {
    config.store = createRedisStore();
  }

  return rateLimit(config);
}

/**
 * Create Redis store for distributed rate limiting
 */
function createRedisStore() {
  return {
    async increment(
      key: string
    ): Promise<{ totalHits: number; resetTime: Date }> {
      const count = await cacheService.incr(
        key,
        env.RATE_LIMIT_WINDOW_MS / 1000
      );
      return {
        totalHits: count,
        resetTime: new Date(Date.now() + env.RATE_LIMIT_WINDOW_MS),
      };
    },

    async decrement(key: string): Promise<void> {
      // Decrement is optional
      await cacheService.del(key);
    },

    async resetKey(key: string): Promise<void> {
      await cacheService.del(key);
    },
  };
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  /**
   * Authentication endpoints (very restrictive)
   * Prevents brute force attacks
   */
  auth: createRateLimiter(RATE_LIMITS.AUTH),

  /**
   * Mutation endpoints (POST, PUT, DELETE)
   * Prevents spam and abuse
   */
  mutations: createRateLimiter(RATE_LIMITS.MUTATIONS),

  /**
   * Standard read endpoints
   */
  standard: createRateLimiter(RATE_LIMITS.STANDARD),

  /**
   * Public read-only endpoints
   * More generous limits
   */
  public: createRateLimiter(RATE_LIMITS.PUBLIC),

  /**
   * Search endpoints
   * Moderate limits to prevent abuse
   */
  search: createRateLimiter(RATE_LIMITS.SEARCH),

  /**
   * File upload endpoints
   * Very restrictive
   */
  upload: createRateLimiter(RATE_LIMITS.UPLOAD),

  /**
   * Custom rate limiter with specific options
   */
  custom: (options: Partial<Options>) => createRateLimiter(options),
};

/**
 * Apply different rate limits based on user role
 */
export function roleBasedRateLimiter(
  guestLimit: number,
  userLimit: number,
  adminLimit: number = 9999
) {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: (req: Request) => {
      if (!req.user) return guestLimit;

      switch (req.user.role) {
        case "ADMIN":
          return adminLimit;
        case "USER":
          return userLimit;
        case "GUEST":
        default:
          return guestLimit;
      }
    },
  });
}

/**
 * Skip rate limiting for admin users
 */
export function skipForAdmin(req: Request): boolean {
  return req.user?.role === "ADMIN";
}

/**
 * Export rate limiter with admin skip
 */
export function createSmartRateLimiter(options: Partial<Options>) {
  return createRateLimiter({
    ...options,
    skip: skipForAdmin,
  });
}
