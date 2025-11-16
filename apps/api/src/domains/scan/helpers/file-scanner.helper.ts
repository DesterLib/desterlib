/**
 * File system scanning utilities
 * Handles recursive directory traversal and file collection
 */

import { readdir, stat } from "fs/promises";
import { join } from "path";
import { logger, extractIds } from "@/lib/utils";
import { shouldSkipEntry } from "./file-filter.helper";
import { validateMediaPath, logValidationStats } from "./path-validator.helper";
import type { MediaEntry } from "../scan.types";

/**
 * Recursively collect media entries from a directory
 *
 * @param rootPath - Root directory to scan
 * @param options - Scanning options
 * @returns Array of found media entries
 */
export async function collectMediaEntries(
  rootPath: string,
  options: {
    maxDepth?: number;
    mediaType: "movie" | "tv";
    fileExtensions: string[];
    onProgress?: (count: number) => void;
  },
): Promise<MediaEntry[]> {
  const {
    maxDepth = Infinity,
    mediaType,
    fileExtensions,
    onProgress,
  } = options;
  const mediaEntries: MediaEntry[] = [];
  let totalScanned = 0;
  let totalSkipped = 0;
  let depthViolations = 0;
  let structureViolations = 0;
  const sampleFiles: string[] = [];
  const maxSamples = 10;

  // Track unique show folders for TV shows (for optimization)
  const tvShowFolders = new Map<string, Set<number>>(); // showFolder -> Set<seasons>

  logger.debug(
    `File scanner initialized with ${fileExtensions.length} extensions: ${fileExtensions.join(", ")}`,
  );
  logger.debug(`Media type: ${mediaType}, Max depth: ${maxDepth}`);

  async function collectEntries(
    currentPath: string,
    depth: number = 0,
  ): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      if (depth === 0 && entries.length === 0) {
        logger.warn(`Directory is empty: ${currentPath}`);
        return;
      }

      for (const entry of entries) {
        totalScanned++;

        // Collect sample file names for debugging (first few files only)
        if (sampleFiles.length < maxSamples && !entry.isDirectory()) {
          sampleFiles.push(entry.name);
        }

        // Skip system files and unwanted entries
        if (shouldSkipEntry(entry.name, entry.isDirectory())) {
          totalSkipped++;
          logger.debug(`Skipping filtered entry: ${entry.name}`);
          continue;
        }

        const fullPath = join(currentPath, entry.name);

        try {
          const stats = await stat(fullPath);

          // Extract IDs from the filename
          const extractedFromName = extractIds(entry.name);

          // For TV shows, try to extract from parent folders
          // Structure: "Show Name (2020)/Season 1/episode.mkv"
          const pathParts = currentPath.split("/");
          const parentFolderName = pathParts[pathParts.length - 1] || "";
          const grandparentFolderName = pathParts[pathParts.length - 2] || "";

          const extractedFromParent = extractIds(parentFolderName);
          const extractedFromGrandparent = extractIds(grandparentFolderName);

          // Determine if file has season/episode info (likely an episode file)
          const hasEpisodeInfo = !!(
            extractedFromName.season && extractedFromName.episode
          );

          // For episode files, prefer show info from grandparent folder (show folder)
          // For other files, use parent folder or filename
          const showInfo = hasEpisodeInfo
            ? extractedFromGrandparent
            : extractedFromParent;

          // Merge IDs, prioritizing: filename > grandparent (for episodes) > parent
          const extractedIds = {
            tmdbId: extractedFromName.tmdbId || showInfo.tmdbId,
            imdbId: extractedFromName.imdbId || showInfo.imdbId,
            tvdbId: extractedFromName.tvdbId || showInfo.tvdbId,
            year: extractedFromName.year || showInfo.year,
            // For title, use show folder name for episodes, filename for others
            title: hasEpisodeInfo
              ? showInfo.title || extractedFromName.title
              : extractedFromName.title,
            season: extractedFromName.season || extractedFromParent.season,
            episode: extractedFromName.episode,
          };

          // Check if it's a media file or folder with IDs
          const hasIds = !!(
            extractedIds.tmdbId ||
            extractedIds.imdbId ||
            extractedIds.tvdbId
          );
          const isMediaFile =
            !entry.isDirectory() &&
            fileExtensions.some((ext) =>
              entry.name.toLowerCase().endsWith(ext.toLowerCase()),
            );

          // Debug log for first few files to see why they're not matching
          if (!entry.isDirectory() && mediaEntries.length < 3) {
            logger.debug(
              `Checking file: ${entry.name}, hasIds: ${hasIds}, isMediaFile: ${isMediaFile}, extensions: ${fileExtensions.join(",")}`,
            );
          }

          if (hasIds || isMediaFile) {
            // Validate path structure based on media type
            const validation = validateMediaPath(
              rootPath,
              fullPath,
              mediaType,
              extractedIds,
            );

            if (!validation.valid) {
              totalSkipped++;

              // Track violation type for statistics
              if (validation.reason?.includes("too deeply nested")) {
                depthViolations++;
              } else {
                structureViolations++;
              }

              // Log first few violations at info level, rest at debug
              const logLevel =
                depthViolations + structureViolations <= 5 ? "info" : "debug";
              logger[logLevel](
                `⏭️  Skipping ${entry.name}: ${validation.reason}`,
              );

              // Skip this file
              continue;
            }

            // For TV shows, track show folders for metadata optimization
            if (
              mediaType === "tv" &&
              validation.metadata?.showFolder &&
              extractedIds.season
            ) {
              const showFolder = validation.metadata.showFolder;
              if (!tvShowFolders.has(showFolder)) {
                tvShowFolders.set(showFolder, new Set());
              }
              tvShowFolders.get(showFolder)!.add(extractedIds.season);
            }

            const mediaEntry: MediaEntry = {
              path: fullPath,
              name: entry.name,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
              extractedIds,
            };

            mediaEntries.push(mediaEntry);

            if (onProgress) {
              onProgress(mediaEntries.length);
            }

            const seasonEpInfo = extractedIds.season
              ? ` S${extractedIds.season}${extractedIds.episode ? `E${extractedIds.episode}` : ""}`
              : "";
            logger.debug(
              `Found: ${entry.name}${extractedIds.tmdbId ? ` [TMDB: ${extractedIds.tmdbId}${seasonEpInfo}]` : extractedIds.title ? ` [Title: ${extractedIds.title}]` : ""}`,
            );
          } else {
            // Log why item wasn't picked up (debug level)
            if (!entry.isDirectory() && !hasIds && !isMediaFile) {
              const ext = entry.name.substring(entry.name.lastIndexOf("."));
              logger.debug(
                `Not a media file: ${entry.name} (ext: ${ext}, expected: ${fileExtensions.join(", ")})`,
              );
            }
          }

          if (entry.isDirectory()) {
            await collectEntries(fullPath, depth + 1);
          }
        } catch (err) {
          logger.warn(
            `Cannot access: ${fullPath} - ${err instanceof Error ? err.message : err}`,
          );
        }
      }
    } catch (err) {
      logger.error(
        `Error scanning ${currentPath}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  await collectEntries(rootPath);

  const notRecognized = totalScanned - totalSkipped - mediaEntries.length;
  logger.info(
    `Scan statistics: Scanned ${totalScanned} items, Skipped ${totalSkipped} filtered items, Not recognized as media: ${notRecognized}, Found ${mediaEntries.length} media items`,
  );

  // Log validation statistics
  if (depthViolations > 0 || structureViolations > 0) {
    logValidationStats({
      total: totalScanned,
      valid: mediaEntries.length,
      depthViolations,
      structureViolations,
    });
  }

  // Log TV show folder information for optimization insights
  if (mediaType === "tv" && tvShowFolders.size > 0) {
    logger.info(`\n📺 TV Show Structure Detected:`);
    logger.info(`   Found ${tvShowFolders.size} unique show(s)`);
    let totalSeasons = 0;
    tvShowFolders.forEach((seasons, showFolder) => {
      totalSeasons += seasons.size;
      logger.debug(`   - ${showFolder}: ${seasons.size} season(s)`);
    });
    logger.info(`   Total seasons across all shows: ${totalSeasons}`);
    logger.info(
      `   This optimizes metadata fetching - show metadata will be fetched once per show\n`,
    );
  }

  if (mediaEntries.length === 0 && notRecognized > 0) {
    logger.warn(
      `⚠️  ${notRecognized} items were found but not recognized as media files. Enable debug logging to see details.`,
    );
    logger.warn(`   Expected video extensions: ${fileExtensions.join(", ")}`);

    if (sampleFiles.length > 0) {
      logger.warn(
        `   Sample files found in directory (first ${sampleFiles.length}):`,
      );
      sampleFiles.forEach((file) => logger.warn(`     - ${file}`));
    }
  }

  return mediaEntries;
}
