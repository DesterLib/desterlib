import { readdir, stat } from "fs/promises";
import { join } from "path";

import { extractIds, logger } from "@/lib/utils";
import { MediaEntry, TmdbMetadata } from "./scan.types";
import { tmdbServices } from "@/lib/providers/tmdb/tmdb.services";
import type {
  TmdbType,
  TmdbEpisodeMetadata,
} from "@/lib/providers/tmdb/tmdb.types";
import prisma from "@/lib/database/prisma";
import { MediaType } from "@/lib/database";

/**
 * Rate limiter for TMDB API calls
 * TMDB allows ~40 requests per 10 seconds
 */
function createRateLimiter() {
  const queue: Array<() => Promise<void>> = [];
  let processing = false;
  let requestTimestamps: number[] = [];
  const maxRequestsPer10Sec = 38; // Slightly under limit for safety
  const concurrency = 10; // Process 10 requests in parallel

  async function process() {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
      // Clean up old timestamps (older than 10 seconds)
      const now = Date.now();
      requestTimestamps = requestTimestamps.filter(
        (timestamp) => now - timestamp < 10000
      );

      // Calculate how many requests we can make right now
      const availableSlots = Math.max(
        0,
        maxRequestsPer10Sec - requestTimestamps.length
      );

      if (availableSlots === 0) {
        // Wait until the oldest timestamp expires
        const oldestTimestamp = requestTimestamps[0];
        if (oldestTimestamp) {
          const waitTime = 10000 - (now - oldestTimestamp) + 100; // +100ms buffer
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        continue;
      }

      // Take up to concurrency or available slots, whichever is smaller
      const batchSize = Math.min(concurrency, availableSlots, queue.length);
      const batch = queue.splice(0, batchSize);

      // Record timestamps for rate limiting
      for (let i = 0; i < batchSize; i++) {
        requestTimestamps.push(Date.now());
      }

      // Execute batch in parallel
      await Promise.allSettled(batch.map((fn) => fn()));
    }

    processing = false;
  }

  async function add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      process();
    });
  }

  return { add };
}

/**
 * Helper function to save media and file data to database
 */
async function saveMediaToDatabase(
  mediaEntry: MediaEntry,
  mediaType: "movie" | "tv",
  tmdbApiKey: string,
  episodeCache: Map<string, TmdbEpisodeMetadata>
): Promise<void> {
  try {
    // Only process if we have metadata and a TMDB ID
    if (!mediaEntry.metadata || !mediaEntry.extractedIds.tmdbId) {
      logger.debug(`Skipping ${mediaEntry.path} - no metadata or TMDB ID`);
      return;
    }

    const metadata = mediaEntry.metadata;
    const tmdbId = mediaEntry.extractedIds.tmdbId.toString();

    // Type assertion for additional metadata fields
    type ExtendedMetadata = TmdbMetadata & {
      original_title?: string;
      original_name?: string;
      vote_count?: number;
      popularity?: number;
      status?: string;
      runtime?: number;
      episode_run_time?: number[];
      genres?: Array<{ id: number; name: string }>;
      credits?: {
        crew?: Array<{ id: number; name: string; job: string }>;
      };
    };
    const extendedMetadata = metadata as ExtendedMetadata;

    // Check if media already exists by looking up external ID
    const existingExternalId = await prisma.externalId.findUnique({
      where: {
        source_externalId: {
          source: "TMDB",
          externalId: tmdbId,
        },
      },
      include: {
        media: true,
      },
    });

    let media;

    if (existingExternalId) {
      // Update existing media
      media = await prisma.media.update({
        where: { id: existingExternalId.mediaId },
        data: {
          title: metadata.title || metadata.name || "Unknown",
          description: metadata.overview,
          posterUrl: metadata.poster_path
            ? `https://image.tmdb.org/t/p/original${metadata.poster_path}`
            : null,
          backdropUrl: metadata.backdrop_path
            ? `https://image.tmdb.org/t/p/original${metadata.backdrop_path}`
            : null,
          releaseDate: metadata.release_date
            ? new Date(metadata.release_date)
            : metadata.first_air_date
              ? new Date(metadata.first_air_date)
              : null,
          rating: metadata.vote_average,
        },
      });
    } else {
      // Create new media
      media = await prisma.media.create({
        data: {
          title: metadata.title || metadata.name || "Unknown",
          type: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
          description: metadata.overview,
          posterUrl: metadata.poster_path
            ? `https://image.tmdb.org/t/p/original${metadata.poster_path}`
            : null,
          backdropUrl: metadata.backdrop_path
            ? `https://image.tmdb.org/t/p/original${metadata.backdrop_path}`
            : null,
          releaseDate: metadata.release_date
            ? new Date(metadata.release_date)
            : metadata.first_air_date
              ? new Date(metadata.first_air_date)
              : null,
          rating: metadata.vote_average,
        },
      });

      // Create external ID for TMDB
      await prisma.externalId.create({
        data: {
          source: "TMDB",
          externalId: tmdbId,
          mediaId: media.id,
        },
      });
    }

    // Create/update IMDB external ID if exists
    if (mediaEntry.extractedIds.imdbId) {
      await prisma.externalId.upsert({
        where: {
          source_externalId: {
            source: "IMDB",
            externalId: mediaEntry.extractedIds.imdbId,
          },
        },
        update: {
          mediaId: media.id,
        },
        create: {
          source: "IMDB",
          externalId: mediaEntry.extractedIds.imdbId,
          mediaId: media.id,
        },
      });
    }

    // Create/update TVDB external ID if exists
    if (mediaEntry.extractedIds.tvdbId) {
      await prisma.externalId.upsert({
        where: {
          source_externalId: {
            source: "TVDB",
            externalId: mediaEntry.extractedIds.tvdbId.toString(),
          },
        },
        update: {
          mediaId: media.id,
        },
        create: {
          source: "TVDB",
          externalId: mediaEntry.extractedIds.tvdbId.toString(),
          mediaId: media.id,
        },
      });
    }

    // Create or update type-specific record (Movie or TVShow)
    if (mediaType === "movie") {
      await prisma.movie.upsert({
        where: { mediaId: media.id },
        update: {
          duration: extendedMetadata.runtime,
          filePath: mediaEntry.path,
          fileSize: BigInt(mediaEntry.size),
          fileModifiedAt: mediaEntry.modified,
        },
        create: {
          mediaId: media.id,
          duration: extendedMetadata.runtime,
          filePath: mediaEntry.path,
          fileSize: BigInt(mediaEntry.size),
          fileModifiedAt: mediaEntry.modified,
        },
      });

      // Handle director if exists in metadata
      const director = extendedMetadata.credits?.crew?.find(
        (c) => c.job === "Director"
      );
      if (director) {
        // Create or get person
        const person = await prisma.person.upsert({
          where: { id: director.id.toString() },
          update: { name: director.name },
          create: {
            id: director.id.toString(),
            name: director.name,
          },
        });

        // Link director to media
        await prisma.mediaPerson.upsert({
          where: {
            mediaId_personId_role: {
              mediaId: media.id,
              personId: person.id,
              role: "DIRECTOR",
            },
          },
          update: {},
          create: {
            mediaId: media.id,
            personId: person.id,
            role: "DIRECTOR",
          },
        });
      }
    } else {
      // TV Show
      const tvShow = await prisma.tVShow.upsert({
        where: { mediaId: media.id },
        update: {},
        create: {
          mediaId: media.id,
        },
      });

      // Handle seasons and episodes if we have that info
      if (mediaEntry.extractedIds.season) {
        const seasonNumber = mediaEntry.extractedIds.season;

        // Create or get the season
        const season = await prisma.season.upsert({
          where: {
            tvShowId_number: {
              tvShowId: tvShow.id,
              number: seasonNumber,
            },
          },
          update: {},
          create: {
            tvShowId: tvShow.id,
            number: seasonNumber,
          },
        });

        // If we have episode info, create the episode
        if (mediaEntry.extractedIds.episode) {
          const episodeNumber = mediaEntry.extractedIds.episode;
          const fileTitleExtracted = mediaEntry.extractedIds.title;

          // Fetch episode-specific metadata from TMDB if we have the info
          let episodeTitle = `Episode ${episodeNumber}`;
          let episodeDuration: number | null = null;
          let episodeAirDate: Date | null = null;

          if (tmdbApiKey && mediaEntry.extractedIds.tmdbId) {
            const episodeCacheKey = `${mediaEntry.extractedIds.tmdbId}-S${seasonNumber}E${episodeNumber}`;

            // Check episode cache first
            if (episodeCache.has(episodeCacheKey)) {
              const cachedEpisode = episodeCache.get(episodeCacheKey);
              if (cachedEpisode) {
                episodeTitle = cachedEpisode.name || episodeTitle;
                episodeDuration = cachedEpisode.runtime || null;
                episodeAirDate = cachedEpisode.air_date
                  ? new Date(cachedEpisode.air_date)
                  : null;
                logger.debug(
                  `✓ Using cached episode metadata for S${seasonNumber}E${episodeNumber}`
                );
              }
            } else {
              try {
                // Fetch specific episode data from TMDB
                const episodeMetadata = await tmdbServices.getEpisode(
                  mediaEntry.extractedIds.tmdbId,
                  seasonNumber,
                  episodeNumber,
                  { apiKey: tmdbApiKey }
                );

                if (episodeMetadata) {
                  episodeCache.set(episodeCacheKey, episodeMetadata);
                  episodeTitle = episodeMetadata.name || episodeTitle;
                  episodeDuration = episodeMetadata.runtime || null;
                  episodeAirDate = episodeMetadata.air_date
                    ? new Date(episodeMetadata.air_date)
                    : null;
                }
              } catch (error) {
                logger.warn(
                  `Could not fetch episode metadata for S${seasonNumber}E${episodeNumber}: ${error instanceof Error ? error.message : error}`
                );
              }
            }
          }

          await prisma.episode.upsert({
            where: {
              seasonId_number: {
                seasonId: season.id,
                number: episodeNumber,
              },
            },
            update: {
              title: episodeTitle,
              fileTitle: fileTitleExtracted || null,
              duration: episodeDuration,
              airDate: episodeAirDate,
              filePath: mediaEntry.path,
              fileSize: BigInt(mediaEntry.size),
              fileModifiedAt: mediaEntry.modified,
            },
            create: {
              seasonId: season.id,
              number: episodeNumber,
              title: episodeTitle,
              fileTitle: fileTitleExtracted || null,
              duration: episodeDuration,
              airDate: episodeAirDate,
              filePath: mediaEntry.path,
              fileSize: BigInt(mediaEntry.size),
              fileModifiedAt: mediaEntry.modified,
            },
          });

          logger.info(
            `✓ Saved ${media.title} - S${seasonNumber}E${episodeNumber}: ${episodeTitle}${fileTitleExtracted ? ` (file: ${fileTitleExtracted})` : ""}`
          );
        } else {
          logger.info(`✓ Saved ${media.title} - Season ${seasonNumber}`);
        }
      } else {
        logger.info(
          `✓ Saved ${media.title} (TV Show - no season/episode info)`
        );
      }
    }
  } catch (error) {
    logger.error(
      `Error saving media to database for ${mediaEntry.path}: ${error instanceof Error ? error.message : error}`
    );
    throw error;
  }
}

/**
 * Helper function to check if a file/folder should be skipped during scan
 */
function shouldSkipEntry(name: string, isDirectory: boolean): boolean {
  // Skip hidden files and folders (starting with .)
  if (name.startsWith(".")) {
    return true;
  }

  // Skip common system files
  const systemFiles = [
    "Thumbs.db",
    "desktop.ini",
    "@eaDir", // Synology
    "#recycle", // Synology
  ];
  if (systemFiles.includes(name)) {
    return true;
  }

  // For files (not directories), skip non-media files
  if (!isDirectory) {
    const lowerName = name.toLowerCase();

    // Skip sample files
    if (lowerName.includes("sample")) {
      return true;
    }

    // Skip subtitle and metadata files
    const skipExtensions = [
      ".srt",
      ".sub",
      ".idx",
      ".ssa",
      ".ass", // Subtitles
      ".nfo",
      ".txt",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif", // Metadata/images
      ".xml",
      ".json", // Metadata
    ];

    if (skipExtensions.some((ext) => lowerName.endsWith(ext))) {
      return true;
    }
  }

  return false;
}

export const scanServices = {
  post: async (
    rootPath: string,
    options: {
      maxDepth?: number;
      tmdbApiKey: string;
      mediaType?: "movie" | "tv";
      fileExtensions?: string[];
    }
  ) => {
    const {
      maxDepth = Infinity,
      tmdbApiKey,
      mediaType = "movie",
      fileExtensions = [".mkv", ".mp4", ".avi", ".mov", ".wmv", ".m4v"],
    } = options;

    if (!tmdbApiKey) {
      throw new Error("TMDB API key is required");
    }

    const mediaEntries: MediaEntry[] = [];
    const rateLimiter = createRateLimiter();

    // Cache for TMDB metadata to avoid duplicate API calls
    const metadataCache = new Map<string, TmdbMetadata>();
    const episodeMetadataCache = new Map<string, TmdbEpisodeMetadata>();

    // Phase 1: Collect all entries
    logger.info("📁 Phase 1: Scanning directory structure...");

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
    logger.info(`\n✓ Found ${mediaEntries.length} media items\n`);

    // Phase 2: Batch fetch all metadata with rate limiting
    logger.info(
      "🌐 Phase 2: Fetching metadata from TMDB (rate-limited parallel)..."
    );

    const metadataFetchPromises: Promise<void>[] = [];

    for (const mediaEntry of mediaEntries) {
      const { extractedIds } = mediaEntry;

      // Fetch metadata if TMDB ID exists
      if (extractedIds.tmdbId) {
        const fetchPromise = rateLimiter.add(async () => {
          // Check cache first
          if (metadataCache.has(extractedIds.tmdbId!)) {
            mediaEntry.metadata = metadataCache.get(extractedIds.tmdbId!)!;
            return;
          }

          // Fetch from TMDB if not cached
          try {
            const metadata = await tmdbServices.get(
              extractedIds.tmdbId!,
              mediaType as TmdbType,
              {
                apiKey: tmdbApiKey,
                extraParams: {
                  append_to_response: "credits",
                },
              }
            );
            if (metadata) {
              const typedMetadata = metadata as TmdbMetadata;
              metadataCache.set(extractedIds.tmdbId!, typedMetadata);
              mediaEntry.metadata = typedMetadata;
              logger.info(
                `✓ Fetched: ${typedMetadata.title || typedMetadata.name}`
              );
            }
          } catch (metadataError) {
            logger.error(
              `✗ Failed to fetch TMDB ID ${extractedIds.tmdbId} (${mediaEntry.name}): ${metadataError instanceof Error ? metadataError.message : metadataError}`
            );
          }
        });
        metadataFetchPromises.push(fetchPromise);
      }
      // Try to search by title if no TMDB ID but we have a title
      else if (extractedIds.title && !extractedIds.tmdbId) {
        const searchPromise = rateLimiter.add(async () => {
          try {
            const foundId = await tmdbServices.search(
              extractedIds.title!,
              mediaType,
              {
                apiKey: tmdbApiKey,
                year: extractedIds.year,
              }
            );
            if (foundId) {
              logger.info(
                `✓ Search found TMDB ID ${foundId} for: "${extractedIds.title}"`
              );
              extractedIds.tmdbId = foundId;

              // Check cache before fetching
              if (metadataCache.has(foundId)) {
                mediaEntry.metadata = metadataCache.get(foundId)!;
              } else {
                const metadata = await tmdbServices.get(
                  foundId,
                  mediaType as TmdbType,
                  {
                    apiKey: tmdbApiKey,
                    extraParams: {
                      append_to_response: "credits",
                    },
                  }
                );
                if (metadata) {
                  const typedMetadata = metadata as TmdbMetadata;
                  metadataCache.set(foundId, typedMetadata);
                  mediaEntry.metadata = typedMetadata;
                  logger.info(
                    `✓ Fetched: ${typedMetadata.title || typedMetadata.name}`
                  );
                }
              }
            } else {
              logger.warn(`✗ No results found for: "${extractedIds.title}"`);
            }
          } catch (searchError) {
            logger.error(
              `✗ Failed to search for "${extractedIds.title}": ${searchError instanceof Error ? searchError.message : searchError}`
            );
          }
        });
        metadataFetchPromises.push(searchPromise);
      }
    }

    // Wait for all metadata fetches to complete
    await Promise.allSettled(metadataFetchPromises);
    logger.info("\n✓ Metadata fetching complete\n");

    // Phase 3: Fetch episode metadata for TV shows (with rate limiting)
    logger.info("📺 Phase 3: Fetching episode metadata...");

    const episodeFetchPromises: Promise<void>[] = [];

    for (const mediaEntry of mediaEntries) {
      const { extractedIds, isDirectory } = mediaEntry;

      // Only fetch episode metadata for files (not directories) with season/episode info
      if (
        !isDirectory &&
        extractedIds.tmdbId &&
        extractedIds.season &&
        extractedIds.episode &&
        mediaType === "tv"
      ) {
        const episodeCacheKey = `${extractedIds.tmdbId}-S${extractedIds.season}E${extractedIds.episode}`;

        // Skip if already cached
        if (episodeMetadataCache.has(episodeCacheKey)) {
          continue;
        }

        const fetchPromise = rateLimiter.add(async () => {
          try {
            const episodeMetadata = await tmdbServices.getEpisode(
              extractedIds.tmdbId!,
              extractedIds.season!,
              extractedIds.episode!,
              { apiKey: tmdbApiKey }
            );

            if (episodeMetadata) {
              episodeMetadataCache.set(episodeCacheKey, episodeMetadata);
              logger.info(
                `✓ Fetched episode: S${extractedIds.season}E${extractedIds.episode} - ${episodeMetadata.name}`
              );
            }
          } catch (error) {
            logger.warn(
              `Could not fetch episode S${extractedIds.season}E${extractedIds.episode}: ${error instanceof Error ? error.message : error}`
            );
          }
        });
        episodeFetchPromises.push(fetchPromise);
      }
    }

    await Promise.allSettled(episodeFetchPromises);
    logger.info("\n✓ Episode metadata fetching complete\n");

    // Phase 4: Save to database
    logger.info("💾 Phase 4: Saving to database...");

    for (const mediaEntry of mediaEntries) {
      // Only save files (not directories)
      if (!mediaEntry.isDirectory) {
        try {
          await saveMediaToDatabase(
            mediaEntry,
            mediaType,
            tmdbApiKey,
            episodeMetadataCache
          );
        } catch (error) {
          logger.error(
            `Failed to save ${mediaEntry.name}: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    }

    logger.info("\n✅ Scan complete!\n");
    return mediaEntries;
  },
};
