import express, { Router } from "express";
import { getLogs, clearLogs } from "./logs.controller";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/logs:
 *   get:
 *     summary: Get recent API logs
 *     description: Fetches recent log entries from the server with optional filtering
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 100
 *         description: Number of logs to retrieve
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, http, debug]
 *         description: Filter by log level
 *     responses:
 *       200:
 *         description: Successfully retrieved logs
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
 *                       timestamp:
 *                         type: string
 *                         example: "2025-11-11 18:36:11"
 *                       level:
 *                         type: string
 *                         example: "info"
 *                       message:
 *                         type: string
 *                         example: "Server started successfully"
 *                       meta:
 *                         type: object
 *                         nullable: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get("/", getLogs);

/**
 * @swagger
 * /api/v1/logs:
 *   delete:
 *     summary: Clear all logs
 *     description: Clears all log entries from the server
 *     tags: [Logs]
 *     responses:
 *       200:
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.delete("/", clearLogs);

export default router;

