/**
 * WebSocket Service
 *
 * Provides real-time communication using Socket.IO
 * Used for broadcasting scan progress, notifications, and other live updates
 */

import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import logger from "../config/logger.js";
import { env } from "../config/env.js";

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

class WebSocketService {
  private io: Server | null = null;
  private connectedClients: Set<string> = new Set();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
      path: "/ws",
      transports: ["websocket", "polling"],
    });

    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });

    logger.info("✅ WebSocket server initialized at /ws");
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    const clientId = socket.id;
    this.connectedClients.add(clientId);

    logger.info(
      `WebSocket client connected: ${clientId} (Total: ${this.connectedClients.size})`
    );

    // Send welcome message
    socket.emit("connected", {
      clientId,
      message: "Connected to Dester API",
      timestamp: new Date().toISOString(),
    });

    // Handle client disconnect
    socket.on("disconnect", () => {
      this.connectedClients.delete(clientId);
      logger.info(
        `WebSocket client disconnected: ${clientId} (Remaining: ${this.connectedClients.size})`
      );
    });

    // Handle ping-pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });

    // Handle room subscriptions
    socket.on("subscribe", (room: string) => {
      socket.join(room);
      logger.debug(`Client ${clientId} subscribed to room: ${room}`);
      socket.emit("subscribed", { room, timestamp: new Date().toISOString() });
    });

    socket.on("unsubscribe", (room: string) => {
      socket.leave(room);
      logger.debug(`Client ${clientId} unsubscribed from room: ${room}`);
      socket.emit("unsubscribed", {
        room,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) {
      logger.warn("WebSocket server not initialized, cannot broadcast");
      return;
    }

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit(event, message);
    logger.debug(
      `Broadcasted ${event} to ${this.connectedClients.size} clients`
    );
  }

  /**
   * Emit message to a specific room
   */
  emitToRoom(room: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.warn("WebSocket server not initialized, cannot emit to room");
      return;
    }

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit(event, message);
    logger.debug(`Emitted ${event} to room: ${room}`);
  }

  /**
   * Emit message to a specific client
   */
  emitToClient(clientId: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.warn("WebSocket server not initialized, cannot emit to client");
      return;
    }

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.to(clientId).emit(event, message);
    logger.debug(`Emitted ${event} to client: ${clientId}`);
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get list of connected client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients);
  }

  /**
   * Check if WebSocket server is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          logger.info("WebSocket server closed");
          resolve();
        });
      });
      this.io = null;
      this.connectedClients.clear();
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Event types for type safety
export const WS_EVENTS = {
  // Notifications
  NOTIFICATION: "notification",
  NOTIFICATION_STARTED: "notification:started",
  NOTIFICATION_PROGRESS: "notification:progress",
  NOTIFICATION_COMPLETED: "notification:completed",
  NOTIFICATION_ERROR: "notification:error",

  // Scan events
  SCAN_STARTED: "scan:started",
  SCAN_PROGRESS: "scan:progress",
  SCAN_FILE_FOUND: "scan:file_found",
  SCAN_COMPLETED: "scan:completed",
  SCAN_ERROR: "scan:error",

  // System events
  SYSTEM_STATUS: "system:status",
  CACHE_CLEARED: "cache:cleared",

  // Settings events
  SETTINGS_UPDATED: "settings:updated",
  SETTINGS_SETUP_COMPLETED: "settings:setup_completed",

  // Health events
  HEALTH_STATUS_CHANGED: "health:status_changed",

  // Backup events
  BACKUP_STARTED: "backup:started",
  BACKUP_PROGRESS: "backup:progress",
  BACKUP_COMPLETED: "backup:completed",
  BACKUP_ERROR: "backup:error",
} as const;
