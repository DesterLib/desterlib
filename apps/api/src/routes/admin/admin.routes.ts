/**
 * Admin Routes
 *
 * Routes for administrative tasks:
 * - Backup management
 * - System metrics
 * - Health checks
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, requireAdmin } from "../../lib/auth/auth.middleware.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { BadRequestError } from "../../lib/errors.js";
import {
  createBackup,
  listBackups,
  restoreBackup,
  getBackupStats,
  deleteBackup,
} from "../../lib/backup.js";
import { updateBusinessMetrics } from "../../lib/metrics.js";
import { alertingService } from "../../lib/alerting.js";
import { performanceMonitor } from "../../lib/performanceMonitor.js";
import logger from "../../config/logger.js";

const router: Router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// ────────────────────────────────────────────────────────────────────────────
// Backup Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/backups:
 *   get:
 *     tags: [Admin]
 *     summary: List all database backups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of backups
 */
router.get(
  "/backups",
  asyncHandler(async (_req: Request, res: Response) => {
    const backups = await listBackups();
    const stats = await getBackupStats();

    res.jsonOk({
      backups,
      stats,
    });
  })
);

/**
 * @swagger
 * /api/v1/admin/backups:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new database backup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Backup created successfully
 */
router.post(
  "/backups",
  asyncHandler(async (_req: Request, res: Response) => {
    logger.info("Manual backup initiated");
    const result = await createBackup("manual");

    if (result.success) {
      res.jsonOk(
        {
          message: "Backup created successfully",
          backup: result.backup,
        },
        201
      );
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: "BACKUP_FAILED",
          message: result.error || "Failed to create backup",
        },
      });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/backups/{filename}/restore:
 *   post:
 *     tags: [Admin]
 *     summary: Restore database from backup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: filename
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Database restored successfully
 */
router.post(
  "/backups/:filename/restore",
  asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;

    if (!filename) {
      throw new BadRequestError("Backup filename is required");
    }

    logger.warn(`Database restore initiated: ${filename}`, {
      user: req.user?.username,
    });

    const result = await restoreBackup(filename);

    if (result.success) {
      res.jsonOk({
        message: "Database restored successfully",
        restoredFrom: result.restoredFrom,
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: "RESTORE_FAILED",
          message: result.error || "Failed to restore backup",
        },
      });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/backups/{filename}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a backup file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: filename
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup deleted successfully
 */
router.delete(
  "/backups/:filename",
  asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;

    if (!filename) {
      throw new BadRequestError("Backup filename is required");
    }

    logger.info(`Deleting backup: ${filename}`);
    const success = await deleteBackup(filename);

    if (success) {
      res.jsonOk({
        message: "Backup deleted successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: "DELETE_FAILED",
          message: "Failed to delete backup",
        },
      });
    }
  })
);

// ────────────────────────────────────────────────────────────────────────────
// Metrics Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/metrics/update:
 *   post:
 *     tags: [Admin]
 *     summary: Manually update business metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics updated successfully
 */
router.post(
  "/metrics/update",
  asyncHandler(async (_req: Request, res: Response) => {
    await updateBusinessMetrics();
    res.jsonOk({
      message: "Business metrics updated successfully",
    });
  })
);

// ────────────────────────────────────────────────────────────────────────────
// Alerting & Health
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/alerts:
 *   get:
 *     tags: [Admin]
 *     summary: Get active alerts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active alerts
 */
router.get(
  "/alerts",
  asyncHandler(async (_req: Request, res: Response) => {
    const alerts = alertingService.getActiveAlerts();
    res.jsonOk({
      count: alerts.length,
      alerts,
    });
  })
);

/**
 * @swagger
 * /api/v1/admin/alerts/history:
 *   get:
 *     tags: [Admin]
 *     summary: Get alert history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Alert history
 */
router.get(
  "/alerts/history",
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = alertingService.getAlertHistory(limit);
    res.jsonOk({
      count: history.length,
      alerts: history,
    });
  })
);

/**
 * @swagger
 * /api/v1/admin/health/check:
 *   get:
 *     tags: [Admin]
 *     summary: Perform comprehensive health check
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health check results
 */
router.get(
  "/health/check",
  asyncHandler(async (_req: Request, res: Response) => {
    const healthStatus = await alertingService.checkHealth();

    // Transform to match frontend expectations
    res.jsonOk({
      status: healthStatus.healthy ? "healthy" : "unhealthy",
      database: healthStatus.checks.database,
      cache: healthStatus.checks.cache,
      alerts: healthStatus.alerts,
    });
  })
);

// ────────────────────────────────────────────────────────────────────────────
// Performance Monitoring
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/performance:
 *   get:
 *     tags: [Admin]
 *     summary: Get performance statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get(
  "/performance",
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = performanceMonitor.getStats();
    res.jsonOk(stats);
  })
);

/**
 * @swagger
 * /api/v1/admin/performance/reset:
 *   post:
 *     tags: [Admin]
 *     summary: Reset performance statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics reset
 */
router.post(
  "/performance/reset",
  asyncHandler(async (_req: Request, res: Response) => {
    performanceMonitor.reset();
    res.jsonOk({ message: "Performance statistics reset" });
  })
);

export default router;
