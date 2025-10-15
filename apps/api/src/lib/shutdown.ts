/**
 * Graceful Shutdown Handler
 *
 * Handles SIGTERM and SIGINT signals for graceful application shutdown.
 * Ensures database connections are closed and in-flight requests complete.
 *
 * Usage:
 *   import { setupGracefulShutdown } from './lib/shutdown.js';
 *   const server = app.listen(port);
 *   setupGracefulShutdown(server);
 */

import type { Server } from "http";
import logger from "../config/logger.js";
import { disconnectPrisma } from "./prisma.js";
import { cacheService } from "./cache.js";
import { webSocketService } from "./websocket.js";

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

/**
 * Performs cleanup tasks before shutting down
 */
async function cleanup(): Promise<void> {
  logger.info("Running cleanup tasks...");

  try {
    // Close WebSocket connections
    await webSocketService.close();

    // Close Redis cache connection
    await cacheService.close();

    // Disconnect from database
    await disconnectPrisma();

    // Add other cleanup tasks here
    // - Flush metrics
    // - Close message queue connections
    // etc.

    logger.info("Cleanup completed successfully");
  } catch (error) {
    logger.error("Error during cleanup:", error);
    throw error;
  }
}

/**
 * Handles graceful shutdown
 */
async function handleShutdown(signal: string, server: Server): Promise<void> {
  logger.info(`Received ${signal} signal, initiating graceful shutdown...`);

  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logger.error("Error closing server:", err);
      process.exit(1);
    }

    try {
      await cleanup();
      logger.info("Server shut down gracefully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error(
      `Shutdown timeout exceeded (${SHUTDOWN_TIMEOUT}ms), forcing exit`
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
}

/**
 * Sets up graceful shutdown handlers for SIGTERM and SIGINT
 */
export function setupGracefulShutdown(server: Server): void {
  process.on("SIGTERM", () => handleShutdown("SIGTERM", server));
  process.on("SIGINT", () => handleShutdown("SIGINT", server));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    handleShutdown("uncaughtException", server);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    handleShutdown("unhandledRejection", server);
  });

  logger.info("Graceful shutdown handlers registered");
}
