import { Request, Response } from "express";
import { scanServices } from "./scan.services";
import { scanPathSchema } from "./scan.schema";
import { getTmdbApiKey } from "../../core/config/settings";
import { z } from "zod";
import {
  logger,
  mapHostToContainerPath,
  asyncHandler,
  ValidationError,
  sendSuccess,
} from "@/lib/utils";
import { wsManager } from "@/lib/websocket";
import {
  isDangerousRootPath,
  isMediaRootPath,
  detectMediaTypeMismatch,
} from "./helpers";
import { existsSync, statSync } from "fs";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

// Scan queue to prevent overwhelming slow mounts
let activeScan: Promise<void> | null = null;
const scanQueue: Array<() => Promise<void>> = [];

async function processQueue() {
  if (activeScan) {
    logger.info("📋 Scan queued - another scan is in progress");
    return;
  }

  if (scanQueue.length === 0) return;

  const nextScan = scanQueue.shift()!;
  activeScan = nextScan().finally(() => {
    activeScan = null;
    processQueue(); // Process next in queue
  });
}

export const scanControllers = {
  /**
   * Scan a path for media files
   */
  post: asyncHandler(async (req: Request, res: Response) => {
    const { path, options } = req.validatedData as ScanPathRequest;

    // Early validation: check if path is a dangerous root path
    if (isDangerousRootPath(path)) {
      throw new ValidationError(
        "Cannot scan system root directories or entire drives. Please specify a media folder (e.g., /Users/username/Movies)",
      );
    }

    // Map host path to container path if running in Docker
    const mappedPath = mapHostToContainerPath(path);

    // Validate that the path exists and is accessible
    try {
      if (!existsSync(mappedPath)) {
        throw new ValidationError(
          `Path does not exist or is not accessible: ${path}`,
        );
      }

      const stats = statSync(mappedPath);
      if (!stats.isDirectory()) {
        throw new ValidationError(
          `Path must be a directory, not a file: ${path}`,
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Cannot access path: ${path}. Please check permissions and path validity.`,
      );
    }

    // Check if this is a broad media root path with multiple collections
    // Note: For TV shows, having multiple show folders is EXPECTED and normal
    // Only check for broad roots when mixing different media types
    const mediaType = options?.mediaType;

    // Only perform broad root check if media type is not TV
    // TV libraries naturally contain multiple shows in subdirectories
    if (mediaType !== "tv") {
      const mediaRootCheck = await isMediaRootPath(mappedPath);
      if (mediaRootCheck.isBroadMediaRoot) {
        logger.warn(`⚠️  Detected broad media root path: ${path}`);
        logger.warn(
          `   Found collections: ${mediaRootCheck.detectedCollections.join(", ")}`,
        );
        logger.warn(`   ${mediaRootCheck.recommendation}`);

        throw new ValidationError(
          mediaRootCheck.recommendation ||
            "This path contains multiple media collections. Please scan specific collections individually for better organization and performance.",
        );
      }
    }

    // Get TMDB API key from database settings
    const tmdbApiKey = await getTmdbApiKey();
    if (!tmdbApiKey) {
      throw new ValidationError(
        "TMDB API key is required. Please configure it in settings.",
      );
    }

    const finalOptions = {
      ...options,
      tmdbApiKey,
      // Pass the original path for database storage and display
      originalPath: path !== mappedPath ? path : undefined,
    };

    logger.info(`Scanning path: ${mappedPath} (original: ${path})`);

    // Detect media type mismatch (warn if directory structure doesn't match specified type)
    const effectiveMediaType = mediaType || "movie";
    const mismatchDetection = detectMediaTypeMismatch(
      mappedPath,
      effectiveMediaType,
    );
    if (mismatchDetection.mismatch) {
      logger.warn(mismatchDetection.warning);
      // Don't throw error, just log warning - user might know what they're doing
    } else {
      logger.info(
        `✓ Media type validation passed (confidence: ${mismatchDetection.confidence}%)`,
      );
    }

    // Determine if we should use batch scanning
    // Use batch scanning if:
    // 1. Explicitly requested via options.batchScan = true
    // 2. OR it's a TV show library (5 per batch)
    // 3. OR it's a movie library (25 per batch - better for large/slow storage)
    // Only disable if explicitly set to false
    const useBatchScan = options?.batchScan !== false;

    if (useBatchScan) {
      logger.info(
        `🔄 Using batch scanning mode (${mediaType === "tv" ? "5" : "25"} folders per batch)`,
      );
    } else {
      logger.info(`📁 Using full directory scanning mode`);
    }

    // Queue the scan to prevent overwhelming slow mounts
    const scanTask = async () => {
      const scanPromise = useBatchScan
        ? scanServices.postBatched(mappedPath, finalOptions)
        : scanServices.post(mappedPath, finalOptions);

      return scanPromise
        .then((result) => {
          if ("totalFiles" in result) {
            logger.info(
              `✅ Scan completed: ${result.libraryName} (${result.totalSaved}/${result.totalFiles} items)`,
            );
          } else {
            logger.info(`✅ Batch scan completed: ${result.libraryName}`);
            logger.info(
              `   📁 Folders: ${result.foldersProcessed}/${result.totalFolders} processed, ${result.foldersFailed} failed`,
            );
            logger.info(
              `   🎬 Media Items: ${result.totalItemsSaved} saved to database`,
            );
          }
        })
        .catch((error) => {
          // Send error via WebSocket
          const errorMessage =
            error instanceof Error ? error.message : "Failed to scan path";
          logger.error(`❌ Scan failed: ${errorMessage}`);
          wsManager.sendScanError({
            error: errorMessage,
          });
        });
    };

    // Add to queue or start immediately
    if (activeScan) {
      scanQueue.push(scanTask);
      logger.info(`📋 Scan queued (${scanQueue.length} in queue)`);
      return sendSuccess(
        res,
        {
          path: path,
          mediaType: options?.mediaType,
          queued: true,
          queuePosition: scanQueue.length,
        },
        202,
        `Scan queued. ${scanQueue.length} scan(s) ahead in queue. Progress will be sent via WebSocket when started.`,
      );
    } else {
      // Start scan immediately - don't call processQueue() here as it will return early
      // processQueue() will be called automatically when this scan completes (in the .finally() block)
      activeScan = scanTask().finally(() => {
        activeScan = null;
        processQueue(); // Process next in queue after this one completes
      });

      return sendSuccess(
        res,
        {
          path: path,
          mediaType: options?.mediaType,
          queued: false,
        },
        202,
        "Scan started successfully. Progress will be sent via WebSocket.",
      );
    }
  }),

  /**
   * Resume a failed or paused scan job
   */
  resumeScan: asyncHandler(async (req: Request, res: Response) => {
    const { scanJobId } = req.params;

    if (!scanJobId) {
      throw new ValidationError("Scan job ID is required");
    }

    // Get TMDB API key from database settings
    const tmdbApiKey = await getTmdbApiKey();
    if (!tmdbApiKey) {
      throw new ValidationError(
        "TMDB API key is required. Please configure it in settings.",
      );
    }

    logger.info(`Resuming scan job: ${scanJobId}`);

    // Start the resume in the background (don't await)
    scanServices
      .resumeScanJob(scanJobId, tmdbApiKey)
      .then((result) => {
        logger.info(`✅ Resumed scan completed: ${result.libraryName}`);
        logger.info(
          `   📁 Folders: ${result.foldersProcessed}/${result.totalFolders} processed, ${result.foldersFailed} failed`,
        );
        logger.info(
          `   🎬 Media Items: ${result.totalItemsSaved} total in database`,
        );
      })
      .catch((error) => {
        // Send error via WebSocket
        const errorMessage =
          error instanceof Error ? error.message : "Failed to resume scan";
        logger.error(`❌ Resume scan failed: ${errorMessage}`);
        wsManager.sendScanError({
          error: errorMessage,
          scanJobId,
        });
      });

    // Return immediately with 202 Accepted
    return sendSuccess(
      res,
      { scanJobId },
      202,
      "Scan resumed successfully. Progress will be sent via WebSocket.",
    );
  }),

  /**
   * Get scan job status
   */
  getJobStatus: asyncHandler(async (req: Request, res: Response) => {
    const { scanJobId } = req.params;

    if (!scanJobId) {
      throw new ValidationError("Scan job ID is required");
    }

    const status = await scanServices.getJobStatus(scanJobId);

    if (!status) {
      throw new ValidationError(`Scan job ${scanJobId} not found`);
    }

    return sendSuccess(res, status);
  }),

  /**
   * Cleanup stale scan jobs
   */
  cleanupStaleJobs: asyncHandler(async (req: Request, res: Response) => {
    logger.info("Manual cleanup of stale scan jobs requested");

    const result = await scanServices.cleanupStaleJobs();

    return sendSuccess(
      res,
      result,
      200,
      "Stale scan jobs cleaned up successfully",
    );
  }),
};
