import express from "express";
import dotenv from "dotenv";
import { config } from "./config/env";
import {
  setupMiddleware,
  setupErrorHandling,
  setupRoutes,
  prisma,
} from "./lib";
import { logger } from "./lib/utils";

// Load environment variables
dotenv.config();

const app = express();

// ==================== MIDDLEWARE ====================
setupMiddleware(app);

// ==================== ROUTES ====================
setupRoutes(app);

// ==================== ERROR HANDLING ====================
setupErrorHandling(app);

// ==================== SERVER SETUP ====================
// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`);
  logger.info(`📊 Health check: http://localhost:${config.port}/health`);
  logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
  logger.info(`🔧 Environment: ${config.nodeEnv}`);
});
