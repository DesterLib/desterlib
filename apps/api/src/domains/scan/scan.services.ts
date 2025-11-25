import { logger } from "@/lib/utils";
import type { TmdbSeasonMetadata } from "@/lib/providers/tmdb/tmdb.types";
import type { TmdbMetadata } from "./scan.types";
import prisma from "@/lib/database/prisma";
import { MediaType } from "@/lib/database";
import { wsManager } from "@/lib/websocket";
import {
  createRateLimiter,
  getDefaultVideoExtensions,
  collectMediaEntries,
  fetchExistingMetadata,
  fetchMetadataForEntries,
  fetchSeasonMetadata,
  saveMediaToDatabase,
  discoverFoldersToScan,
  createScanJob,
  getNextBatch,
  markBatchProcessed,
  processFolderBatch,
  cleanupStaleJobs,
  getScanJobStatus,
} from "./helpers";
import { ScanLogger } from "./helpers/scan-log.helper";

export const scanServices = {
  post: async (
    rootPath: string,
    options: {
      maxDepth?: number;
      tmdbApiKey: string;
      mediaType?: "movie" | "tv";
      fileExtensions?: string[];
      libraryName?: string;
      rescan?: boolean;
      originalPath?: string; // Store original path for database if different from scanning path
    }
  ) => {
    const {
      maxDepth,
      tmdbApiKey,
      mediaType = "movie",
      fileExtensions,
      libraryName,
      rescan = false,
      originalPath,
    } = options;

    // Set reasonable default maxDepth based on media type if not provided
    // Movies: max 2 levels (/movies/Avengers.mkv or /movies/Avengers/Avengers.mkv)
    // TV Shows: max 4 levels (/tvshows/ShowName/Season 1/S1E1.mkv)
    const defaultMaxDepth = mediaType === "tv" ? 4 : 2;
    const effectiveMaxDepth = maxDepth ?? defaultMaxDepth;

    if (!tmdbApiKey) {
      throw new Error("TMDB API key is required");
    }

    // Use default extensions if none provided or if empty array
    const finalFileExtensions =
      fileExtensions && fileExtensions.length > 0
        ? fileExtensions
        : getDefaultVideoExtensions();

    // Use original path for library name and database storage, but scanPath for actual scanning
    const displayPath = originalPath || rootPath;
    const finalLibraryName = libraryName || `Library - ${displayPath}`;
    const librarySlug = finalLibraryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    logger.info(`📚 Creating/getting library: ${finalLibraryName}`);

    const library = await prisma.library.upsert({
      where: { slug: librarySlug },
      update: {
        name: finalLibraryName,
        libraryPath: displayPath, // Store the original/original path for display
        libraryType: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        isLibrary: true,
      },
      create: {
        name: finalLibraryName,
        slug: librarySlug,
        libraryPath: displayPath, // Store the original/original path for display
        libraryType: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        isLibrary: true,
      },
    });

    logger.info(`✓ Library ready: ${library.name} (ID: ${library.id})\n`);

    const rateLimiter = createRateLimiter();
    const metadataCache = new Map<string, TmdbMetadata>();
    const episodeMetadataCache = new Map<string, TmdbSeasonMetadata>();

    // Initialize scan logger
    const scanLogger = new ScanLogger(library.id, library.name);

    // Phase 1: Scan directory structure
    logger.info("📁 Phase 1: Scanning directory structure...");
    logger.info(`Looking for extensions: ${finalFileExtensions.join(", ")}`);
    logger.info(
      `Max depth: ${effectiveMaxDepth} (${mediaType === "tv" ? "TV show" : "movie"} mode)`
    );
    wsManager.sendScanProgress({
      phase: "scanning",
      progress: 0,
      current: 0,
      total: 0,
      message: "Starting directory scan...",
      libraryId: library.id,
    });

    const mediaEntries = await collectMediaEntries(rootPath, {
      maxDepth: effectiveMaxDepth,
      mediaType,
      fileExtensions: finalFileExtensions,
    });

    // Log all found files
    mediaEntries.forEach((entry) => {
      if (!entry.isDirectory) {
        scanLogger.logFileFound(entry);
      }
    });

    logger.info(`\n✓ Found ${mediaEntries.length} media items\n`);

    // Send scanning complete progress
    wsManager.sendScanProgress({
      phase: "scanning",
      progress: 25,
      current: mediaEntries.length,
      total: mediaEntries.length,
      message: `Found ${mediaEntries.length} media items`,
      libraryId: library.id,
    });

    // Early exit if no media items found
    if (mediaEntries.length === 0) {
      logger.info("⚠️  No media items found. Scan complete.\n");

      wsManager.sendScanComplete({
        libraryId: library.id,
        totalItems: 0,
        message: `Scan complete! No media items found in "${library.name}"`,
      });

      return {
        libraryId: library.id,
        libraryName: library.name,
        totalFiles: 0,
        totalSaved: 0,
        cacheStats: {
          metadataFromCache: 0,
          metadataFromTMDB: 0,
          totalMetadataFetched: 0,
        },
      };
    }

    // Phase 2: Fetch metadata from TMDB
    logger.info(
      "🌐 Phase 2: Fetching metadata from TMDB (rate-limited parallel)..."
    );
    wsManager.sendScanProgress({
      phase: "fetching-metadata",
      progress: 25,
      current: 0,
      total: mediaEntries.length,
      message: "Fetching metadata from TMDB...",
      libraryId: library.id,
    });

    // If rescan is false, check for existing metadata in database
    let existingMetadataMap = new Map<string, TmdbMetadata>();
    let existingImagesMap = new Map<
      string,
      { plainPosterUrl: string | null; logoUrl: string | null }
    >();
    if (!rescan) {
      logger.info("🔍 Checking for existing metadata in database...");
      const tmdbIdsToCheck = mediaEntries
        .filter((e) => e.extractedIds.tmdbId)
        .map((e) => e.extractedIds.tmdbId!);

      const existingData = await fetchExistingMetadata(
        tmdbIdsToCheck,
        library.id
      );
      existingMetadataMap = existingData.metadataMap;
      existingImagesMap = existingData.imagesMap;

      // Add existing metadata to cache
      existingMetadataMap.forEach((metadata, tmdbId) => {
        metadataCache.set(tmdbId, metadata);
      });

      logger.info(
        `Found ${existingMetadataMap.size} items with existing metadata`
      );
    }

    // Fetch metadata for all entries
    const metadataStats = await fetchMetadataForEntries(mediaEntries, {
      mediaType,
      tmdbApiKey,
      rateLimiter,
      metadataCache,
      existingMetadataMap,
      existingImagesMap,
      libraryId: library.id,
      scanLogger,
    });

    logger.info(
      `\n✓ Metadata fetching complete (${metadataStats.metadataFromCache} from cache, ${metadataStats.metadataFromTMDB} from TMDB)\n`
    );

    // Phase 3: Fetch episode metadata for TV shows
    if (mediaType === "tv") {
      logger.info("📺 Phase 3: Fetching season metadata...");
      await fetchSeasonMetadata(mediaEntries, {
        tmdbApiKey,
        rateLimiter,
        episodeMetadataCache,
        libraryId: library.id,
      });
    }

    // Phase 4: Save to database
    logger.info("💾 Phase 4: Saving to database...");

    const mediaFilesToSave = mediaEntries.filter((e) => !e.isDirectory);
    let savedCount = 0;

    wsManager.sendScanProgress({
      phase: "saving",
      progress: 75,
      current: 0,
      total: mediaFilesToSave.length,
      message: "Saving to database...",
      libraryId: library.id,
    });

    for (const mediaEntry of mediaEntries) {
      // Only save files (not directories)
      if (!mediaEntry.isDirectory) {
        try {
          // Check if we have metadata before attempting to save
          if (!mediaEntry.metadata || !mediaEntry.extractedIds.tmdbId) {
            scanLogger.logSkipped(mediaEntry.path, "no metadata or TMDB ID");
            continue;
          }

          await saveMediaToDatabase(
            mediaEntry,
            mediaType,
            episodeMetadataCache,
            library.id,
            originalPath
          );
          savedCount++;
          scanLogger.logSaveSuccess(
            mediaEntry.path,
            mediaEntry.metadata?.title ||
              mediaEntry.metadata?.name ||
              mediaEntry.name
          );

          // Send progress update every 2 items or at 100%
          if (savedCount % 2 === 0 || savedCount === mediaFilesToSave.length) {
            const progress =
              75 + Math.floor((savedCount / mediaFilesToSave.length) * 25);
            wsManager.sendScanProgress({
              phase: "saving",
              progress,
              current: savedCount,
              total: mediaFilesToSave.length,
              message: `Saving to database: ${savedCount}/${mediaFilesToSave.length}`,
              libraryId: library.id,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Failed to save ${mediaEntry.name}: ${errorMessage}`);
          scanLogger.logSaveFailure(mediaEntry.path, errorMessage);
        }
      }
    }

    logger.info("\n✅ Scan complete!\n");

    // Save scan log
    await scanLogger.saveLog();

    // Send completion message
    wsManager.sendScanComplete({
      libraryId: library.id,
      totalItems: savedCount,
      message: `Scan complete! Saved ${savedCount} items to library "${library.name}"`,
    });

    return {
      libraryId: library.id,
      libraryName: library.name,
      totalFiles: mediaEntries.length,
      totalSaved: savedCount,
      cacheStats: {
        metadataFromCache: metadataStats.metadataFromCache,
        metadataFromTMDB: metadataStats.metadataFromTMDB,
        totalMetadataFetched: metadataStats.totalFetched,
      },
      logFilePath: scanLogger.getLogFilePath(),
    };
  },

  /**
   * Batch scanning service - processes large libraries in manageable batches
   * Ideal for remote/slow storage (FTP, SMB, etc.)
   */
  postBatched: async (
    rootPath: string,
    options: {
      maxDepth?: number;
      tmdbApiKey: string;
      mediaType?: "movie" | "tv";
      fileExtensions?: string[];
      libraryName?: string;
      rescan?: boolean;
      originalPath?: string;
    }
  ) => {
    const {
      maxDepth,
      tmdbApiKey,
      mediaType = "movie",
      fileExtensions,
      libraryName,
      rescan = false,
      originalPath,
    } = options;

    // Set reasonable default maxDepth based on media type if not provided
    const defaultMaxDepth = mediaType === "tv" ? 4 : 2;
    const effectiveMaxDepth = maxDepth ?? defaultMaxDepth;

    if (!tmdbApiKey) {
      throw new Error("TMDB API key is required");
    }

    // Use default extensions if none provided or if empty array
    const finalFileExtensions =
      fileExtensions && fileExtensions.length > 0
        ? fileExtensions
        : getDefaultVideoExtensions();

    // Use original path for library name and database storage
    const displayPath = originalPath || rootPath;
    const finalLibraryName = libraryName || `Library - ${displayPath}`;
    const librarySlug = finalLibraryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    logger.info(`📚 Creating/getting library: ${finalLibraryName}`);

    const library = await prisma.library.upsert({
      where: { slug: librarySlug },
      update: {
        name: finalLibraryName,
        libraryPath: displayPath,
        libraryType: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        isLibrary: true,
      },
      create: {
        name: finalLibraryName,
        slug: librarySlug,
        libraryPath: displayPath,
        libraryType: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        isLibrary: true,
      },
    });

    logger.info(`✓ Library ready: ${library.name} (ID: ${library.id})\n`);

    // Step 1: Discover folders to scan
    logger.info("🔍 Discovering folders to scan...");
    wsManager.sendScanProgress({
      phase: "discovering",
      progress: 0,
      current: 0,
      total: 0,
      message: "Discovering folders...",
      libraryId: library.id,
    });

    const folders = await discoverFoldersToScan(rootPath, mediaType);

    if (folders.length === 0) {
      logger.info("⚠️  No folders found to scan.");
      wsManager.sendScanComplete({
        libraryId: library.id,
        totalItems: 0,
        message: `No ${mediaType === "tv" ? "shows" : "movies"} found in "${library.name}"`,
      });

      return {
        libraryId: library.id,
        libraryName: library.name,
        totalFolders: 0,
        foldersProcessed: 0,
        foldersFailed: 0,
        totalItemsSaved: 0,
        scanJobId: null,
      };
    }

    // Step 2: Create scan job
    const scanJobId = await createScanJob(
      library.id,
      displayPath,
      mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
      folders
    );

    wsManager.sendScanProgress({
      phase: "batching",
      progress: 5,
      current: 0,
      total: folders.length,
      message: `Starting batch scan (${folders.length} folders)`,
      libraryId: library.id,
      scanJobId,
    });

    // Step 3: Process batches
    let totalSaved = 0;
    let batchNumber = 0;

    while (true) {
      const batch = await getNextBatch(scanJobId);

      if (!batch || batch.length === 0) {
        break;
      }

      batchNumber++;
      logger.info(
        `\n📦 Processing batch ${batchNumber} (${batch.length} folders)`
      );

      const result = await processFolderBatch(scanJobId, batch, {
        rootPath,
        mediaType,
        tmdbApiKey,
        libraryId: library.id,
        maxDepth: effectiveMaxDepth,
        fileExtensions: finalFileExtensions,
        rescan,
        originalPath,
      });

      totalSaved += result.totalSaved;

      // Mark batch as processed
      await markBatchProcessed(
        scanJobId,
        result.processedFolders,
        result.failedFolders,
        result.totalSaved
      );

      // Send batch completion update
      const scanJob = await prisma.scanJob.findUnique({
        where: { id: scanJobId },
      });

      if (scanJob) {
        const progressPercent = Math.floor(
          ((scanJob.processedCount + scanJob.failedCount) /
            scanJob.totalFolders) *
            100
        );

        wsManager.sendScanProgress({
          phase: "batching",
          progress: progressPercent,
          current: scanJob.processedCount + scanJob.failedCount,
          total: scanJob.totalFolders,
          message: `Batch ${scanJob.currentBatch}/${scanJob.totalBatches} complete: ${result.processedFolders.length} success, ${result.failedFolders.length} failed (${scanJob.processedCount + scanJob.failedCount}/${scanJob.totalFolders} folders)`,
          libraryId: library.id,
          scanJobId,
        });
      }
    }

    logger.info("\n✅ Batch scan complete!\n");

    // Send final completion message
    wsManager.sendScanComplete({
      libraryId: library.id,
      totalItems: totalSaved,
      message: `Batch scan complete! Saved ${totalSaved} items to library "${library.name}"`,
      scanJobId,
    });

    // Get final scan job stats
    const finalScanJob = await prisma.scanJob.findUnique({
      where: { id: scanJobId },
    });

    return {
      libraryId: library.id,
      libraryName: library.name,
      totalFolders: folders.length,
      foldersProcessed: finalScanJob?.processedCount || 0,
      foldersFailed: finalScanJob?.failedCount || 0,
      totalItemsSaved: finalScanJob?.totalItemsSaved || 0,
      scanJobId,
    };
  },

  /**
   * Resume a failed or paused scan job
   */
  resumeScanJob: async (scanJobId: string, tmdbApiKey: string) => {
    // Get the scan job
    const scanJob = await prisma.scanJob.findUnique({
      where: { id: scanJobId },
      include: { library: true },
    });

    if (!scanJob) {
      throw new Error(`Scan job ${scanJobId} not found`);
    }

    if (scanJob.status === "COMPLETED") {
      throw new Error("Cannot resume a completed scan job");
    }

    if (scanJob.status === "IN_PROGRESS") {
      throw new Error("Scan job is already in progress");
    }

    logger.info(
      `🔄 Resuming scan job ${scanJobId} for library: ${scanJob.library.name}`
    );

    // Update status to in progress
    await prisma.scanJob.update({
      where: { id: scanJobId },
      data: {
        status: "IN_PROGRESS",
        startedAt: scanJob.startedAt || new Date(),
      },
    });

    const mediaType = scanJob.mediaType === MediaType.TV_SHOW ? "tv" : "movie";
    const rootPath = scanJob.scanPath;

    // Get default file extensions
    const finalFileExtensions = getDefaultVideoExtensions();

    // Set maxDepth based on media type
    const effectiveMaxDepth = mediaType === "tv" ? 4 : 2;

    // Process remaining batches
    let totalSaved = 0;
    let batchNumber = 0;

    wsManager.sendScanProgress({
      phase: "batching",
      progress: Math.floor(
        ((scanJob.processedCount + scanJob.failedCount) /
          scanJob.totalFolders) *
          100
      ),
      current: scanJob.processedCount + scanJob.failedCount,
      total: scanJob.totalFolders,
      message: `Resuming scan job...`,
      libraryId: scanJob.libraryId,
      scanJobId,
    });

    while (true) {
      const batch = await getNextBatch(scanJobId);

      if (!batch || batch.length === 0) {
        break;
      }

      batchNumber++;
      logger.info(
        `\n📦 Processing batch ${batchNumber} (${batch.length} folders)`
      );

      const result = await processFolderBatch(scanJobId, batch, {
        rootPath,
        mediaType,
        tmdbApiKey,
        libraryId: scanJob.libraryId,
        maxDepth: effectiveMaxDepth,
        fileExtensions: finalFileExtensions,
        rescan: false,
      });

      totalSaved += result.totalSaved;

      // Mark batch as processed
      await markBatchProcessed(
        scanJobId,
        result.processedFolders,
        result.failedFolders,
        result.totalSaved
      );

      // Send batch completion update
      const updatedScanJob = await prisma.scanJob.findUnique({
        where: { id: scanJobId },
      });

      if (updatedScanJob) {
        const progressPercent = Math.floor(
          ((updatedScanJob.processedCount + updatedScanJob.failedCount) /
            updatedScanJob.totalFolders) *
            100
        );

        wsManager.sendScanProgress({
          phase: "batching",
          progress: progressPercent,
          current: updatedScanJob.processedCount + updatedScanJob.failedCount,
          total: updatedScanJob.totalFolders,
          message: `Batch ${updatedScanJob.currentBatch}/${updatedScanJob.totalBatches} complete: ${result.processedFolders.length} success, ${result.failedFolders.length} failed (${updatedScanJob.processedCount + updatedScanJob.failedCount}/${updatedScanJob.totalFolders} folders)`,
          libraryId: scanJob.libraryId,
          scanJobId,
        });
      }
    }

    logger.info("\n✅ Resumed scan complete!\n");

    // Get final scan job stats
    const finalScanJob = await prisma.scanJob.findUnique({
      where: { id: scanJobId },
    });

    // Send final completion message
    wsManager.sendScanComplete({
      libraryId: scanJob.libraryId,
      totalItems: finalScanJob?.totalItemsSaved || 0,
      message: `Resumed scan complete! Total: ${finalScanJob?.totalItemsSaved || 0} items in library "${scanJob.library.name}"`,
      scanJobId,
    });

    return {
      libraryId: scanJob.libraryId,
      libraryName: scanJob.library.name,
      totalFolders: finalScanJob?.totalFolders || 0,
      foldersProcessed: finalScanJob?.processedCount || 0,
      foldersFailed: finalScanJob?.failedCount || 0,
      totalItemsSaved: finalScanJob?.totalItemsSaved || 0,
      scanJobId,
    };
  },

  /**
   * Get scan job status
   */
  getJobStatus: async (scanJobId: string) => {
    return getScanJobStatus(scanJobId);
  },

  /**
   * Manually cleanup stale jobs
   */
  cleanupStaleJobs: async (staleTimeoutMs?: number) => {
    const cleanedCount = await cleanupStaleJobs(staleTimeoutMs);
    return {
      cleanedCount,
      message: `Cleaned up ${cleanedCount} stale scan job(s)`,
    };
  },
};
