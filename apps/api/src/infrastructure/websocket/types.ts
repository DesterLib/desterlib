import { WebSocket } from "ws";

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  // Connection
  CONNECTION_ESTABLISHED = "connection:established",

  // Health monitoring
  HEALTH_HEARTBEAT = "health:heartbeat",
  HEALTH_STATUS = "health:status",
  HEALTH_DEGRADED = "health:degraded",

  // Scan progress (for future implementation)
  SCAN_PROGRESS = "scan:progress",
  SCAN_COMPLETE = "scan:complete",
  SCAN_ERROR = "scan:error",

  // Logs
  LOG_MESSAGE = "log:message",
}

/**
 * Base WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
  data?: any;
}

/**
 * Health heartbeat message
 */
export interface HealthHeartbeatMessage extends WebSocketMessage {
  type: WebSocketMessageType.HEALTH_HEARTBEAT;
  data: {
    uptime: number;
    status: "healthy" | "degraded" | "unhealthy";
    services: {
      metadata_service: string;
      scanner_service: string;
    };
  };
}

/**
 * Health status change message
 */
export interface HealthStatusMessage extends WebSocketMessage {
  type: WebSocketMessageType.HEALTH_STATUS;
  data: {
    status: "healthy" | "degraded" | "unhealthy";
    message: string;
    services?: {
      metadata_service?: string;
      scanner_service?: string;
    };
  };
}

/**
 * Extended WebSocket with client metadata
 */
export interface ExtendedWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  connectedAt: Date;
}

/**
 * Scan progress data (for future implementation)
 */
export interface ScanProgressData {
  phase:
    | "scanning"
    | "fetching-metadata"
    | "fetching-episodes"
    | "saving"
    | "discovering"
    | "batching"
    | "batch-complete";
  progress: number; // 0-100
  current: number;
  total: number;
  message: string;
  libraryId?: string;
  scanJobId?: string;
  batchItemComplete?: {
    folderName: string;
    itemsSaved: number;
    totalItems: number;
  };
}
