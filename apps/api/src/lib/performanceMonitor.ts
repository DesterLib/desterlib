/**
 * Performance Monitoring
 *
 * Tracks and analyzes API performance metrics including:
 * - Response time percentiles
 * - Slow query detection
 * - Memory usage trends
 * - CPU usage patterns
 */

import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { alertingService, AlertSeverity } from "./alerting.js";

/**
 * Performance metrics storage
 */
class PerformanceMonitor {
  private responseTimes: number[] = [];
  private slowQueries: Array<{
    path: string;
    method: string;
    duration: number;
    timestamp: Date;
  }> = [];
  private readonly MAX_SAMPLES = 10000;
  private readonly SLOW_QUERY_THRESHOLD = 1000; // ms

  /**
   * Record a response time
   */
  recordResponseTime(duration: number, req: Request): void {
    this.responseTimes.push(duration);

    // Keep only recent samples
    if (this.responseTimes.length > this.MAX_SAMPLES) {
      this.responseTimes.shift();
    }

    // Track slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push({
        path: req.path,
        method: req.method,
        duration,
        timestamp: new Date(),
      });

      // Keep only recent slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }

      // Alert on very slow queries
      if (duration > 5000) {
        alertingService
          .triggerAlert(
            `slow_query_${req.path}`,
            AlertSeverity.WARNING,
            "Slow API Response",
            `${req.method} ${req.path} took ${duration}ms`,
            {
              metric: "response_time_ms",
              value: duration,
              threshold: 5000,
            }
          )
          .catch((error) => {
            logger.error("Failed to trigger slow query alert:", error);
          });
      }

      logger.warn(
        `Slow query detected: ${req.method} ${req.path} (${duration}ms)`
      );
    }
  }

  /**
   * Calculate percentiles
   */
  private calculatePercentile(arr: number[], percentile: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    responseTimes: {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
    slowQueries: Array<{
      path: string;
      method: string;
      duration: number;
      timestamp: Date;
    }>;
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
      heapUsedPercent: number;
    };
    uptime: number;
  } {
    const times = this.responseTimes;
    const memUsage = process.memoryUsage();

    return {
      responseTimes: {
        count: times.length,
        min: times.length > 0 ? Math.min(...times) : 0,
        max: times.length > 0 ? Math.max(...times) : 0,
        avg:
          times.length > 0
            ? times.reduce((a, b) => a + b, 0) / times.length
            : 0,
        p50: this.calculatePercentile(times, 50),
        p95: this.calculatePercentile(times, 95),
        p99: this.calculatePercentile(times, 99),
      },
      slowQueries: this.slowQueries.slice(-20), // Last 20 slow queries
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsedPercent: Number(
          ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)
        ),
      },
      uptime: Math.floor(process.uptime()),
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.responseTimes = [];
    this.slowQueries = [];
    logger.info("Performance statistics reset");
  }

  /**
   * Get system resource usage
   */
  getResourceUsage(): {
    cpu: {
      user: number;
      system: number;
    };
    memory: NodeJS.MemoryUsage;
    uptime: number;
  } {
    const cpuUsage = process.cpuUsage();

    return {
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // Convert to ms
        system: Math.round(cpuUsage.system / 1000), // Convert to ms
      },
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * Start periodic performance checks
   */
  startPeriodicChecks(intervalMs = 60000): NodeJS.Timeout {
    logger.info(
      `Starting periodic performance checks (interval: ${intervalMs}ms)`
    );

    return setInterval(() => {
      const stats = this.getStats();

      // Log performance summary
      logger.info("Performance Summary", {
        avgResponseTime: stats.responseTimes.avg.toFixed(2),
        p95ResponseTime: stats.responseTimes.p95.toFixed(2),
        p99ResponseTime: stats.responseTimes.p99.toFixed(2),
        memoryUsagePercent: stats.memory.heapUsedPercent,
        slowQueriesCount: stats.slowQueries.length,
      });

      // Check for performance issues
      if (stats.responseTimes.p95 > 2000) {
        alertingService
          .triggerAlert(
            "high_p95_response_time",
            AlertSeverity.WARNING,
            "High P95 Response Time",
            `P95 response time is ${stats.responseTimes.p95.toFixed(0)}ms`,
            {
              metric: "p95_response_time",
              value: stats.responseTimes.p95,
              threshold: 2000,
            }
          )
          .catch((error) => {
            logger.error("Failed to trigger P95 alert:", error);
          });
      }

      // Check memory usage
      if (stats.memory.heapUsedPercent > 85) {
        alertingService
          .triggerAlert(
            "high_memory_usage",
            AlertSeverity.WARNING,
            "High Memory Usage",
            `Memory usage is at ${stats.memory.heapUsedPercent}%`,
            {
              metric: "memory_usage_percent",
              value: stats.memory.heapUsedPercent,
              threshold: 85,
            }
          )
          .catch((error) => {
            logger.error("Failed to trigger memory alert:", error);
          });
      }
    }, intervalMs);
  }
}

/**
 * Express middleware for performance monitoring
 */
export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Capture when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    performanceMonitor.recordResponseTime(duration, req);
  });

  next();
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
