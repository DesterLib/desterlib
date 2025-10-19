import express from "express";
import dotenv from "dotenv";
import { config } from "./config/env";
import {
  setupMiddleware,
  setupErrorHandling,
  setupRoutes,
  prisma,
} from "./lib";

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
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
});
