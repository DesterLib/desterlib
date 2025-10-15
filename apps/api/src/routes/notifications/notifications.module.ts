import { Router, type Router as RouterType } from "express";
import { notificationsController } from "./notifications.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/notifications/stream:
 *   get:
 *     summary: Real-time notification stream
 *     description: Server-Sent Events (SSE) endpoint for receiving real-time notifications about scan, metadata, sync operations
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: Event stream established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique notification ID
 *                 type:
 *                   type: string
 *                   enum: [scan, metadata, sync, collection, settings, error]
 *                 status:
 *                   type: string
 *                   enum: [started, progress, completed, failed]
 *                 message:
 *                   type: string
 *                   description: Human-readable notification message
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   description: Additional metadata about the event
 */
router.get("/stream", (req, res) => notificationsController.stream(req, res));

export default router;
