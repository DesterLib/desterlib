import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@dester/logger";
import axios from "axios";
import { config } from "../../config/env";
import {
  WebSocketMessageType,
  WebSocketMessage,
  HealthHeartbeatMessage,
  HealthStatusMessage,
  ExtendedWebSocket,
} from "./types";

export class DesterWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<ExtendedWebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Heartbeat interval: 30 seconds
  private readonly HEARTBEAT_INTERVAL = 30_000;

  // Health check interval: 10 seconds (more frequent than heartbeat for faster detection)
  private readonly HEALTH_CHECK_INTERVAL = 10_000;

  // Ping interval for connection keep-alive: 15 seconds
  private readonly PING_INTERVAL = 15_000;

  constructor(server: HTTPServer) {
    // Create WebSocket server attached to HTTP server
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    logger.info("WebSocket server created on /ws endpoint");

    // Set up connection handler
    this.wss.on("connection", this.handleConnection.bind(this));

    // Set up error handler
    this.wss.on("error", (error) => {
      logger.error({ error }, "WebSocket server error");
    });

    // Start heartbeat and health monitoring
    this.startHeartbeat();
    this.startHealthMonitoring();
    this.startPingPong();
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket) {
    const extWs = ws as ExtendedWebSocket;
    extWs.id = uuidv4();
    extWs.isAlive = true;
    extWs.connectedAt = new Date();

    this.clients.add(extWs);
    logger.info(
      { clientId: extWs.id, totalClients: this.clients.size },
      "WebSocket client connected"
    );

    // Send connection established message
    this.sendToClient(extWs, {
      type: WebSocketMessageType.CONNECTION_ESTABLISHED,
      timestamp: new Date().toISOString(),
      data: {
        clientId: extWs.id,
        serverTime: new Date().toISOString(),
        message: "Connected to Dester Media Server",
      },
    });

    // Send immediate health status
    this.sendHealthStatus(extWs);

    // Handle pong responses
    extWs.on("pong", () => {
      extWs.isAlive = true;
    });

    // Handle client messages
    extWs.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleClientMessage(extWs, data);
      } catch (error) {
        logger.error(
          { error, clientId: extWs.id },
          "Failed to parse WebSocket message"
        );
      }
    });

    // Handle disconnection
    extWs.on("close", () => {
      this.clients.delete(extWs);
      logger.info(
        { clientId: extWs.id, totalClients: this.clients.size },
        "WebSocket client disconnected"
      );
    });

    // Handle errors
    extWs.on("error", (error) => {
      logger.error({ error, clientId: extWs.id }, "WebSocket client error");
      this.clients.delete(extWs);
    });
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(ws: ExtendedWebSocket, message: any) {
    logger.debug({ clientId: ws.id, message }, "Received message from client");

    // Future: Handle client requests (e.g., subscribe to specific events)
    // For now, all clients receive all broadcasts
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(ws: ExtendedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(
          { error, clientId: ws.id },
          "Failed to send message to client"
        );
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error(
            { error, clientId: client.id },
            "Failed to broadcast to client"
          );
        }
      }
    });

    logger.debug(
      { type: message.type, clientCount: sentCount },
      "Broadcast message sent"
    );
  }

  /**
   * Send health status to a specific client
   */
  private async sendHealthStatus(ws: ExtendedWebSocket) {
    const health = await this.checkHealth();

    const message: HealthHeartbeatMessage = {
      type: WebSocketMessageType.HEALTH_HEARTBEAT,
      timestamp: new Date().toISOString(),
      data: {
        uptime: process.uptime(),
        status: health.status,
        services: health.services,
      },
    };

    this.sendToClient(ws, message);
  }

  /**
   * Check health of API and downstream services
   */
  private async checkHealth(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    services: {
      metadata_service: string;
      scanner_service: string;
    };
  }> {
    const checkService = async (url: string): Promise<string> => {
      try {
        await axios.get(`${url}/health`, { timeout: 2000 });
        return "healthy";
      } catch (error) {
        return "unreachable";
      }
    };

    try {
      const [metadataStatus, scannerStatus] = await Promise.all([
        checkService(config.metadataServiceUrl),
        checkService(config.scannerServiceUrl),
      ]);

      const services = {
        metadata_service: metadataStatus,
        scanner_service: scannerStatus,
      };

      // Determine overall status
      const allHealthy =
        metadataStatus === "healthy" && scannerStatus === "healthy";
      const anyUnreachable =
        metadataStatus === "unreachable" || scannerStatus === "unreachable";

      let status: "healthy" | "degraded" | "unhealthy";
      if (allHealthy) {
        status = "healthy";
      } else if (anyUnreachable) {
        status = "degraded";
      } else {
        status = "unhealthy";
      }

      return { status, services };
    } catch (error) {
      logger.error({ error }, "Failed to check health");
      return {
        status: "unhealthy",
        services: {
          metadata_service: "error",
          scanner_service: "error",
        },
      };
    }
  }

  /**
   * Start periodic heartbeat broadcasts
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      if (this.clients.size === 0) {
        return; // Skip if no clients connected
      }

      const health = await this.checkHealth();

      const message: HealthHeartbeatMessage = {
        type: WebSocketMessageType.HEALTH_HEARTBEAT,
        timestamp: new Date().toISOString(),
        data: {
          uptime: process.uptime(),
          status: health.status,
          services: health.services,
        },
      };

      this.broadcast(message);
      logger.debug({ clientCount: this.clients.size }, "Heartbeat sent");
    }, this.HEARTBEAT_INTERVAL);

    logger.info({ interval: this.HEARTBEAT_INTERVAL }, "Heartbeat started");
  }

  /**
   * Start periodic health monitoring (more frequent than heartbeat)
   */
  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      if (this.clients.size === 0) {
        return; // Skip if no clients connected
      }

      const health = await this.checkHealth();

      // Only broadcast if status changed
      if (health.status !== this.lastHealthStatus) {
        logger.info(
          { oldStatus: this.lastHealthStatus, newStatus: health.status },
          "Health status changed"
        );

        const message: HealthStatusMessage = {
          type: WebSocketMessageType.HEALTH_STATUS,
          timestamp: new Date().toISOString(),
          data: {
            status: health.status,
            message: `Server health status changed to: ${health.status}`,
            services: health.services,
          },
        };

        this.broadcast(message);
        this.lastHealthStatus = health.status;
      }
    }, this.HEALTH_CHECK_INTERVAL);

    logger.info(
      { interval: this.HEALTH_CHECK_INTERVAL },
      "Health monitoring started"
    );
  }

  /**
   * Start ping/pong to detect dead connections
   */
  private startPingPong() {
    const interval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          logger.info({ clientId: ws.id }, "Terminating dead connection");
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.PING_INTERVAL);

    this.wss.on("close", () => {
      clearInterval(interval);
    });

    logger.info({ interval: this.PING_INTERVAL }, "Ping/pong started");
  }

  /**
   * Broadcast scan progress (for future implementation)
   */
  public broadcastScanProgress(data: any) {
    const message: WebSocketMessage = {
      type: WebSocketMessageType.SCAN_PROGRESS,
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcast(message);
  }

  /**
   * Broadcast scan completion (for future implementation)
   */
  public broadcastScanComplete(data: any) {
    const message: WebSocketMessage = {
      type: WebSocketMessageType.SCAN_COMPLETE,
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcast(message);
  }

  /**
   * Broadcast scan error (for future implementation)
   */
  public broadcastScanError(data: any) {
    const message: WebSocketMessage = {
      type: WebSocketMessageType.SCAN_ERROR,
      timestamp: new Date().toISOString(),
      data,
    };

    this.broadcast(message);
  }

  /**
   * Get connected clients count
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown() {
    logger.info("Shutting down WebSocket server...");

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.close(1001, "Server shutting down");
    });

    // Close server
    return new Promise<void>((resolve) => {
      this.wss.close(() => {
        logger.info("WebSocket server closed");
        resolve();
      });
    });
  }
}
