/**
 * Health Check Controller
 *
 * Provides health and readiness endpoints for monitoring and container orchestration.
 */

import type { Request, Response } from "express";
import { checkDatabaseHealth } from "../../lib/prisma.js";
import logger from "../../config/logger.js";

export class HealthController {
  /**
   * GET /health
   * Basic health check - returns 200 if app is running
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.jsonOk({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  /**
   * GET /health/ready
   * Readiness check - verifies all dependencies are healthy
   * Returns 200 if ready, 503 if not ready
   */
  async ready(_req: Request, res: Response): Promise<void> {
    const checks = {
      database: false,
    };

    try {
      // Check database connection
      checks.database = await checkDatabaseHealth();

      // Add other dependency checks here
      // - Redis connection
      // - External API availability
      // - File system access
      // etc.

      const isReady = Object.values(checks).every((check) => check === true);

      if (isReady) {
        res.jsonOk({
          status: "ready",
          timestamp: new Date().toISOString(),
          checks,
        });
      } else {
        res.status(503).json({
          success: false,
          requestId: res.getHeader("x-request-id") ?? "unknown",
          error: {
            code: "NOT_READY",
            message: "Service is not ready",
            details: { checks },
          },
        });
      }
    } catch (error) {
      logger.error("Readiness check failed:", error);
      res.status(503).json({
        success: false,
        requestId: res.getHeader("x-request-id") ?? "unknown",
        error: {
          code: "READINESS_CHECK_FAILED",
          message: "Failed to perform readiness check",
          details: { checks },
        },
      });
    }
  }

  /**
   * GET /health/live
   * Liveness check - returns 200 if process is alive
   * Should fail only if the process is deadlocked or broken
   */
  async live(_req: Request, res: Response): Promise<void> {
    res.jsonOk({
      status: "alive",
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage(),
    });
  }
}

export const healthController = new HealthController();
