import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { logger } from "@/lib/utils";

interface ScanProgress {
  type: "scan:progress";
  phase: "scanning" | "fetching-metadata" | "fetching-episodes" | "saving";
  progress: number; // 0-100
  current: number;
  total: number;
  message: string;
  libraryId?: string;
}

interface ScanComplete {
  type: "scan:complete";
  libraryId: string;
  totalItems: number;
  message: string;
}

interface ScanError {
  type: "scan:error";
  libraryId?: string;
  error: string;
}

type WebSocketMessage = ScanProgress | ScanComplete | ScanError;

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      logger.info("🔌 WebSocket client connected");
      this.clients.add(ws);

      ws.on("close", () => {
        logger.info("🔌 WebSocket client disconnected");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        logger.error(`WebSocket error: ${error.message}`);
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "connection:established",
          message: "Connected to Dester API WebSocket",
        })
      );
    });

    logger.info("✅ WebSocket server initialized on /ws");
  }

  broadcast(message: WebSocketMessage) {
    const payload = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
          successCount++;
        } catch (error) {
          failCount++;
          logger.error(
            `Failed to send message to client: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    });

    if (successCount > 0 || failCount > 0) {
      logger.debug(
        `📡 Broadcast: ${successCount} successful, ${failCount} failed`
      );
    }
  }

  sendScanProgress(data: Omit<ScanProgress, "type">) {
    this.broadcast({
      type: "scan:progress",
      ...data,
    });
  }

  sendScanComplete(data: Omit<ScanComplete, "type">) {
    this.broadcast({
      type: "scan:complete",
      ...data,
    });
  }

  sendScanError(data: Omit<ScanError, "type">) {
    this.broadcast({
      type: "scan:error",
      ...data,
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close() {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.close();
      });
      this.wss.close();
      logger.info("WebSocket server closed");
    }
  }
}

export const wsManager = new WebSocketManager();
export type { ScanProgress, ScanComplete, ScanError, WebSocketMessage };
