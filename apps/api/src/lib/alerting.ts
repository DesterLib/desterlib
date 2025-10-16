/**
 * Alerting System
 *
 * Monitors system metrics and health, triggers alerts when thresholds are exceeded.
 * Can be extended to send notifications via email, Slack, webhook, etc.
 */

import logger from "../config/logger.js";
import { checkDatabaseHealth } from "./prisma.js";
import { cacheService } from "./cache.js";
import { webSocketService, WS_EVENTS } from "./websocket.js";
import { totalmem } from "os";
import type { Registry } from "prom-client";

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  metric?: string;
  value?: number | string;
  threshold?: number;
  resolved: boolean;
}

/**
 * Alert handler interface for extensibility
 */
export interface AlertHandler {
  name: string;
  handle(alert: Alert): Promise<void>;
}

/**
 * Alerting thresholds
 */
export const ALERT_THRESHOLDS = {
  // Response time in milliseconds
  RESPONSE_TIME_WARNING: 1000,
  RESPONSE_TIME_ERROR: 5000,

  // Error rate (percentage)
  ERROR_RATE_WARNING: 5,
  ERROR_RATE_CRITICAL: 10,

  // Request rate (requests per minute)
  REQUEST_RATE_WARNING: 1000,
  REQUEST_RATE_CRITICAL: 5000,

  // Memory usage (percentage)
  MEMORY_USAGE_WARNING: 80,
  MEMORY_USAGE_CRITICAL: 95,

  // Database connection health
  DB_HEALTH_CHECK_FAILURES: 3,

  // Cache connection health
  CACHE_HEALTH_CHECK_FAILURES: 5,
};

class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private handlers: AlertHandler[] = [];
  private healthCheckFailures: Map<string, number> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private alertCooldown = 5 * 60 * 1000; // 5 minutes
  private lastHealthStatus: {
    healthy: boolean;
    checks: Record<string, boolean>;
  } | null = null;

  constructor() {
    // Register default logger handler
    this.registerHandler(new LoggerAlertHandler());
  }

  /**
   * Register a custom alert handler
   */
  registerHandler(handler: AlertHandler): void {
    this.handlers.push(handler);
    logger.info(`Alert handler registered: ${handler.name}`);
  }

  /**
   * Create and trigger an alert
   */
  async triggerAlert(
    id: string,
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: { metric?: string; value?: number | string; threshold?: number }
  ): Promise<void> {
    // Check cooldown to prevent alert spam
    const lastAlert = this.lastAlertTime.get(id);
    if (lastAlert && Date.now() - lastAlert.getTime() < this.alertCooldown) {
      logger.debug(`Alert ${id} is in cooldown period, skipping`);
      return;
    }

    const alert: Alert = {
      id,
      severity,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      ...metadata,
    };

    this.alerts.set(id, alert);
    this.lastAlertTime.set(id, new Date());

    // Send alert to all handlers
    await Promise.all(
      this.handlers.map((handler) =>
        handler.handle(alert).catch((error) => {
          logger.error(`Alert handler ${handler.name} failed:`, error);
        })
      )
    );
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      logger.info(`Alert resolved: ${id}`);

      // Optionally send resolution notification
      await this.triggerAlert(
        `${id}_resolved`,
        AlertSeverity.INFO,
        `${alert.title} - Resolved`,
        `The issue has been resolved: ${alert.message}`
      );
    }
  }

  /**
   * Get all active (unresolved) alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check health and trigger alerts if needed
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    checks: Record<string, boolean>;
    alerts: Alert[];
  }> {
    const checks: Record<string, boolean> = {
      database: false,
      cache: false,
    };

    // Check database health
    try {
      checks.database = await checkDatabaseHealth();
      if (checks.database) {
        this.healthCheckFailures.set("database", 0);
        await this.resolveAlert("database_connection_failed");
      } else {
        const failures = (this.healthCheckFailures.get("database") || 0) + 1;
        this.healthCheckFailures.set("database", failures);

        if (failures >= ALERT_THRESHOLDS.DB_HEALTH_CHECK_FAILURES) {
          await this.triggerAlert(
            "database_connection_failed",
            AlertSeverity.CRITICAL,
            "Database Connection Failed",
            `Database health check has failed ${failures} times consecutively`
          );
        }
      }
    } catch (error) {
      checks.database = false;
      logger.error("Database health check error:", error);
    }

    // Check cache health (optional - doesn't affect overall health)
    try {
      if (cacheService.isEnabled()) {
        // If cache is enabled, ping it to check connection
        checks.cache = await cacheService.ping();
        if (checks.cache) {
          this.healthCheckFailures.set("cache", 0);
          await this.resolveAlert("cache_connection_failed");
        } else {
          const failures = (this.healthCheckFailures.get("cache") || 0) + 1;
          this.healthCheckFailures.set("cache", failures);

          if (failures >= ALERT_THRESHOLDS.CACHE_HEALTH_CHECK_FAILURES) {
            await this.triggerAlert(
              "cache_connection_failed",
              AlertSeverity.WARNING,
              "Cache Connection Issues",
              `Cache health check has failed ${failures} times consecutively`
            );
          }
        }
      } else {
        // Cache is disabled - show as inactive (but don't affect overall health)
        checks.cache = false;
      }
    } catch (error) {
      checks.cache = false;
      logger.error("Cache health check error:", error);
    }

    // Overall health is determined only by critical services (database)
    // Cache is optional and won't fail the overall health check
    const healthy = checks.database;

    // Broadcast health status changes via WebSocket
    const hasStatusChanged =
      !this.lastHealthStatus ||
      this.lastHealthStatus.healthy !== healthy ||
      JSON.stringify(this.lastHealthStatus.checks) !== JSON.stringify(checks);

    if (hasStatusChanged && webSocketService.isInitialized()) {
      const healthStatus = {
        status: healthy ? "healthy" : "unhealthy",
        database: checks.database,
        cache: checks.cache,
        timestamp: new Date().toISOString(),
      };

      webSocketService.broadcast(WS_EVENTS.HEALTH_STATUS_CHANGED, healthStatus);
      logger.info(
        `Health status changed: ${healthy ? "healthy" : "unhealthy"}`,
        checks
      );
    }

    this.lastHealthStatus = { healthy, checks };

    return {
      healthy,
      checks,
      alerts: this.getActiveAlerts(),
    };
  }

  /**
   * Check Prometheus metrics and trigger alerts
   */
  async checkMetrics(registry: Registry): Promise<void> {
    try {
      const metrics = await registry.metrics();
      const lines = metrics.split("\n");

      // Parse metrics and check thresholds
      // This is a simplified example - you'd parse the actual metric values
      for (const line of lines) {
        if (line.startsWith("#") || !line.trim()) continue;

        // Example: Check error rate
        if (line.includes("http_request_duration_seconds")) {
          // Parse and check response time
          // Implementation depends on your metric format
        }
      }
    } catch (error) {
      logger.error("Metrics check error:", error);
    }
  }

  /**
   * Monitor system resources
   */
  async checkSystemResources(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();

      // Calculate RSS (Resident Set Size) memory usage percentage
      // RSS is the total memory allocated to the process, including heap, code, and stack
      // This gives a more accurate picture of actual memory usage
      const totalSystemMemory = totalmem();
      const memoryUsedPercent = (memoryUsage.rss / totalSystemMemory) * 100;

      if (memoryUsedPercent > ALERT_THRESHOLDS.MEMORY_USAGE_CRITICAL) {
        await this.triggerAlert(
          "memory_usage_critical",
          AlertSeverity.CRITICAL,
          "Critical Memory Usage",
          `Memory usage is at ${memoryUsedPercent.toFixed(1)}% (${(memoryUsage.rss / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalSystemMemory / 1024 / 1024 / 1024).toFixed(2)}GB)`,
          {
            metric: "memory_usage_percent",
            value: memoryUsedPercent.toFixed(1),
            threshold: ALERT_THRESHOLDS.MEMORY_USAGE_CRITICAL,
          }
        );
      } else if (memoryUsedPercent > ALERT_THRESHOLDS.MEMORY_USAGE_WARNING) {
        await this.triggerAlert(
          "memory_usage_warning",
          AlertSeverity.WARNING,
          "High Memory Usage",
          `Memory usage is at ${memoryUsedPercent.toFixed(1)}% (${(memoryUsage.rss / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalSystemMemory / 1024 / 1024 / 1024).toFixed(2)}GB)`,
          {
            metric: "memory_usage_percent",
            value: memoryUsedPercent.toFixed(1),
            threshold: ALERT_THRESHOLDS.MEMORY_USAGE_WARNING,
          }
        );
      } else {
        await this.resolveAlert("memory_usage_warning");
        await this.resolveAlert("memory_usage_critical");
      }
    } catch (error) {
      logger.error("System resources check error:", error);
    }
  }

  /**
   * Start periodic health monitoring
   */
  startMonitoring(intervalMs = 60000): NodeJS.Timeout {
    logger.info(`Starting health monitoring (interval: ${intervalMs}ms)`);

    return setInterval(async () => {
      await this.checkHealth();
      await this.checkSystemResources();
    }, intervalMs);
  }
}

/**
 * Default logger alert handler
 */
class LoggerAlertHandler implements AlertHandler {
  name = "logger";

  async handle(alert: Alert): Promise<void> {
    const logMessage = `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`;
    const metadata = {
      alertId: alert.id,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
    };

    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.ERROR:
        logger.error(logMessage, metadata);
        break;
      case AlertSeverity.WARNING:
        logger.warn(logMessage, metadata);
        break;
      case AlertSeverity.INFO:
      default:
        logger.info(logMessage, metadata);
        break;
    }
  }
}

/**
 * Example: Webhook alert handler
 * Sends alerts to an external webhook endpoint
 */
export class WebhookAlertHandler implements AlertHandler {
  name = "webhook";
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async handle(alert: Alert): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }
    } catch (error) {
      logger.error("Webhook alert handler failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertingService = new AlertingService();
