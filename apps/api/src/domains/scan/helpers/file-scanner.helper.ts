/**
 * File system scanning utilities
 * Handles recursive directory traversal and file collection
 */

import { readdir, stat } from "fs/promises";
import { join } from "path";
import { logger, extractIds } from "@/lib/utils";
import { shouldSkipEntry } from "./file-filter.helper";
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
    fileExtensions: string[];
    onProgress?: (count: number) => void;
  }
): Promise<MediaEntry[]> {
  const { maxDepth = Infinity, fileExtensions, onProgress } = options;
  const mediaEntries: MediaEntry[] = [];

  async function collectEntries(
    currentPath: string,
    depth: number = 0
  ): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip system files and unwanted entries
        if (shouldSkipEntry(entry.name, entry.isDirectory())) {
          continue;
        }

        const fullPath = join(currentPath, entry.name);

        try {
          const stats = await stat(fullPath);

          // Extract IDs from both the filename AND the full path
          const extractedFromName = extractIds(entry.name);
          const extractedFromPath = extractIds(fullPath);

          // Merge IDs, preferring the ones from the filename
          const extractedIds = {
            tmdbId: extractedFromName.tmdbId || extractedFromPath.tmdbId,
            imdbId: extractedFromName.imdbId || extractedFromPath.imdbId,
            tvdbId: extractedFromName.tvdbId || extractedFromPath.tvdbId,
            year: extractedFromName.year || extractedFromPath.year,
            title: extractedFromName.title,
            season: extractedFromName.season || extractedFromPath.season,
            episode: extractedFromName.episode || extractedFromPath.episode,
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
              entry.name.toLowerCase().endsWith(ext)
            );

          if (hasIds || isMediaFile) {
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
              `Found: ${entry.name}${extractedIds.tmdbId ? ` [TMDB: ${extractedIds.tmdbId}${seasonEpInfo}]` : extractedIds.title ? ` [Title: ${extractedIds.title}]` : ""}`
            );
          }

          if (entry.isDirectory()) {
            await collectEntries(fullPath, depth + 1);
          }
        } catch (err) {
          logger.warn(
            `Cannot access: ${fullPath} - ${err instanceof Error ? err.message : err}`
          );
        }
      }
    } catch (err) {
      logger.error(
        `Error scanning ${currentPath}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  await collectEntries(rootPath);
  return mediaEntries;
}

