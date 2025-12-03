// Update index.ts to handle media_type
import dotenv from "dotenv";
import path from "path";
import express from "express";
import { logger } from "@dester/logger";
import { Database } from "./database";
import { RedisQueue } from "./queue";
import { MetadataService } from "./metadata-service";
import { RateLimiter } from "./rate-limiter";
import { ProviderManager } from "./provider-manager";
import { ScanJobLogger } from "./scan-job-logger";

// Load environment variables
// .env file is at project root
const envPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });

const app = express();

app.use(express.json());

// Load configuration
if (!process.env.DATABASE_URL) {
  logger.fatal("DATABASE_URL environment variable is required");
  process.exit(1);
}

if (!process.env.METADATA_PATH) {
  logger.fatal("METADATA_PATH environment variable is required");
  process.exit(1);
}

if (!process.env.SCAN_JOB_LOG_PATH) {
  logger.fatal("SCAN_JOB_LOG_PATH environment variable is required");
  process.exit(1);
}

// Resolve paths relative to project root (not current working directory)
const projectRoot = path.resolve(__dirname, "../../../");
const config = {
  port: parseInt(process.env.METADATA_PORT || "8081", 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379/0",
  queueName: process.env.METADATA_QUEUE_NAME || "metadata:jobs",
  maxConcurrentJobs: parseInt(process.env.METADATA_MAX_CONCURRENT || "20", 10),
  rateLimitRps: parseFloat(process.env.METADATA_RATE_LIMIT_RPS || "4"),
  metadataPath: path.resolve(projectRoot, process.env.METADATA_PATH),
  scanJobLogPath: path.resolve(projectRoot, process.env.SCAN_JOB_LOG_PATH),
  // Removed VIDEO_EXTENSIONS as it is not used here
};

// Initialize services
const database = new Database(config.databaseUrl, logger);
const queue = new RedisQueue(config.redisUrl, config.queueName, logger);
const rateLimiter = new RateLimiter(config.rateLimitRps, logger);
const scanJobLogger = new ScanJobLogger(config.scanJobLogPath, logger);

// Initialize provider manager (loads providers from database)
const providerManager = new ProviderManager(database, rateLimiter, logger);
let metadataService: MetadataService | null = null;

// Health check endpoint
app.get("/health", async (req, res) => {
  const isRedisConnected = queue.isReady();
  const isDatabaseConnected = await database.isConnected();
  const isProviderAvailable = metadataService ? true : false;

  const status = isRedisConnected && isDatabaseConnected ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    services: {
      redis: isRedisConnected ? "connected" : "disconnected",
      database: isDatabaseConnected ? "connected" : "disconnected",
      metadata_provider: isProviderAvailable ? "configured" : "missing",
    },
  });
});

// Get movie metadata (Debug/Internal)
app.get("/movie/:id", async (req, res) => {
  try {
    const mediaId = req.params.id;
    // Assuming MOVIE for this endpoint for backward compatibility debugging
    const media = await database.getMediaMetadata(mediaId, "MOVIE");
    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json(media);
  } catch (error) {
    logger.error({ error }, "Failed to get media");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reload providers and restart consumer if needed
// This endpoint is called by the API service. See /api/v1/settings/providers/reload for public API documentation.
app.post("/providers/reload", async (req, res) => {
  try {
    logger.info("Reloading metadata providers...");

    // Re-initialize providers from database
    await providerManager.initialize();

    // Get primary provider and initialize metadata service
    const primaryProvider = providerManager.getPrimaryProvider();
    if (primaryProvider) {
      metadataService = new MetadataService(
        database,
        primaryProvider,
        logger,
        config.metadataPath
      );
      logger.info(
        {
          provider: primaryProvider.getProviderName(),
          path: config.metadataPath,
        },
        "Metadata service reloaded with provider"
      );

      // Start consumer if not already running
      if (!isConsumerRunning) {
        startConsumer().catch((error) => {
          logger.error(
            { error },
            "Failed to start queue consumer after reload"
          );
        });
      }

      return res.json({
        success: true,
        message: "Providers reloaded successfully",
        provider: primaryProvider.getProviderName(),
      });
    } else {
      logger.warn("No metadata providers available after reload");
      return res.status(503).json({
        success: false,
        error: "No metadata providers available",
      });
    }
  } catch (error) {
    logger.error({ error }, "Failed to reload providers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh metadata for a movie
app.post("/metadata/refresh/:id", async (req, res) => {
  try {
    if (!metadataService) {
      return res.status(503).json({
        error: "Metadata service unavailable. No metadata provider configured.",
      });
    }

    const mediaId = req.params.id;
    // For refresh, we ideally need type. Defaulting to MOVIE if not provided in query
    // Query params are not strictly typed in express without generics, assuming query string
    const type = (req.query.type as string)?.toUpperCase() || "MOVIE";

    // Check if exists
    const exists = await database.getMediaMetadata(mediaId, type);
    if (!exists) {
      return res.status(404).json({ error: "Media not found" });
    }

    // We need title to search. Fetch it first.
    // getMediaMetadata doesn't return title currently.
    // Assuming for refresh we might need to fetch title from DB or rely on what's passed.
    // But the requirement is to refresh existing media.
    // I'll add getMediaTitle to database or extend getMediaMetadata

    // For now, let's assume client passes title or we skip title search if we have ExternalID?
    // Actually fetchAndSaveMetadata searches by title.

    // Simplified: Require title in body for refresh if not implementing full fetch
    const title = req.body.title;
    const year = req.body.year;

    if (!title) {
      return res.status(400).json({ error: "Title is required for refresh" });
    }

    await metadataService.fetchAndSaveMetadata(mediaId, type, title, year);

    res.json({ message: "Metadata refreshed", mediaId });
  } catch (error) {
    logger.error({ error }, "Failed to refresh metadata");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Track if consumer is running
let isConsumerRunning = false;

// Start queue consumer
async function startConsumer() {
  if (isConsumerRunning) {
    logger.debug("Queue consumer already running");
    return;
  }

  logger.info("Starting metadata queue consumer...");

  // Check if queue is available before starting consumer
  const isReady = await queue.ping();
  if (!isReady) {
    logger.warn(
      "Redis not available. Queue consumer will not start. Start Redis with: docker-compose up redis or redis-server"
    );
    return;
  }

  logger.info("Redis connection verified, starting queue consumer");
  isConsumerRunning = true;

  // Track which library IDs have started metadata processing
  const processingLibraries = new Set<string>();

  const processJob = async (job: any) => {
    // Destructure media_type
    const {
      media_id,
      title,
      year,
      library_id,
      folder_path,
      filename,
      media_type,
    } = job;
    const type = (media_type || "MOVIE").toUpperCase();

    try {
      if (!metadataService) {
        logger.warn(
          { mediaId: media_id },
          "Metadata service unavailable (no provider configured), skipping job"
        );
        // Track as failure if library_id is available
        if (library_id && database) {
          // Get scan job ID for logging
          const scanJobId = await database.getActiveScanJobId(library_id);

          // Log to scan job failure log if available
          if (scanJobId) {
            await scanJobLogger
              .logFailure(scanJobId, {
                mediaId: media_id,
                title: title || "Unknown",
                year,
                filename,
                folderPath: folder_path,
                reason: "Metadata service unavailable (no provider configured)",
              })
              .catch((err) => {
                logger.debug(
                  { error: err, scanJobId },
                  "Failed to write to scan job log (non-critical)"
                );
              });
          }

          await database
            .incrementScanJobMetadataFailure(library_id)
            .catch((err) => {
              logger.debug(
                { error: err, library_id },
                "Failed to track metadata failure (non-critical)"
              );
            });
        }
        return;
      }

      // Job format from scanner: { media_id, title, year, folder_path, filename, library_id, media_type }
      // We can use the job data directly
      if (!media_id || !title) {
        logger.warn({ job }, "Invalid job data, skipping");
        // Track as failure if library_id is available
        if (library_id && database) {
          // Get scan job ID for logging
          const scanJobId = await database.getActiveScanJobId(library_id);

          // Log to scan job failure log if available
          if (scanJobId) {
            await scanJobLogger
              .logFailure(scanJobId, {
                mediaId: media_id || "unknown",
                title: title || "Unknown",
                year,
                filename,
                folderPath: folder_path,
                reason: "Invalid job data (missing media_id or title)",
              })
              .catch((err) => {
                logger.debug(
                  { error: err, scanJobId },
                  "Failed to write to scan job log (non-critical)"
                );
              });
          }

          await database
            .incrementScanJobMetadataFailure(library_id)
            .catch((err) => {
              logger.debug(
                { error: err, library_id },
                "Failed to track metadata failure (non-critical)"
              );
            });
        }
        return;
      }

      // Mark metadata processing as started for this library
      if (library_id && !processingLibraries.has(library_id)) {
        processingLibraries.add(library_id);
        await database
          .updateMetadataStatus(library_id, "IN_PROGRESS")
          .catch((err) => {
            logger.debug(
              { error: err, library_id },
              "Failed to update metadata status (non-critical)"
            );
          });
      }

      // We don't check for existence here specifically because fetchAndSaveMetadata will fail if not found
      // and we handle MEDIA_NOT_FOUND error below.

      await metadataService.fetchAndSaveMetadata(
        media_id,
        type,
        title,
        year,
        library_id
      );
      logger.info(
        { mediaId: media_id, type },
        "Metadata processed successfully"
      );

      // Check if all metadata jobs are complete (after logging)
      if (library_id) {
        await database
          .checkAndMarkMetadataComplete(library_id)
          .catch((error) => {
            logger.debug(
              { error, library_id },
              "Failed to check metadata completion (non-critical)"
            );
          });
      }
    } catch (error: any) {
      // Track metadata failure if library_id is available
      if (library_id && database) {
        // Get scan job ID for logging
        const scanJobId = await database.getActiveScanJobId(library_id);

        // Log to scan job failure log if available
        if (scanJobId) {
          await scanJobLogger
            .logFailure(scanJobId, {
              mediaId: media_id,
              title: title || "Unknown",
              year,
              filename,
              folderPath: folder_path,
              reason:
                error?.code === "MEDIA_NOT_FOUND"
                  ? "Media record not found"
                  : "Error processing metadata job",
              error: error?.message || String(error),
            })
            .catch((err) => {
              logger.debug(
                { error: err, scanJobId },
                "Failed to write to scan job log (non-critical)"
              );
            });
        }

        await database
          .incrementScanJobMetadataFailure(library_id)
          .catch((err) => {
            logger.debug(
              { error: err, library_id },
              "Failed to track metadata failure (non-critical)"
            );
          });
      }

      // If Media record doesn't exist, don't retry - it will never succeed
      if (error?.code === "MEDIA_NOT_FOUND") {
        logger.warn(
          { mediaId: media_id, error: error.message },
          "Media record not found, skipping job (will not retry)"
        );
        return; // Don't throw, so job is marked as processed
      }

      logger.error(
        { error, mediaId: media_id },
        "Failed to process metadata job"
      );

      // Job will be retried by queue mechanism for other errors
      throw error;
    }
  };

  await queue.consume(processJob, config.maxConcurrentJobs);
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await scanJobLogger.closeAll();
  await queue.close();
  await database.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await scanJobLogger.closeAll();
  await queue.close();
  await database.close();
  process.exit(0);
});

// Initialize providers and start server
async function startServer() {
  try {
    // Initialize providers from database
    await providerManager.initialize();

    // Get primary provider and initialize metadata service
    const primaryProvider = providerManager.getPrimaryProvider();
    if (primaryProvider) {
      metadataService = new MetadataService(
        database,
        primaryProvider,
        logger,
        config.metadataPath
      );
      logger.info(
        {
          provider: primaryProvider.getProviderName(),
          path: config.metadataPath,
        },
        "Metadata service initialized with provider"
      );
    } else {
      logger.warn(
        "No metadata providers available. Metadata fetching will be disabled."
      );
    }

    // Start server
    const server = app.listen(config.port, () => {
      logger.info({ port: config.port }, "Metadata service started");

      if (metadataService) {
        startConsumer().catch((error) => {
          logger.error({ error }, "Failed to start queue consumer");
          process.exit(1);
        });
      } else {
        logger.warn(
          "No metadata provider configured. Queue consumer will not start."
        );
      }
    });
  } catch (error) {
    logger.error({ error }, "Failed to initialize metadata service");
    process.exit(1);
  }
}

startServer();

export default app;
