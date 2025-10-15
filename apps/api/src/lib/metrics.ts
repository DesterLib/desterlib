/**
 * Prometheus Metrics Service
 *
 * Provides application metrics for monitoring:
 * - HTTP request metrics (duration, status codes)
 * - Database connection pool metrics
 * - API rate limit metrics
 * - WebSocket connection metrics
 * - Business metrics (media count, users, etc.)
 */

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";
import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

// Create a Registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({
  register,
  prefix: "dester_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ────────────────────────────────────────────────────────────────────────────
// HTTP Metrics
// ────────────────────────────────────────────────────────────────────────────

/**
 * HTTP request counter
 */
export const httpRequestsTotal = new Counter({
  name: "dester_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/**
 * HTTP request duration histogram
 */
export const httpRequestDuration = new Histogram({
  name: "dester_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

/**
 * HTTP request size
 */
export const httpRequestSize = new Histogram({
  name: "dester_http_request_size_bytes",
  help: "Size of HTTP requests in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  registers: [register],
});

/**
 * HTTP response size
 */
export const httpResponseSize = new Histogram({
  name: "dester_http_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["method", "route", "status_code"],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  registers: [register],
});

// ────────────────────────────────────────────────────────────────────────────
// Authentication Metrics
// ────────────────────────────────────────────────────────────────────────────

/**
 * Authentication attempts
 */
export const authAttemptsTotal = new Counter({
  name: "dester_auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["method", "status"], // method: password/pin/passwordless, status: success/failure
  registers: [register],
});

/**
 * Active sessions
 */
export const activeSessions = new Gauge({
  name: "dester_active_sessions",
  help: "Number of active user sessions",
  registers: [register],
});

/**
 * API key usage
 */
export const apiKeyUsage = new Counter({
  name: "dester_api_key_usage_total",
  help: "Total number of API key authentications",
  labelNames: ["status"], // success/failure
  registers: [register],
});

// ────────────────────────────────────────────────────────────────────────────
// Database Metrics
// ────────────────────────────────────────────────────────────────────────────

/**
 * Database query duration
 */
export const dbQueryDuration = new Histogram({
  name: "dester_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"], // select, insert, update, delete
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

/**
 * Database errors
 */
export const dbErrors = new Counter({
  name: "dester_db_errors_total",
  help: "Total number of database errors",
  labelNames: ["type"],
  registers: [register],
});

// ────────────────────────────────────────────────────────────────────────────
// Business Metrics
// ────────────────────────────────────────────────────────────────────────────

/**
 * Total media items
 */
export const mediaTotal = new Gauge({
  name: "dester_media_total",
  help: "Total number of media items",
  labelNames: ["type"], // MOVIE, TV_SHOW, MUSIC, COMIC
  registers: [register],
});

/**
 * Total users
 */
export const usersTotal = new Gauge({
  name: "dester_users_total",
  help: "Total number of users",
  labelNames: ["role"], // ADMIN, USER, GUEST
  registers: [register],
});

/**
 * Scan operations
 */
export const scanOperations = new Counter({
  name: "dester_scan_operations_total",
  help: "Total number of media scan operations",
  labelNames: ["status"], // success/failure
  registers: [register],
});

/**
 * Files scanned
 */
export const filesScanned = new Counter({
  name: "dester_files_scanned_total",
  help: "Total number of files scanned",
  labelNames: ["type"], // added/updated/skipped/error
  registers: [register],
});

// ────────────────────────────────────────────────────────────────────────────
// WebSocket Metrics
// ────────────────────────────────────────────────────────────────────────────

/**
 * Active WebSocket connections
 */
export const wsConnectionsActive = new Gauge({
  name: "dester_ws_connections_active",
  help: "Number of active WebSocket connections",
  registers: [register],
});

/**
 * WebSocket messages
 */
export const wsMessages = new Counter({
  name: "dester_ws_messages_total",
  help: "Total number of WebSocket messages",
  labelNames: ["direction", "type"], // direction: inbound/outbound, type: message type
  registers: [register],
});

// ────────────────────────────────────────────────────────────────────────────
// Cache Metrics
// ────────────────────────────────────────────────────────────────────────────

/**
 * Cache operations
 */
export const cacheOperations = new Counter({
  name: "dester_cache_operations_total",
  help: "Total number of cache operations",
  labelNames: ["operation", "status"], // operation: get/set/delete, status: hit/miss/error
  registers: [register],
});

// ────────────────────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────────────────────

/**
 * Express middleware to track HTTP metrics
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Track request size
  const requestSize = parseInt(req.get("content-length") || "0", 10);
  if (requestSize > 0) {
    httpRequestSize
      .labels(req.method, req.route?.path || req.path)
      .observe(requestSize);
  }

  // Capture original end function with proper binding
  const originalEnd = res.end.bind(res);

  // Override end function to capture metrics
  // Note: Express Response.end has complex overloaded signatures.
  // We use type assertion here to match all overloads while maintaining functionality.
  type EndFunction = typeof res.end;
  res.end = function (
    ...args: Parameters<EndFunction>
  ): ReturnType<EndFunction> {
    // Calculate duration
    const duration = (Date.now() - start) / 1000;

    // Get route path (use actual route if available, otherwise use path)
    const route = req.route?.path || req.path;

    // Record metrics
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    // Track response size
    const responseSize = parseInt(res.get("content-length") || "0", 10);
    if (responseSize > 0) {
      httpResponseSize
        .labels(req.method, route, res.statusCode.toString())
        .observe(responseSize);
    }

    // Call original end function with all original arguments
    return originalEnd(...args);
  } as EndFunction;

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error("Error generating metrics:", error);
    res.status(500).end("Error generating metrics");
  }
}

/**
 * Update business metrics periodically
 * Call this from a scheduled job or on-demand
 */
export async function updateBusinessMetrics(): Promise<void> {
  try {
    const { prisma } = await import("./prisma.js");

    // Update media counts by type
    const mediaCounts = await prisma.media.groupBy({
      by: ["type"],
      _count: true,
    });

    mediaCounts.forEach((count) => {
      mediaTotal.labels(count.type).set(count._count);
    });

    // Update user counts by role
    const userCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    userCounts.forEach((count) => {
      usersTotal.labels(count.role).set(count._count);
    });

    // Update active sessions count
    const activeSessionCount = await prisma.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    activeSessions.set(activeSessionCount);

    logger.debug("Business metrics updated successfully");
  } catch (error) {
    logger.error("Error updating business metrics:", error);
  }
}

// Update business metrics every 60 seconds in production
if (env.NODE_ENV === "production") {
  setInterval(() => {
    updateBusinessMetrics().catch((error) => {
      logger.error("Failed to update business metrics:", error);
    });
  }, 60000); // 60 seconds
}
