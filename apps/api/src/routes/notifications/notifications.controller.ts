import type { Request, Response } from "express";
import {
  notificationService,
  type NotificationEvent,
} from "../../lib/notifications/notification.service.js";
import logger from "../../config/logger.js";

export class NotificationsController {
  /**
   * GET /api/notifications/stream
   * Server-Sent Events endpoint for real-time notifications
   * Works with both web browsers and Flutter/mobile apps
   */
  stream(req: Request, res: Response): void {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        id: "connection",
        type: "system",
        status: "connected",
        message: "Connected to notification stream",
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Create event listener
    const listener = (event: NotificationEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Subscribe to notifications
    notificationService.on("notification", listener);

    logger.info("Client connected to notification stream", {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    // Cleanup on client disconnect
    req.on("close", () => {
      notificationService.off("notification", listener);
      logger.info("Client disconnected from notification stream", {
        ip: req.ip,
      });
      res.end();
    });
  }
}

// Export singleton instance
export const notificationsController = new NotificationsController();
