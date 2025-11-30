import express from "express";
import { createServer } from "http";
import { config } from "./config/env";
import {
  setupMiddleware,
  setupErrorHandling,
} from "./interfaces/http/middleware";
import { setupRoutes } from "./interfaces/http/routes/setup";
import { prisma } from "./infrastructure/prisma";
import { container } from "./infrastructure/container";
import { settingsManager } from "./infrastructure/core/settings";
import { logger } from "@dester/logger";

const app = express();
const httpServer = createServer(app);

// Initialize dependency injection container
container.initialize();

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Setup error handling (must be last)
setupErrorHandling(app);

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
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      logger.info(
        `📚 API Documentation: http://localhost:${config.port}/api/docs`
      );
      logger.info(`🔧 Environment: ${config.nodeEnv}`);
      logger.info(`🗄️  Database: ${config.databaseUrl}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

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
