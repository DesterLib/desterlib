/**
 * TMDB metadata fetching utilities
 * Handles fetching and caching metadata from TMDB API
 */

import { logger } from "@/lib/utils";
import { tmdbServices } from "@/lib/providers/tmdb/tmdb.services";
import { wsManager } from "@/lib/websocket";
import type { RateLimiter } from "./rate-limiter.helper";
import type {
  TmdbType,
  TmdbSeasonMetadata,
} from "@/lib/providers/tmdb/tmdb.types";
import type { MediaEntry, TmdbMetadata } from "../scan.types";
import { extractTmdbPath } from "./tmdb-image.helper";
import prisma from "@/lib/database/prisma";

/**
 * Fetch existing metadata from database for given TMDB IDs
 */
export async function fetchExistingMetadata(
  tmdbIds: string[],
  libraryId: string,
): Promise<Map<string, TmdbMetadata>> {
  const existingMetadataMap = new Map<string, TmdbMetadata>();

  if (tmdbIds.length === 0) {
    return existingMetadataMap;
  }

  const existingExternalIds = await prisma.externalId.findMany({
    where: {
      source: "TMDB",
      externalId: {
        in: tmdbIds,
      },
      media: {
        libraries: {
          some: {
            libraryId: libraryId,
          },
        },
      },
    },
    select: {
      externalId: true,
      media: {
        select: {
          id: true,
          title: true,
          description: true,
          posterUrl: true,
          backdropUrl: true,
          releaseDate: true,
          rating: true,
        },
      },
    },
  });

  // Convert to TMDB metadata format
  existingExternalIds.forEach((extId) => {
    const { media } = extId;
    const tmdbMetadata: TmdbMetadata = {
      id: parseInt(extId.externalId),
      title: media.title,
      name: media.title,
      overview: media.description || undefined,
      poster_path: extractTmdbPath(media.posterUrl) || undefined,
      backdrop_path: extractTmdbPath(media.backdropUrl) || undefined,
      release_date: media.releaseDate?.toISOString().split("T")[0],
      first_air_date: media.releaseDate?.toISOString().split("T")[0],
      vote_average: media.rating || undefined,
    };
    existingMetadataMap.set(extId.externalId, tmdbMetadata);
  });

  return existingMetadataMap;
}

/**
 * Fetch metadata for media entries from TMDB
 */
export async function fetchMetadataForEntries(
  mediaEntries: MediaEntry[],
  options: {
    mediaType: "movie" | "tv";
    tmdbApiKey: string;
    rateLimiter: RateLimiter;
    metadataCache: Map<string, TmdbMetadata>;
    existingMetadataMap: Map<string, TmdbMetadata>;
    libraryId: string;
  },
): Promise<{
  metadataFromCache: number;
  metadataFromTMDB: number;
  totalFetched: number;
}> {
  const {
    mediaType,
    tmdbApiKey,
    rateLimiter,
    metadataCache,
    existingMetadataMap,
    libraryId,
  } = options;

  const metadataFetchPromises: Promise<void>[] = [];
  let metadataFetched = 0;
  let metadataFromCache = 0;
  let metadataFromTMDB = 0;
  const totalMetadataToFetch = mediaEntries.filter(
    (e) => e.extractedIds.tmdbId || e.extractedIds.title,
  ).length;

  // For TV shows, optimize by grouping episodes of the same show
  // This prevents fetching the same show metadata multiple times
  if (mediaType === "tv") {
    // Group entries by TMDB ID and title
    const entriesByTmdbId = new Map<string, MediaEntry[]>();
    const entriesByTitle = new Map<string, MediaEntry[]>();

    for (const mediaEntry of mediaEntries) {
      if (mediaEntry.extractedIds.tmdbId) {
        if (!entriesByTmdbId.has(mediaEntry.extractedIds.tmdbId)) {
          entriesByTmdbId.set(mediaEntry.extractedIds.tmdbId, []);
        }
        entriesByTmdbId.get(mediaEntry.extractedIds.tmdbId)!.push(mediaEntry);
      } else if (mediaEntry.extractedIds.title) {
        const titleKey = `${mediaEntry.extractedIds.title}-${mediaEntry.extractedIds.year || ""}`;

        if (!entriesByTitle.has(titleKey)) {
          entriesByTitle.set(titleKey, []);
        }
        entriesByTitle.get(titleKey)!.push(mediaEntry);
      }
    }

    const uniqueShows = entriesByTmdbId.size + entriesByTitle.size;
    logger.info(`\n📊 TV Show Optimization Enabled:`);
    logger.info(
      `   Found ${mediaEntries.length} episode(s) from ${uniqueShows} unique show(s)`,
    );
    logger.info(
      `   Will fetch show metadata ${uniqueShows} time(s) instead of ${mediaEntries.length} time(s)\n`,
    );

    // Fetch metadata for unique shows, then apply to all their episodes
    for (const [tmdbId, episodes] of entriesByTmdbId.entries()) {
      const representativeEntry = episodes[0];

      const fetchPromise = rateLimiter.add(async () => {
        // Check cache first
        if (metadataCache.has(tmdbId)) {
          const cachedMetadata = metadataCache.get(tmdbId)!;
          // Apply cached metadata to all episodes of this show
          episodes.forEach((ep) => {
            ep.metadata = cachedMetadata;
          });
          metadataFetched += episodes.length;

          if (existingMetadataMap.has(tmdbId)) {
            metadataFromCache += episodes.length;
            logger.debug(
              `⏭️  Using existing metadata for ${episodes.length} episode(s) of "${cachedMetadata.title || cachedMetadata.name}"`,
            );
          }
          return;
        }

        // Fetch from TMDB
        try {
          const metadata = await tmdbServices.get(tmdbId, "tv" as TmdbType, {
            apiKey: tmdbApiKey,
            extraParams: {
              append_to_response: "credits",
            },
          });

          if (metadata) {
            const typedMetadata = metadata as TmdbMetadata;
            metadataCache.set(tmdbId, typedMetadata);

            // Apply metadata to all episodes of this show
            episodes.forEach((ep) => {
              ep.metadata = typedMetadata;
            });
            metadataFetched += episodes.length;
            metadataFromTMDB++;

            logger.info(
              `✓ Fetched show metadata: "${typedMetadata.title || typedMetadata.name}" (applied to ${episodes.length} episode(s))`,
            );
          }
        } catch (error) {
          logger.error(
            `✗ Failed to fetch TMDB ID ${tmdbId}: ${error instanceof Error ? error.message : error}`,
          );
          metadataFetched += episodes.length;
        }
      });
      metadataFetchPromises.push(fetchPromise);
    }

    // Handle shows identified by title
    for (const [titleKey, episodes] of entriesByTitle.entries()) {
      const representativeEntry = episodes[0];
      if (!representativeEntry?.extractedIds) continue;
      const { extractedIds } = representativeEntry;

      const searchPromise = rateLimiter.add(async () => {
        try {
          const foundId = await tmdbServices.search(extractedIds.title!, "tv", {
            apiKey: tmdbApiKey,
            year: extractedIds.year,
          });

          if (foundId) {
            logger.info(
              `✓ Search found TMDB ID ${foundId} for: "${extractedIds.title}"`,
            );

            // Update all episodes with the found TMDB ID
            episodes.forEach((ep) => {
              ep.extractedIds.tmdbId = foundId;
            });

            // Check cache
            if (metadataCache.has(foundId)) {
              const cachedMetadata = metadataCache.get(foundId)!;
              episodes.forEach((ep) => {
                ep.metadata = cachedMetadata;
              });
              metadataFetched += episodes.length;
            } else {
              // Fetch metadata
              const metadata = await tmdbServices.get(
                foundId,
                "tv" as TmdbType,
                {
                  apiKey: tmdbApiKey,
                  extraParams: {
                    append_to_response: "credits",
                  },
                },
              );

              if (metadata) {
                const typedMetadata = metadata as TmdbMetadata;
                metadataCache.set(foundId, typedMetadata);
                episodes.forEach((ep) => {
                  ep.metadata = typedMetadata;
                });
                metadataFetched += episodes.length;
                metadataFromTMDB++;

                logger.info(
                  `✓ Fetched show metadata: "${typedMetadata.title || typedMetadata.name}" (applied to ${episodes.length} episode(s))`,
                );
              }
            }
          } else {
            logger.warn(`✗ No results found for: "${extractedIds.title}"`);
            metadataFetched += episodes.length;
          }
        } catch (error) {
          logger.error(
            `✗ Failed to search for "${extractedIds.title}": ${error instanceof Error ? error.message : error}`,
          );
          metadataFetched += episodes.length;
        }
      });
      metadataFetchPromises.push(searchPromise);
    }
  } else {
    // For movies, process each entry individually (they're all unique)
    for (const mediaEntry of mediaEntries) {
      const { extractedIds } = mediaEntry;

      // Fetch metadata if TMDB ID exists
      if (extractedIds.tmdbId) {
        const fetchPromise = rateLimiter.add(async () => {
          // Check cache first
          if (metadataCache.has(extractedIds.tmdbId!)) {
            mediaEntry.metadata = metadataCache.get(extractedIds.tmdbId!)!;
            metadataFetched++;

            // Log if this came from database
            if (existingMetadataMap.has(extractedIds.tmdbId!)) {
              metadataFromCache++;
              logger.debug(
                `⏭️  Using existing metadata for ${mediaEntry.name} (use rescan=true to re-fetch)`,
              );
            }
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
              },
            );
            if (metadata) {
              const typedMetadata = metadata as TmdbMetadata;

              // Debug: Log genres from TMDB
              const genres = (metadata as any).genres;
              if (genres && genres.length > 0) {
                logger.debug(
                  `TMDB returned ${genres.length} genres for "${typedMetadata.title || typedMetadata.name}": ${genres.map((g: any) => g.name).join(", ")}`,
                );
              } else {
                logger.warn(
                  `TMDB returned NO genres for "${typedMetadata.title || typedMetadata.name}"`,
                );
              }

              metadataCache.set(extractedIds.tmdbId!, typedMetadata);
              mediaEntry.metadata = typedMetadata;
              metadataFetched++;
              metadataFromTMDB++;

              // Send progress update every 5 items or at 100%
              if (
                metadataFetched % 5 === 0 ||
                metadataFetched === totalMetadataToFetch
              ) {
                const progress =
                  25 +
                  Math.floor((metadataFetched / totalMetadataToFetch) * 25);
                wsManager.sendScanProgress({
                  phase: "fetching-metadata",
                  progress,
                  current: metadataFetched,
                  total: totalMetadataToFetch,
                  message: `Fetching metadata: ${metadataFetched}/${totalMetadataToFetch}`,
                  libraryId: libraryId,
                });
              }

              logger.info(
                `✓ Fetched: ${typedMetadata.title || typedMetadata.name}`,
              );
            }
          } catch (metadataError) {
            logger.error(
              `✗ Failed to fetch TMDB ID ${extractedIds.tmdbId} (${mediaEntry.name}): ${metadataError instanceof Error ? metadataError.message : metadataError}`,
            );
            metadataFetched++;
          }
        });
        metadataFetchPromises.push(fetchPromise);
      }
      // Try to search by title if no TMDB ID
      else if (extractedIds.title && !extractedIds.tmdbId) {
        const searchPromise = rateLimiter.add(async () => {
          try {
            const foundId = await tmdbServices.search(
              extractedIds.title!,
              mediaType,
              {
                apiKey: tmdbApiKey,
                year: extractedIds.year,
              },
            );
            if (foundId) {
              logger.info(
                `✓ Search found TMDB ID ${foundId} for: "${extractedIds.title}"`,
              );
              extractedIds.tmdbId = foundId;

              // Check cache before fetching
              if (metadataCache.has(foundId)) {
                mediaEntry.metadata = metadataCache.get(foundId)!;
                metadataFetched++;
              } else {
                const metadata = await tmdbServices.get(
                  foundId,
                  mediaType as TmdbType,
                  {
                    apiKey: tmdbApiKey,
                    extraParams: {
                      append_to_response: "credits",
                    },
                  },
                );
                if (metadata) {
                  const typedMetadata = metadata as TmdbMetadata;

                  // Debug: Log genres from TMDB
                  const genres = (metadata as any).genres;
                  if (genres && genres.length > 0) {
                    logger.debug(
                      `TMDB search returned ${genres.length} genres for "${typedMetadata.title || typedMetadata.name}": ${genres.map((g: any) => g.name).join(", ")}`,
                    );
                  } else {
                    logger.warn(
                      `TMDB search returned NO genres for "${typedMetadata.title || typedMetadata.name}"`,
                    );
                  }

                  metadataCache.set(foundId, typedMetadata);
                  mediaEntry.metadata = typedMetadata;
                  metadataFetched++;
                  metadataFromTMDB++;

                  // Send progress update
                  if (
                    metadataFetched % 5 === 0 ||
                    metadataFetched === totalMetadataToFetch
                  ) {
                    const progress =
                      25 +
                      Math.floor((metadataFetched / totalMetadataToFetch) * 25);
                    wsManager.sendScanProgress({
                      phase: "fetching-metadata",
                      progress,
                      current: metadataFetched,
                      total: totalMetadataToFetch,
                      message: `Fetching metadata: ${metadataFetched}/${totalMetadataToFetch}`,
                      libraryId: libraryId,
                    });
                  }

                  logger.info(
                    `✓ Fetched: ${typedMetadata.title || typedMetadata.name}`,
                  );
                }
              }
            } else {
              logger.warn(`✗ No results found for: "${extractedIds.title}"`);
              metadataFetched++;
            }
          } catch (searchError) {
            logger.error(
              `✗ Failed to search for "${extractedIds.title}": ${searchError instanceof Error ? searchError.message : searchError}`,
            );
            metadataFetched++;
          }
        });
        metadataFetchPromises.push(searchPromise);
      }
    }
  }

  // Wait for all metadata fetches to complete
  await Promise.allSettled(metadataFetchPromises);

  return {
    metadataFromCache,
    metadataFromTMDB,
    totalFetched: metadataFetched,
  };
}

/**
 * Fetch season metadata for TV show episodes
 */
export async function fetchSeasonMetadata(
  mediaEntries: MediaEntry[],
  options: {
    tmdbApiKey: string;
    rateLimiter: RateLimiter;
    episodeMetadataCache: Map<string, TmdbSeasonMetadata>;
    libraryId: string;
  },
): Promise<void> {
  const { tmdbApiKey, rateLimiter, episodeMetadataCache, libraryId } = options;

  // Collect unique TV show + season combinations to fetch
  const seasonsToFetch = new Set<string>();
  for (const mediaEntry of mediaEntries) {
    if (
      !mediaEntry.isDirectory &&
      mediaEntry.extractedIds.tmdbId &&
      mediaEntry.extractedIds.season
    ) {
      const seasonKey = `${mediaEntry.extractedIds.tmdbId}-S${mediaEntry.extractedIds.season}`;
      if (!episodeMetadataCache.has(seasonKey)) {
        seasonsToFetch.add(seasonKey);
      }
    }
  }

  const uniqueSeasons = Array.from(seasonsToFetch);

  if (uniqueSeasons.length === 0) {
    return;
  }

  wsManager.sendScanProgress({
    phase: "fetching-episodes",
    progress: 50,
    current: 0,
    total: uniqueSeasons.length,
    message: `Fetching season metadata (${uniqueSeasons.length} seasons)...`,
    libraryId: libraryId,
  });

  const episodeFetchPromises: Promise<void>[] = [];
  let episodesFetched = 0;

  for (const seasonKey of uniqueSeasons) {
    const [tvIdStr, seasonInfoStr] = seasonKey.split("-S");
    if (!tvIdStr || !seasonInfoStr) continue;

    const tvId = tvIdStr;
    const seasonNumber = parseInt(seasonInfoStr, 10);

    const fetchPromise = rateLimiter.add(async () => {
      try {
        const seasonMetadata = await tmdbServices.getSeason(
          tvId,
          seasonNumber,
          { apiKey: tmdbApiKey },
        );

        if (seasonMetadata) {
          episodeMetadataCache.set(seasonKey, seasonMetadata);
          episodesFetched++;

          // Send progress update every 3 items or at 100%
          if (
            episodesFetched % 3 === 0 ||
            episodesFetched === uniqueSeasons.length
          ) {
            const progress =
              50 + Math.floor((episodesFetched / uniqueSeasons.length) * 25);
            wsManager.sendScanProgress({
              phase: "fetching-episodes",
              progress,
              current: episodesFetched,
              total: uniqueSeasons.length,
              message: `Fetching seasons: ${episodesFetched}/${uniqueSeasons.length}`,
              libraryId: libraryId,
            });
          }

          logger.info(
            `✓ Fetched season: S${seasonNumber} (${seasonMetadata.episodes?.length || 0} episodes)`,
          );
        }
      } catch (error) {
        logger.warn(
          `Could not fetch season S${seasonNumber}: ${error instanceof Error ? error.message : error}`,
        );
        episodesFetched++;
      }
    });
    episodeFetchPromises.push(fetchPromise);
  }

  await Promise.allSettled(episodeFetchPromises);
  logger.info("\n✓ Season metadata fetching complete\n");
}
