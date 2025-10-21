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

// Module-level state
let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();

export function initializeWebSocket(server: HTTPServer) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("🔌 WebSocket client connected");
    clients.add(ws);

    ws.on("close", () => {
      logger.info("🔌 WebSocket client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      logger.error(`WebSocket error: ${error.message}`);
      clients.delete(ws);
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

export function broadcast(message: WebSocketMessage) {
  const payload = JSON.stringify(message);
  let successCount = 0;
  let failCount = 0;

  clients.forEach((client) => {
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

export function sendScanProgress(data: Omit<ScanProgress, "type">) {
  broadcast({
    type: "scan:progress",
    ...data,
  });
}

export function sendScanComplete(data: Omit<ScanComplete, "type">) {
  broadcast({
    type: "scan:complete",
    ...data,
  });
}

export function sendScanError(data: Omit<ScanError, "type">) {
  broadcast({
    type: "scan:error",
    ...data,
  });
}

export function getClientCount(): number {
  return clients.size;
}

export function closeWebSocket() {
  if (wss) {
    clients.forEach((client) => {
      client.close();
    });
    wss.close();
    logger.info("WebSocket server closed");
  }
}

// For backward compatibility, maintain the wsManager object interface
export const wsManager = {
  initialize: initializeWebSocket,
  broadcast,
  sendScanProgress,
  sendScanComplete,
  sendScanError,
  getClientCount,
  close: closeWebSocket,
};
export type { ScanProgress, ScanComplete, ScanError, WebSocketMessage };
