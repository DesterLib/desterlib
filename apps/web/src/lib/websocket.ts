/**
 * WebSocket Client Service
 *
 * Connects to the backend WebSocket server and provides
 * real-time updates for settings, health status, and other events
 */

import { io, Socket } from "socket.io-client";

export type WebSocketEventCallback = (data: unknown) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  /**
   * Initialize WebSocket connection
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    this.socket = io(baseUrl, {
      path: "/ws",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("connected", (data: unknown) => {
      console.log("WebSocket welcome message:", data);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("⚠️ WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      console.error("❌ WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached. Giving up.");
      }
    });

    this.socket.on("pong", (data: unknown) => {
      console.debug("WebSocket pong:", data);
    });
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: WebSocketEventCallback): void {
    if (!this.socket) {
      console.warn("WebSocket not initialized. Call connect() first.");
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: WebSocketEventCallback): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn("WebSocket not connected. Cannot emit event:", event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Subscribe to a room
   */
  subscribe(room: string): void {
    this.emit("subscribe", room);
  }

  /**
   * Unsubscribe from a room
   */
  unsubscribe(room: string): void {
    this.emit("unsubscribe", room);
  }

  /**
   * Send ping to server
   */
  ping(): void {
    this.emit("ping");
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const webSocketClient = new WebSocketClient();

// WebSocket event types (must match backend)
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
