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
} from "./helpers";

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
      maxDepth = Infinity,
      tmdbApiKey,
      mediaType = "movie",
      fileExtensions = getDefaultVideoExtensions(),
      libraryName,
      rescan = false,
      originalPath,
    } = options;

    if (!tmdbApiKey) {
      throw new Error("TMDB API key is required");
    }

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

    // Phase 1: Scan directory structure
    logger.info("📁 Phase 1: Scanning directory structure...");
    wsManager.sendScanProgress({
      phase: "scanning",
      progress: 0,
      current: 0,
      total: 0,
      message: "Starting directory scan...",
      libraryId: library.id,
    });

    const mediaEntries = await collectMediaEntries(rootPath, {
      maxDepth,
      fileExtensions,
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

    // Phase 2: Fetch metadata from TMDB
    logger.info("🌐 Phase 2: Fetching metadata from TMDB (rate-limited parallel)...");
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
    if (!rescan) {
      logger.info("🔍 Checking for existing metadata in database...");
      const tmdbIdsToCheck = mediaEntries
        .filter((e) => e.extractedIds.tmdbId)
        .map((e) => e.extractedIds.tmdbId!);

      existingMetadataMap = await fetchExistingMetadata(tmdbIdsToCheck, library.id);
      
      // Add existing metadata to cache
      existingMetadataMap.forEach((metadata, tmdbId) => {
        metadataCache.set(tmdbId, metadata);
      });

      logger.info(`Found ${existingMetadataMap.size} items with existing metadata`);
    }

    // Fetch metadata for all entries
    const metadataStats = await fetchMetadataForEntries(mediaEntries, {
      mediaType,
      tmdbApiKey,
      rateLimiter,
      metadataCache,
      existingMetadataMap,
      libraryId: library.id,
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
          await saveMediaToDatabase(
            mediaEntry,
            mediaType,
            tmdbApiKey,
            episodeMetadataCache,
            library.id,
            originalPath
          );
          savedCount++;

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
          logger.error(
            `Failed to save ${mediaEntry.name}: ${error instanceof Error ? error.message : error}`
          );
          savedCount++;
        }
      }
    }

    logger.info("\n✅ Scan complete!\n");

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
    };
  },
};
