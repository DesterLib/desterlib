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

// Enable SO_REUSEADDR to allow port reuse immediately after restart
httpServer.on("listening", () => {
  const address = httpServer.address();
  if (address && typeof address !== "string") {
    // Socket is successfully bound
  }
});

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

    // Handle port already in use error
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

    httpServer.listen(config.port, "0.0.0.0", async () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      logger.info(
        `📚 API Documentation: http://localhost:${config.port}/api/docs`,
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

      // Auto-resume interrupted scan jobs from previous session
      logger.info(
        "🔍 Checking for interrupted scan jobs from previous session...",
      );
      const interruptedJobs = await prisma.scanJob.findMany({
        where: {
          status: {
            in: ["IN_PROGRESS", "PENDING"],
          },
        },
        include: {
          library: {
            select: { name: true },
          },
        },
      });

      if (interruptedJobs.length > 0) {
        logger.info(
          `⏸️  Found ${interruptedJobs.length} interrupted scan job(s) - auto-resuming...`,
        );

        // Import scanServices dynamically to avoid circular deps
        const { scanServices } = await import(
          "./domains/scan/scan.services.js"
        );

        for (const job of interruptedJobs) {
          logger.info(
            `🔄 Resuming: ${job.library.name} (${job.processedCount}/${job.totalFolders} folders, Batch ${job.currentBatch}/${job.totalBatches})`,
          );

          // Get TMDB API key
          const tmdbApiKey = await settingsManager.getTmdbApiKey();
          if (!tmdbApiKey) {
            logger.warn(
              `   ⚠️  Skipping ${job.library.name} - TMDB API key not configured`,
            );
            continue;
          }

          // First, mark as FAILED so resumeScanJob can pick it up
          await prisma.scanJob.update({
            where: { id: job.id },
            data: { status: "FAILED" },
          });

          // Resume in background (small delay to ensure DB update propagates)
          setTimeout(() => {
            scanServices
              .resumeScanJob(job.id, tmdbApiKey)
              .then((result) => {
                logger.info(
                  `✅ Auto-resumed scan completed: ${result.libraryName} (${result.totalItemsSaved} additional items)`,
                );
              })
              .catch((error: unknown) => {
                logger.error(
                  `❌ Auto-resume failed for ${job.library.name}: ${error instanceof Error ? error.message : error}`,
                );
              });
          }, 100);
        }

        logger.info(
          `✅ Started auto-resume for ${interruptedJobs.length} scan job(s)`,
        );
      } else {
        logger.info("✅ No interrupted scans found");
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Close HTTP server first
  httpServer.close(() => {
    logger.info("HTTP server closed");
  });

  // Close WebSocket connections
  wsManager.close();

  // Disconnect from database
  await prisma.$disconnect();

  logger.info("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // tsx/nodemon sends this

// Handle uncaught exceptions to prevent zombie processes
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

startServer();
