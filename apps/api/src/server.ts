import express from "express";
import { createServer } from "http";
import os from "os";
import { config } from "./config/env";
import {
  setupMiddleware,
  setupErrorHandling,
} from "./interfaces/http/middleware";
import { setupRoutes } from "./interfaces/http/routes/setup";
import { prisma } from "./infrastructure/prisma";
import { container } from "./infrastructure/container";
import { settingsManager } from "./infrastructure/core/settings";
import { DesterWebSocketServer } from "./infrastructure/websocket";
import { logger } from "@dester/logger";

const app = express();
const httpServer = createServer(app);

// WebSocket server instance (initialized after HTTP server starts)
let wsServer: DesterWebSocketServer | null = null;

// Initialize dependency injection container
container.initialize();

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Setup error handling (must be last)
setupErrorHandling(app);

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family !== "IPv4" || iface.internal) {
        continue;
      }

      const address = iface.address;
      candidates.push(address);
    }
  }

  // Prefer private LAN addresses over link-local or others
  const isPrivateLan = (ip: string) =>
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

  const privateIp = candidates.find(isPrivateLan);
  if (privateIp) {
    return privateIp;
  }

  // Fallback: first non-internal IPv4 address, even if link-local
  if (candidates.length > 0) {
    return candidates[0];
  }

  return "localhost";
};

const startServer = async () => {
  try {
    logger.info("Starting DesterLib server...");

    // Initialize settings
    await settingsManager.initialize();

    httpServer.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`❌ Port ${config.port} is already in use!`);
        logger.error(`💡 To kill the process using this port, run:`);
        logger.error(`   lsof -ti:${config.port} | xargs kill -9`);
        process.exit(1);
      } else {
        logger.error("Server error:", error);
        process.exit(1);
      }
    });

    httpServer.listen(config.port, "0.0.0.0", () => {
      const ip = getLocalIp();
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Health check: http://${ip}:${config.port}/health`);
      logger.info(`📚 API Documentation: http://${ip}:${config.port}/api/docs`);
      logger.info(`🔧 Environment: ${config.nodeEnv}`);
      logger.info(`🗄️  Database: ${config.databaseUrl}`);

      // Initialize WebSocket server
      try {
        wsServer = new DesterWebSocketServer(httpServer);
        logger.info(`🔌 WebSocket server: ws://${ip}:${config.port}/ws`);
        logger.info(`💓 Health heartbeat: 30s interval`);
      } catch (error) {
        logger.error("Failed to initialize WebSocket server:", error);
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Close WebSocket server first
  if (wsServer) {
    await wsServer.shutdown();
  }

  httpServer.close(() => {
    logger.info("HTTP server closed");
  });

  await prisma.$disconnect();
  logger.info("Database disconnected");

  logger.info("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

startServer();
