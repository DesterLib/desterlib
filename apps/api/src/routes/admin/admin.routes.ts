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
 * /admin/backups:
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
 * /admin/backups:
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
 * /admin/backups/{filename}/restore:
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
 * /admin/backups/{filename}:
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
 * /admin/metrics/update:
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

export default router;
