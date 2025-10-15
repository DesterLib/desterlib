import EventEmitter from "events";
import logger from "../../config/logger.js";
import { webSocketService, WS_EVENTS } from "../websocket.js";

/**
 * Notification types for different operations
 */
export type NotificationType =
  | "scan"
  | "metadata"
  | "sync"
  | "collection"
  | "settings"
  | "error";

/**
 * Notification status
 */
export type NotificationStatus =
  | "started"
  | "progress"
  | "completed"
  | "failed";

/**
 * Notification event structure
 */
export interface NotificationEvent {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * Notification Service
 * Manages real-time notifications for operations like scanning, metadata updates, etc.
 * Emits events that can be consumed via SSE for web/mobile clients.
 */
class NotificationService extends EventEmitter {
  private notificationIdCounter = 0;

  /**
   * Generate a unique notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${++this.notificationIdCounter}`;
  }

  /**
   * Send a notification
   */
  notify(
    type: NotificationType,
    status: NotificationStatus,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const event: NotificationEvent = {
      id: this.generateId(),
      type,
      status,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // Emit to SSE clients
    this.emit("notification", event);

    // Emit via WebSocket for real-time updates
    if (webSocketService.isInitialized()) {
      webSocketService.broadcast(WS_EVENTS.NOTIFICATION, event);

      // Also emit specific event types
      const wsEventKey =
        `${WS_EVENTS.NOTIFICATION}_${status}` as keyof typeof WS_EVENTS;
      if (wsEventKey in WS_EVENTS) {
        webSocketService.broadcast(WS_EVENTS[wsEventKey], event);
      }
    }

    // Log for debugging/audit
    const logLevel = status === "failed" ? "error" : "info";
    logger[logLevel](`[Notification] ${type}:${status} - ${message}`, data);
  }

  /**
   * Convenience methods for common notification patterns
   */
  started(
    type: NotificationType,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.notify(type, "started", message, data);
  }

  progress(
    type: NotificationType,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.notify(type, "progress", message, data);
  }

  completed(
    type: NotificationType,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.notify(type, "completed", message, data);
  }

  failed(
    type: NotificationType,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.notify(type, "failed", message, data);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
