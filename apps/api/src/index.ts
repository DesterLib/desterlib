import express from "express";
import { createServer } from "http";
import { config } from "./core/config/env";
import {
  setupMiddleware,
  setupErrorHandling,
  setupRoutes,
  prisma,
} from "./lib";
import { logger } from "./lib/utils";
import { wsManager } from "./lib/websocket";
import { settingsManager } from "./core/config/settings";

const app = express();
const httpServer = createServer(app);

setupMiddleware(app);
setupRoutes(app);
setupErrorHandling(app);
wsManager.initialize(httpServer);
const startServer = async () => {
  try {
    logger.info("Starting DesterLib server...");
    await settingsManager.initialize();

    const isFirstRun = await settingsManager.isFirstRun();
    const tmdbApiKey = await settingsManager.getTmdbApiKey();

    httpServer.listen(config.port, "0.0.0.0", async () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      logger.info(
        `📚 API Documentation: http://localhost:${config.port}/api/docs`
      );
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${config.port}/ws`);
      logger.info(`🔧 Environment: ${config.nodeEnv}`);
      logger.info(`🗄️  Database: ${config.databaseUrl}`);

      if (isFirstRun) {
        logger.info("⏳ First run: Please configure TMDB API key in settings");
      } else if (tmdbApiKey) {
        logger.info("✅ TMDB API key configured");
      } else {
        logger.info("⚠️  TMDB API key not configured - add it in settings");
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");
  wsManager.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer();
