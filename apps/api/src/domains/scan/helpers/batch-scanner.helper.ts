/**
 * Batch scanning utilities
 * Handles scanning large directories in manageable batches
 */

import { readdir } from "fs/promises";
import { join, extname } from "path";
import { logger } from "@/lib/utils";
import { MediaType, ScanJobStatus } from "@/lib/database";
import prisma from "@/lib/database/prisma";
import { collectMediaEntries } from "./file-scanner.helper";
import {
  fetchExistingMetadata,
  fetchMetadataForEntries,
  fetchSeasonMetadata,
  saveMediaToDatabase,
  createRateLimiter,
  withTimeoutAndRetry,
} from "./index";
import { getDefaultVideoExtensions } from "./file-filter.helper";
import { wsManager } from "@/lib/websocket";
import type { TmdbMetadata } from "../scan.types";
import type { TmdbSeasonMetadata } from "@/lib/providers/tmdb/tmdb.types";

/**
 * Discover top-level folders to batch process
 * For TV shows: Returns show folders
 * For movies: Returns movie folders or files depending on structure
 * If movies are directly in root (no subdirectories), returns ["."] to scan root
 */
export async function discoverFoldersToScan(
  rootPath: string,
  mediaType: "movie" | "tv"
): Promise<string[]> {
  return withTimeoutAndRetry(
    async () => {
      logger.info(
        `🔍 Listing directory: ${rootPath} (this may take a while on slow mounts)...`
      );
      const entries = await readdir(rootPath, { withFileTypes: true });
      const folders: string[] = [];
      const videoExtensions = getDefaultVideoExtensions();
      let hasVideoFilesInRoot = false;

      for (const entry of entries) {
        // Skip hidden files and system files
        if (entry.name.startsWith(".") || entry.name.startsWith("@")) {
          continue;
        }

        if (entry.isDirectory()) {
          folders.push(entry.name);
        } else if (mediaType === "movie" && entry.isFile()) {
          // Check if this is a video file
          const ext = extname(entry.name).toLowerCase();
          if (videoExtensions.includes(ext)) {
            hasVideoFilesInRoot = true;
          }
        }
      }

      // For movies: If there are video files directly in root but no subdirectories,
      // return "." to indicate we should scan the root directory itself
      if (
        mediaType === "movie" &&
        hasVideoFilesInRoot &&
        folders.length === 0
      ) {
        logger.info(
          `📂 Found video files directly in root, will scan root directory`
        );
        return ["."]; // "." indicates root directory
      }

      logger.info(
        `📂 Discovered ${folders.length} ${mediaType === "tv" ? "show" : "movie"} folders to scan`
      );
      return folders;
    },
    {
      timeoutMs: 600000, // 10 minutes timeout for very slow FTP mounts (initial folder discovery can be slow)
      maxRetries: 2, // Only retry twice (each retry could take 10 min)
      operationName: `Discover folders in ${rootPath}`,
    }
  );
}

/**
 * Create or get existing scan job
 */
export async function createScanJob(
  libraryId: string,
  scanPath: string,
  mediaType: MediaType,
  folders: string[]
): Promise<string> {
  // Determine batch size based on media type
  const batchSize = mediaType === MediaType.TV_SHOW ? 5 : 25;

  // Calculate total number of batches
  const totalBatches = Math.ceil(folders.length / batchSize);

  const scanJob = await prisma.scanJob.create({
    data: {
      libraryId,
      scanPath,
      mediaType,
      status: ScanJobStatus.PENDING,
      batchSize,
      totalFolders: folders.length,
      totalBatches,
      currentBatch: 0,
      pendingFolders: JSON.stringify(folders),
      startedAt: new Date(),
    },
  });

  logger.info(
    `📝 Created scan job ${scanJob.id} for ${folders.length} folders (${totalBatches} batches of ${batchSize})`
  );
  return scanJob.id;
}

/**
 * Get the next batch of folders to process
 */
export async function getNextBatch(
  scanJobId: string
): Promise<string[] | null> {
  const scanJob = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
  });

  if (!scanJob) {
    throw new Error(`Scan job ${scanJobId} not found`);
  }

  if (scanJob.status === ScanJobStatus.COMPLETED) {
    return null;
  }

  const pendingFolders: string[] = JSON.parse(scanJob.pendingFolders);

  if (pendingFolders.length === 0) {
    return null;
  }

  const batch = pendingFolders.slice(0, scanJob.batchSize);
  return batch;
}

/**
 * Mark a batch as processed
 */
export async function markBatchProcessed(
  scanJobId: string,
  processedFolderNames: string[],
  failedFolderNames: string[] = [],
  itemsSaved: number = 0
): Promise<void> {
  const scanJob = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
  });

  if (!scanJob) {
    throw new Error(`Scan job ${scanJobId} not found`);
  }

  const pendingFolders: string[] = JSON.parse(scanJob.pendingFolders);
  const processedFolders: string[] = JSON.parse(scanJob.processedFolders);
  const failedFolders: string[] = JSON.parse(scanJob.failedFolders);

  // Remove processed folders from pending
  const newPendingFolders = pendingFolders.filter(
    (f) => !processedFolderNames.includes(f) && !failedFolderNames.includes(f)
  );

  // Add to processed/failed lists
  processedFolders.push(...processedFolderNames);
  failedFolders.push(...failedFolderNames);

  const totalProcessed = processedFolders.length + failedFolders.length;
  const isComplete = newPendingFolders.length === 0;

  // Increment current batch number
  const newCurrentBatch = scanJob.currentBatch + 1;

  const newTotalItemsSaved = scanJob.totalItemsSaved + itemsSaved;

  await prisma.scanJob.update({
    where: { id: scanJobId },
    data: {
      pendingFolders: JSON.stringify(newPendingFolders),
      processedFolders: JSON.stringify(processedFolders),
      failedFolders: JSON.stringify(failedFolders),
      processedCount: processedFolders.length,
      failedCount: failedFolders.length,
      totalItemsSaved: newTotalItemsSaved,
      currentBatch: newCurrentBatch,
      lastBatchAt: new Date(),
      status: isComplete ? ScanJobStatus.COMPLETED : ScanJobStatus.IN_PROGRESS,
      completedAt: isComplete ? new Date() : undefined,
    },
  });

  logger.info(
    `✅ Batch ${newCurrentBatch}/${scanJob.totalBatches} processed: ${processedFolderNames.length} success, ${failedFolderNames.length} failed (${totalProcessed}/${scanJob.totalFolders} folders, ${newTotalItemsSaved} items saved)`
  );
}

/**
 * Process a single folder batch
 */
export async function processFolderBatch(
  scanJobId: string,
  folderNames: string[],
  options: {
    rootPath: string;
    mediaType: "movie" | "tv";
    tmdbApiKey: string;
    libraryId: string;
    maxDepth: number;
    fileExtensions: string[];
    rescan?: boolean;
    originalPath?: string;
  }
): Promise<{
  processedFolders: string[];
  failedFolders: string[];
  totalSaved: number;
}> {
  const {
    rootPath,
    mediaType,
    tmdbApiKey,
    libraryId,
    maxDepth,
    fileExtensions,
    rescan = false,
    originalPath,
  } = options;

  const rateLimiter = createRateLimiter();
  const metadataCache = new Map<string, TmdbMetadata>();
  const episodeMetadataCache = new Map<string, TmdbSeasonMetadata>();

  const processedFolders: string[] = [];
  const failedFolders: string[] = [];
  let totalSaved = 0;

  // Get scan job for total folder count
  const scanJob = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
  });

  const totalFolders = scanJob?.totalFolders || folderNames.length;
  const currentOffset = scanJob
    ? scanJob.processedCount + scanJob.failedCount
    : 0;

  for (const folderName of folderNames) {
    // Handle "." as root directory indicator
    const folderPath =
      folderName === "." ? rootPath : join(rootPath, folderName);
    const displayName = folderName === "." ? "root directory" : folderName;

    try {
      logger.info(`\n📁 Processing: ${displayName}`);

      // Calculate overall progress (not just batch progress)
      const overallCurrent =
        currentOffset + processedFolders.length + failedFolders.length;
      const overallProgress = Math.floor((overallCurrent / totalFolders) * 100);

      wsManager.sendScanProgress({
        phase: "scanning",
        progress: overallProgress,
        current: overallCurrent,
        total: totalFolders,
        message: `Scanning: ${displayName}`,
        libraryId,
        scanJobId,
      });

      // Step 1: Collect media entries for this folder (with timeout and retry for slow mounts)
      const mediaEntries = await withTimeoutAndRetry(
        () =>
          collectMediaEntries(folderPath, {
            maxDepth,
            mediaType,
            fileExtensions,
          }),
        {
          timeoutMs: 300000, // 5 minutes timeout per folder for very slow mounts
          maxRetries: 2, // Retry twice if it fails
          operationName: `Scan folder: ${displayName}`,
        }
      );

      if (mediaEntries.length === 0) {
        logger.warn(`⚠️  No media found in ${displayName}, skipping`);
        processedFolders.push(folderName);
        continue;
      }

      logger.info(`Found ${mediaEntries.length} media items in ${displayName}`);

      // Log extracted IDs for debugging
      mediaEntries.forEach((entry) => {
        if (!entry.isDirectory && entry.extractedIds) {
          logger.info(
            `Entry: ${entry.name}, TMDB ID: ${entry.extractedIds.tmdbId || "none"}, Title: ${entry.extractedIds.title || "none"}`
          );
        }
      });

      // Step 2: Fetch existing metadata if not rescanning
      logger.info(
        `Step 2: Checking for existing metadata (rescan=${rescan})...`
      );
      let existingMetadataMap = new Map<string, TmdbMetadata>();
      let existingImagesMap = new Map<
        string,
        { plainPosterUrl: string | null; logoUrl: string | null }
      >();
      if (!rescan) {
        const tmdbIdsToCheck = mediaEntries
          .filter((e) => e.extractedIds.tmdbId)
          .map((e) => e.extractedIds.tmdbId!);

        logger.info(
          `Found ${tmdbIdsToCheck.length} TMDB IDs to check: ${tmdbIdsToCheck.join(", ")}`
        );

        if (tmdbIdsToCheck.length > 0) {
          logger.info(`Calling fetchExistingMetadata...`);
          const existingData = await fetchExistingMetadata(
            tmdbIdsToCheck,
            libraryId
          );
          logger.info(
            `fetchExistingMetadata returned ${existingData.metadataMap.size} existing entries`
          );
          existingMetadataMap = existingData.metadataMap;
          existingImagesMap = existingData.imagesMap;

          existingMetadataMap.forEach((metadata, tmdbId) => {
            metadataCache.set(tmdbId, metadata);
          });
        } else {
          logger.info(`No TMDB IDs found, skipping existing metadata check`);
        }
      } else {
        logger.info(`Skipping existing metadata check (rescan=true)`);
      }

      // Step 3: Fetch metadata from TMDB
      logger.info(`Step 3: Starting to fetch metadata from TMDB...`);
      const metadataProgress = Math.floor(
        ((currentOffset + processedFolders.length) / totalFolders) * 100
      );
      wsManager.sendScanProgress({
        phase: "fetching-metadata",
        progress: metadataProgress,
        current: currentOffset + processedFolders.length,
        total: totalFolders,
        message: `Fetching metadata: ${displayName}`,
        libraryId,
        scanJobId,
      });

      logger.info(
        `Calling fetchMetadataForEntries with ${mediaEntries.length} entries`
      );
      const metadataStats = await fetchMetadataForEntries(mediaEntries, {
        mediaType,
        tmdbApiKey,
        rateLimiter,
        metadataCache,
        existingMetadataMap,
        existingImagesMap,
        libraryId,
      });
      logger.info(
        `fetchMetadataForEntries completed: ${metadataStats.metadataFromCache} from cache, ${metadataStats.metadataFromTMDB} from TMDB`
      );

      // Step 4: Fetch season metadata for TV shows
      if (mediaType === "tv") {
        await fetchSeasonMetadata(mediaEntries, {
          tmdbApiKey,
          rateLimiter,
          episodeMetadataCache,
          libraryId,
        });
      }

      // Step 5: Save to database
      const savingProgress = Math.floor(
        ((currentOffset + processedFolders.length) / totalFolders) * 100
      );
      wsManager.sendScanProgress({
        phase: "saving",
        progress: savingProgress,
        current: currentOffset + processedFolders.length,
        total: totalFolders,
        message: `Saving: ${displayName}`,
        libraryId,
        scanJobId,
      });

      let savedCount = 0;
      for (const mediaEntry of mediaEntries) {
        if (!mediaEntry.isDirectory) {
          try {
            await saveMediaToDatabase(
              mediaEntry,
              mediaType,
              episodeMetadataCache,
              libraryId,
              originalPath
            );
            savedCount++;
          } catch (error) {
            logger.error(
              `Failed to save ${mediaEntry.name}: ${error instanceof Error ? error.message : error}`
            );
          }
        }
      }

      totalSaved += savedCount;
      processedFolders.push(folderName);

      logger.info(
        `✅ ${displayName}: Saved ${savedCount}/${mediaEntries.length} items`
      );

      // Send batch item completion
      const completionCurrent = currentOffset + processedFolders.length;
      const completionProgress = Math.floor(
        (completionCurrent / totalFolders) * 100
      );

      wsManager.sendScanProgress({
        phase: "batch-complete",
        progress: completionProgress,
        current: completionCurrent,
        total: totalFolders,
        message: `Completed: ${displayName} (${savedCount} items)`,
        libraryId,
        scanJobId,
        batchItemComplete: {
          folderName,
          itemsSaved: savedCount,
          totalItems: mediaEntries.length,
        },
      });
    } catch (error) {
      logger.error(
        `❌ Failed to process ${displayName}: ${error instanceof Error ? error.message : error}`
      );
      failedFolders.push(folderName);

      wsManager.sendScanError({
        error: `Failed to process ${displayName}: ${error instanceof Error ? error.message : String(error)}`,
        scanJobId,
      });
    }
  }

  return {
    processedFolders,
    failedFolders,
    totalSaved,
  };
}
