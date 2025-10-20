import express from "express";
import { createServer } from "http";
import { config } from "./config/env";
import {
  setupMiddleware,
  setupErrorHandling,
  setupRoutes,
  prisma,
} from "./lib";
import { logger } from "./lib/utils";
import { wsManager } from "./lib/websocket";

const app = express();
const httpServer = createServer(app);

// ==================== MIDDLEWARE ====================
setupMiddleware(app);

// ==================== ROUTES ====================
setupRoutes(app);

// ==================== ERROR HANDLING ====================
setupErrorHandling(app);

// ==================== WEBSOCKET ====================
wsManager.initialize(httpServer);

// ==================== SERVER SETUP ====================
// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");
  wsManager.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
httpServer.listen(config.port, "0.0.0.0", () => {
  logger.info(`🚀 Server running on port ${config.port}`);
  logger.info(`📊 Health check: http://localhost:${config.port}/health`);
  logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
  logger.info(`🔌 WebSocket endpoint: ws://localhost:${config.port}/ws`);
  logger.info(`🔧 Environment: ${config.nodeEnv}`);
});
