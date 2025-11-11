import winston from "winston";
import TransportStream from "winston-transport";
import { sendLogMessage } from "../websocket";

/**
 * Custom Winston transport that broadcasts log messages via WebSocket
 */
export class WebSocketTransport extends TransportStream {
  constructor(opts?: TransportStream.TransportStreamOptions) {
    super(opts);
  }

  log(
    info: { timestamp: string; level: string; message: string; [key: string]: unknown },
    callback: () => void
  ) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // Extract relevant log information
    const { timestamp, level, message, ...meta } = info;

    // Remove winston metadata from meta
    const cleanMeta: Record<string, unknown> = { ...meta };
    const levelSymbol = Symbol.for("level") as unknown as string;
    const messageSymbol = Symbol.for("message") as unknown as string;
    const splatSymbol = Symbol.for("splat") as unknown as string;
    delete cleanMeta[levelSymbol];
    delete cleanMeta[messageSymbol];
    delete cleanMeta[splatSymbol];

    // Broadcast log message to all connected WebSocket clients
    try {
      sendLogMessage({
        level: level as "error" | "warn" | "info" | "http" | "debug",
        message: message as string,
        timestamp: timestamp as string,
        meta: Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
      });
    } catch {
      // Silently fail if WebSocket is not available or broadcasting fails
      // This prevents logger errors from cascading
    }

    callback();
  }
}

