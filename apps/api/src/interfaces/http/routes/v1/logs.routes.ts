import express, { Router } from "express";
import { getLogs, clearLogs } from "../../controllers/logs.controller";
import { validateQuery } from "../../middleware";
import { getLogsSchema } from "../../schemas/logs.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/logs:
 *   get:
 *     summary: Get recent API logs
 *     description: Retrieves recent API logs with optional filtering by log level
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of log entries to return
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, http, debug]
 *         description: Filter logs by level
 *     responses:
 *       '200':
 *         description: List of log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Clear all logs
 *     description: Deletes all log entries from the system
 *     tags: [Logs]
 *     responses:
 *       '200':
 *         description: Logs cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logs cleared successfully"
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", validateQuery(getLogsSchema), getLogs);

router.delete("/", clearLogs);

export default router;
