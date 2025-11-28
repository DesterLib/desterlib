/**
 * Database Repository
 *
 * Handles database operations for scan domain
 */

import prisma from "@/lib/database/prisma";
import { MediaType } from "@/lib/database";
import type { MediaEntry } from "../scan.types";
import { saveMediaToDatabase } from "../helpers/database.helper";
import { logger } from "@/lib/utils";

export interface EnsureLibraryOptions {
  name: string;
  path: string;
  mediaType: "movie" | "tv";
}

class DatabaseRepository {
  async ensureLibrary(options: EnsureLibraryOptions) {
    const { name, path, mediaType } = options;

    const librarySlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    logger.info(`📚 Creating/getting library: ${name}`);

    const library = await prisma.library.upsert({
      where: { slug: librarySlug },
      update: {
        name: name,
        libraryPath: path,
        libraryType: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        isLibrary: true,
      },
      create: {
        name: name,
        slug: librarySlug,
        libraryPath: path,
        libraryType: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        isLibrary: true,
      },
    });

    logger.info(`✓ Library ready: ${library.name} (ID: ${library.id})`);

    return library;
  }

  async saveMedia(
    mediaEntries: MediaEntry[],
    libraryId: string,
    mediaType: "movie" | "tv",
    providerName: string = "tmdb"
  ): Promise<number> {
    let savedCount = 0;

    for (const mediaEntry of mediaEntries) {
      if (
        !mediaEntry.isDirectory &&
        mediaEntry.metadata &&
        mediaEntry.extractedIds.tmdbId
      ) {
        try {
          await saveMediaToDatabase(
            mediaEntry,
            mediaType,
            new Map(), // episodeMetadataCache - TODO: fetch season metadata
            libraryId,
            undefined,
            providerName
          );
          savedCount++;
        } catch (error) {
          logger.error(
            `Failed to save ${mediaEntry.name}: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }

    return savedCount;
  }
}

export const scanDatabaseRepository = new DatabaseRepository();
