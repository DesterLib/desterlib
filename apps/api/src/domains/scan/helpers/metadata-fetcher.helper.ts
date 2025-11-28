/**
 * Metadata fetching utilities
 * Handles fetching and caching metadata from metadata providers
 */

import { logger } from "@/lib/utils";
import { wsManager } from "@/lib/websocket";
import type { RateLimiter } from "./rate-limiter.helper";
import type { TmdbSeasonMetadata } from "@/lib/providers/tmdb/tmdb.types";
import type { MediaEntry, TmdbMetadata } from "../scan.types";
import type {
  IMetadataProvider,
  MediaMetadata,
  SeasonMetadata,
} from "@/lib/providers/metadata-provider.types";
import { extractTmdbPath, getTmdbImageUrl } from "./tmdb-image.helper";
import prisma from "@/lib/database/prisma";
import { ExternalIdSource } from "@/lib/database";

/**
 * Convert MediaMetadata to TmdbMetadata format for backward compatibility
 */
function convertToTmdbMetadata(
  metadata: MediaMetadata,
  providerId: string
): TmdbMetadata {
  // If provider is TMDB and has original data, use it
  if (providerId === "tmdb" && metadata._tmdb) {
    return metadata._tmdb as TmdbMetadata;
  }

  // Otherwise, convert from standard format
  return {
    id: parseInt(metadata.id) || 0,
    title: metadata.title,
    name: metadata.title,
    overview: metadata.description,
    poster_path: metadata.posterUrl
      ? extractTmdbPath(metadata.posterUrl) || undefined
      : undefined,
    backdrop_path: metadata.backdropUrl
      ? extractTmdbPath(metadata.backdropUrl) || undefined
      : undefined,
    release_date: metadata.releaseDate,
    first_air_date: metadata.releaseDate,
    vote_average: metadata.rating,
  };
}

/**
 * Fetch and extract plain poster and logo URLs from metadata provider
 */
async function fetchAdditionalImages(
  providerId: string,
  id: string,
  mediaType: "movie" | "tv",
  metadataProvider: IMetadataProvider,
  rateLimiter: RateLimiter
): Promise<{ plainPosterUrl: string | null; logoUrl: string | null }> {
  try {
    logger.info(
      `Fetching additional images for ${providerId} ID ${id} (${mediaType})`
    );

    // Only TMDB provider supports getImages method
    if (providerId !== "tmdb" || !metadataProvider.getImages) {
      return { plainPosterUrl: null, logoUrl: null };
    }

    // Helper to add timeout to a promise
    const withTimeout = <T>(
      promise: Promise<T>,
      timeoutMs: number,
      errorMessage: string
    ): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        }),
      ]);
    };

    // Fetch plain poster (no language) and English logo separately
    const timeoutMs = 15000; // 15 seconds timeout per request
    const [posterData, logoData] = await Promise.allSettled([
      withTimeout(
        metadataProvider.getImages(id, mediaType, {
          language: "en-US",
          includeImageLanguage: "null",
        }),
        timeoutMs,
        `Plain poster fetch timeout for ${providerId} ID ${id}`
      ),
      withTimeout(
        metadataProvider.getImages(id, mediaType, {
          language: "en-US",
          includeImageLanguage: "en,null",
        }),
        timeoutMs,
        `Logo fetch timeout for ${providerId} ID ${id}`
      ),
    ]);

    // Handle results from Promise.allSettled
    const posterResult =
      posterData.status === "fulfilled" ? posterData.value : null;
    const logoResult = logoData.status === "fulfilled" ? logoData.value : null;

    if (posterData.status === "rejected") {
      logger.warn(
        `Failed to fetch plain poster for ${providerId} ID ${id}: ${posterData.reason}`
      );
    }
    if (logoData.status === "rejected") {
      logger.warn(
        `Failed to fetch logo for ${providerId} ID ${id}: ${logoData.reason}`
      );
    }

    // Extract plain poster (first poster without language)
    let plainPosterUrl: string | null = null;
    if (posterResult?.posters && Array.isArray(posterResult.posters)) {
      const plainPoster = posterResult.posters.find(
        (poster: any) => poster.iso_639_1 === null
      );
      if (plainPoster?.file_path) {
        plainPosterUrl = getTmdbImageUrl(plainPoster.file_path);
      }
    }

    // Extract English logo
    let logoUrl: string | null = null;
    if (logoResult?.logos && Array.isArray(logoResult.logos)) {
      const englishLogo = logoResult.logos.find(
        (logo: any) => logo.iso_639_1 === "en"
      );
      if (englishLogo?.file_path) {
        logoUrl = getTmdbImageUrl(englishLogo.file_path);
      } else {
        const fallbackLogo = logoResult.logos.find(
          (logo: any) => logo.iso_639_1 === null
        );
        if (fallbackLogo?.file_path) {
          logoUrl = getTmdbImageUrl(fallbackLogo.file_path);
        }
      }
    }

    logger.info(
      `Completed fetching additional images for ${providerId} ID ${id}: plainPoster=${plainPosterUrl ? "found" : "none"}, logo=${logoUrl ? "found" : "none"}`
    );

    return { plainPosterUrl, logoUrl };
  } catch (error) {
    logger.warn(
      `Failed to fetch additional images for ${providerId} ID ${id}: ${error instanceof Error ? error.message : error}`
    );
    return { plainPosterUrl: null, logoUrl: null };
  }
}

/**
 * Fetch existing metadata from database for given provider IDs
 */
export async function fetchExistingMetadata(
  providerIds: string[],
  libraryId: string,
  providerName: string = "tmdb"
): Promise<{
  metadataMap: Map<string, TmdbMetadata>;
  imagesMap: Map<
    string,
    { plainPosterUrl: string | null; logoUrl: string | null }
  >;
}> {
  const existingMetadataMap = new Map<string, TmdbMetadata>();
  const existingImagesMap = new Map<
    string,
    { plainPosterUrl: string | null; logoUrl: string | null }
  >();

  if (providerIds.length === 0) {
    return { metadataMap: existingMetadataMap, imagesMap: existingImagesMap };
  }

  // Map provider name to ExternalIdSource enum
  const sourceMap: Record<string, ExternalIdSource> = {
    tmdb: ExternalIdSource.TMDB,
    tvdb: ExternalIdSource.TVDB,
    imdb: ExternalIdSource.IMDB,
  };
  const source = sourceMap[providerName.toLowerCase()] || ExternalIdSource.TMDB;

  logger.info(
    `Checking for existing metadata for ${providerIds.length} ${providerName.toUpperCase()} ID(s) in library ${libraryId}`
  );

  const existingExternalIds = await prisma.externalId.findMany({
    where: {
      source,
      externalId: {
        in: providerIds,
      },
      media: {
        libraries: {
          some: {
            libraryId: libraryId,
          },
        },
      },
    },
    include: {
      media: {
        select: {
          id: true,
          title: true,
          description: true,
          posterUrl: true,
          plainPosterUrl: true,
          backdropUrl: true,
          logoUrl: true,
          releaseDate: true,
          rating: true,
        },
      },
    },
  });

  logger.info(
    `Found ${existingExternalIds.length} existing metadata entries in database`
  );

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

    // Store additional images
    existingImagesMap.set(extId.externalId, {
      plainPosterUrl: media.plainPosterUrl,
      logoUrl: media.logoUrl,
    });
  });

  return { metadataMap: existingMetadataMap, imagesMap: existingImagesMap };
}

/**
 * Fetch metadata for media entries from metadata provider
 */
export async function fetchMetadataForEntries(
  mediaEntries: MediaEntry[],
  options: {
    mediaType: "movie" | "tv";
    metadataProvider: IMetadataProvider;
    rateLimiter: RateLimiter;
    metadataCache: Map<string, TmdbMetadata>;
    existingMetadataMap: Map<string, TmdbMetadata>;
    existingImagesMap: Map<
      string,
      { plainPosterUrl: string | null; logoUrl: string | null }
    >;
    libraryId: string;
    scanLogger?: import("./scan-log.helper").ScanLogger;
  }
): Promise<{
  metadataFromCache: number;
  metadataFromProvider: number;
  totalFetched: number;
}> {
  const {
    mediaType,
    metadataProvider,
    rateLimiter,
    metadataCache,
    existingMetadataMap,
    existingImagesMap,
    libraryId,
    scanLogger,
  } = options;

  const providerId = metadataProvider.name;

  logger.info(
    `fetchMetadataForEntries called with ${mediaEntries.length} entries (mediaType: ${mediaType}, provider: ${providerId})`
  );

  const metadataFetchPromises: Promise<void>[] = [];
  let metadataFetched = 0;
  let metadataFromCache = 0;
  let metadataFromProvider = 0;
  const totalMetadataToFetch = mediaEntries.filter(
    (e) => e.extractedIds.tmdbId || e.extractedIds.title
  ).length;

  logger.info(
    `Total metadata to fetch: ${totalMetadataToFetch} (entries with ${providerId.toUpperCase()} ID or title)`
  );

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
      `   Found ${mediaEntries.length} episode(s) from ${uniqueShows} unique show(s)`
    );
    logger.info(
      `   Will fetch show metadata ${uniqueShows} time(s) instead of ${mediaEntries.length} time(s)\n`
    );

    // Fetch metadata for unique shows, then apply to all their episodes
    for (const [tmdbId, episodes] of entriesByTmdbId.entries()) {
      const representativeEntry = episodes[0];

      const fetchPromise = rateLimiter.add(async () => {
        // Check cache first
        if (metadataCache.has(tmdbId)) {
          const cachedMetadata = metadataCache.get(tmdbId)!;
          // Get additional images if available
          const images = existingImagesMap.get(tmdbId) || {
            plainPosterUrl: null,
            logoUrl: null,
          };
          // Apply cached metadata and images to all episodes of this show
          episodes.forEach((ep) => {
            ep.metadata = cachedMetadata;
            ep.plainPosterUrl = images.plainPosterUrl;
            ep.logoUrl = images.logoUrl;
          });
          metadataFetched += episodes.length;

          if (existingMetadataMap.has(tmdbId)) {
            metadataFromCache += episodes.length;
            logger.debug(
              `⏭️  Using existing metadata for ${episodes.length} episode(s) of "${cachedMetadata.title || cachedMetadata.name}"`
            );
          }
          return;
        }

        // Fetch from metadata provider
        try {
          const mediaMetadata = await metadataProvider.getMetadata(
            tmdbId,
            "tv",
            {
              language: "en-US",
            }
          );

          if (mediaMetadata) {
            const typedMetadata = convertToTmdbMetadata(
              mediaMetadata,
              providerId
            );
            metadataCache.set(tmdbId, typedMetadata);

            // Fetch additional images (plain poster and logo)
            const { plainPosterUrl, logoUrl } = await fetchAdditionalImages(
              providerId,
              tmdbId,
              "tv",
              metadataProvider,
              rateLimiter
            );

            // Apply metadata and images to all episodes of this show
            episodes.forEach((ep) => {
              ep.metadata = typedMetadata;
              ep.plainPosterUrl = plainPosterUrl;
              ep.logoUrl = logoUrl;
            });
            metadataFetched += episodes.length;
            metadataFromProvider++;

            logger.info(
              `✓ Fetched show metadata: "${typedMetadata.title || typedMetadata.name}" (applied to ${episodes.length} episode(s))`
            );
          }
        } catch (error) {
          logger.error(
            `✗ Failed to fetch ${providerId.toUpperCase()} ID ${tmdbId}: ${error instanceof Error ? error.message : error}`
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
          const searchResult = await metadataProvider.search(
            extractedIds.title!,
            "tv",
            {
              year: extractedIds.year,
              language: "en-US",
            }
          );

          if (searchResult) {
            const foundId = searchResult.id;
            logger.info(
              `✓ Search found ${providerId.toUpperCase()} ID ${foundId} for: "${extractedIds.title}"`
            );

            // Update all episodes with the found provider ID
            episodes.forEach((ep) => {
              ep.extractedIds.tmdbId = foundId;
            });

            // Check cache
            if (metadataCache.has(foundId)) {
              const cachedMetadata = metadataCache.get(foundId)!;
              // Get additional images if available
              const images = existingImagesMap.get(foundId) || {
                plainPosterUrl: null,
                logoUrl: null,
              };
              episodes.forEach((ep) => {
                ep.metadata = cachedMetadata;
                ep.plainPosterUrl = images.plainPosterUrl;
                ep.logoUrl = images.logoUrl;
              });
              metadataFetched += episodes.length;
            } else {
              // Fetch metadata
              const mediaMetadata = await metadataProvider.getMetadata(
                foundId,
                "tv",
                {
                  language: "en-US",
                }
              );

              if (mediaMetadata) {
                const typedMetadata = convertToTmdbMetadata(
                  mediaMetadata,
                  providerId
                );
                metadataCache.set(foundId, typedMetadata);

                // Fetch additional images (plain poster and logo)
                const { plainPosterUrl, logoUrl } = await fetchAdditionalImages(
                  providerId,
                  foundId,
                  "tv",
                  metadataProvider,
                  rateLimiter
                );

                episodes.forEach((ep) => {
                  ep.metadata = typedMetadata;
                  ep.plainPosterUrl = plainPosterUrl;
                  ep.logoUrl = logoUrl;
                });
                metadataFetched += episodes.length;
                metadataFromProvider++;

                logger.info(
                  `✓ Fetched show metadata: "${typedMetadata.title || typedMetadata.name}" (applied to ${episodes.length} episode(s))`
                );
              }
            }
          } else {
            logger.warn(`✗ No results found for: "${extractedIds.title}"`);
            metadataFetched += episodes.length;
            // Log search failure for all episodes
            episodes.forEach((ep) => {
              scanLogger?.logSearchFailure(ep.path, extractedIds.title!);
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(
            `✗ Failed to search for "${extractedIds.title}": ${errorMessage}`
          );
          metadataFetched += episodes.length;
          // Log search failure for all episodes
          episodes.forEach((ep) => {
            scanLogger?.logSearchFailure(
              ep.path,
              extractedIds.title!,
              errorMessage
            );
          });
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
            // Get additional images if available
            const images = existingImagesMap.get(extractedIds.tmdbId!) || {
              plainPosterUrl: null,
              logoUrl: null,
            };
            mediaEntry.plainPosterUrl = images.plainPosterUrl;
            mediaEntry.logoUrl = images.logoUrl;
            metadataFetched++;

            // Log if this came from database
            if (existingMetadataMap.has(extractedIds.tmdbId!)) {
              metadataFromCache++;
              logger.debug(
                `⏭️  Using existing metadata for ${mediaEntry.name} (use rescan=true to re-fetch)`
              );
              scanLogger?.logMetadataFromCache(
                mediaEntry.path,
                extractedIds.tmdbId!,
                "database"
              );
            } else {
              scanLogger?.logMetadataFromCache(
                mediaEntry.path,
                extractedIds.tmdbId!,
                "cache"
              );
            }
            return;
          }

          // Fetch from metadata provider if not cached
          try {
            const mediaMetadata = await metadataProvider.getMetadata(
              extractedIds.tmdbId!,
              mediaType,
              {
                language: "en-US",
              }
            );
            if (mediaMetadata) {
              const typedMetadata = convertToTmdbMetadata(
                mediaMetadata,
                providerId
              );

              // Debug: Log genres from provider
              const genres = mediaMetadata.genres;
              if (genres && genres.length > 0) {
                logger.debug(
                  `${providerId.toUpperCase()} returned ${genres.length} genres for "${typedMetadata.title || typedMetadata.name}": ${genres.join(", ")}`
                );
              } else {
                logger.warn(
                  `${providerId.toUpperCase()} returned NO genres for "${typedMetadata.title || typedMetadata.name}"`
                );
              }

              // Fetch additional images (plain poster and logo)
              const { plainPosterUrl, logoUrl } = await fetchAdditionalImages(
                providerId,
                extractedIds.tmdbId!,
                mediaType,
                metadataProvider,
                rateLimiter
              );

              metadataCache.set(extractedIds.tmdbId!, typedMetadata);
              mediaEntry.metadata = typedMetadata;
              mediaEntry.plainPosterUrl = plainPosterUrl;
              mediaEntry.logoUrl = logoUrl;
              metadataFetched++;
              metadataFromProvider++;

              scanLogger?.logMetadataFromTMDB(
                mediaEntry.path,
                extractedIds.tmdbId!,
                typedMetadata.title || typedMetadata.name || ""
              );

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
                `✓ Fetched: ${typedMetadata.title || typedMetadata.name}`
              );
            }
          } catch (metadataError) {
            logger.error(
              `✗ Failed to fetch ${providerId.toUpperCase()} ID ${extractedIds.tmdbId} (${mediaEntry.name}): ${metadataError instanceof Error ? metadataError.message : metadataError}`
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
            const searchResult = await metadataProvider.search(
              extractedIds.title!,
              mediaType,
              {
                year: extractedIds.year,
                language: "en-US",
              }
            );
            if (searchResult) {
              const foundId = searchResult.id;
              logger.info(
                `✓ Search found ${providerId.toUpperCase()} ID ${foundId} for: "${extractedIds.title}"`
              );
              extractedIds.tmdbId = foundId;

              // Check cache before fetching
              if (metadataCache.has(foundId)) {
                mediaEntry.metadata = metadataCache.get(foundId)!;
                // Get additional images if available
                const images = existingImagesMap.get(foundId) || {
                  plainPosterUrl: null,
                  logoUrl: null,
                };
                mediaEntry.plainPosterUrl = images.plainPosterUrl;
                mediaEntry.logoUrl = images.logoUrl;
                metadataFetched++;
              } else {
                const mediaMetadata = await metadataProvider.getMetadata(
                  foundId,
                  mediaType,
                  {
                    language: "en-US",
                  }
                );
                if (mediaMetadata) {
                  const typedMetadata = convertToTmdbMetadata(
                    mediaMetadata,
                    providerId
                  );

                  // Debug: Log genres from provider
                  const genres = mediaMetadata.genres;
                  if (genres && genres.length > 0) {
                    logger.debug(
                      `${providerId.toUpperCase()} search returned ${genres.length} genres for "${typedMetadata.title || typedMetadata.name}": ${genres.join(", ")}`
                    );
                  } else {
                    logger.warn(
                      `${providerId.toUpperCase()} search returned NO genres for "${typedMetadata.title || typedMetadata.name}"`
                    );
                  }

                  // Fetch additional images (plain poster and logo)
                  const { plainPosterUrl, logoUrl } =
                    await fetchAdditionalImages(
                      providerId,
                      foundId,
                      mediaType,
                      metadataProvider,
                      rateLimiter
                    );

                  metadataCache.set(foundId, typedMetadata);
                  mediaEntry.metadata = typedMetadata;
                  mediaEntry.plainPosterUrl = plainPosterUrl;
                  mediaEntry.logoUrl = logoUrl;
                  metadataFetched++;
                  metadataFromProvider++;

                  scanLogger?.logSearchAttempt(
                    mediaEntry.path,
                    extractedIds.title!,
                    1, // results found
                    parseInt(foundId) || 0,
                    typedMetadata.title || typedMetadata.name || ""
                  );

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
                    `✓ Fetched: ${typedMetadata.title || typedMetadata.name}`
                  );
                }
              }
            } else {
              logger.warn(`✗ No results found for: "${extractedIds.title}"`);
              metadataFetched++;
              scanLogger?.logSearchFailure(
                mediaEntry.path,
                extractedIds.title!
              );
            }
          } catch (searchError) {
            const errorMessage =
              searchError instanceof Error
                ? searchError.message
                : String(searchError);
            logger.error(
              `✗ Failed to search for "${extractedIds.title}": ${errorMessage}`
            );
            metadataFetched++;
            scanLogger?.logSearchFailure(
              mediaEntry.path,
              extractedIds.title!,
              errorMessage
            );
          }
        });
        metadataFetchPromises.push(searchPromise);
      }
    }
  }

  // Wait for all metadata fetches to complete
  logger.info(
    `Waiting for ${metadataFetchPromises.length} metadata fetch promise(s) to complete...`
  );
  await Promise.allSettled(metadataFetchPromises);
  logger.info(
    `All metadata fetch promises completed. Stats: ${metadataFromCache} from cache, ${metadataFromProvider} from ${providerId.toUpperCase()}, ${metadataFetched} total fetched`
  );

  return {
    metadataFromCache,
    metadataFromProvider,
    totalFetched: metadataFetched,
  };
}

/**
 * Fetch season metadata for TV show episodes
 */
export async function fetchSeasonMetadata(
  mediaEntries: MediaEntry[],
  options: {
    metadataProvider: IMetadataProvider;
    rateLimiter: RateLimiter;
    episodeMetadataCache: Map<string, TmdbSeasonMetadata>;
    libraryId: string;
  }
): Promise<void> {
  const { metadataProvider, rateLimiter, episodeMetadataCache, libraryId } =
    options;

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
        if (!metadataProvider.getSeasonMetadata) {
          logger.warn(
            `Provider ${metadataProvider.name} does not support season metadata fetching`
          );
          episodesFetched++;
          return;
        }

        const seasonMetadata = await metadataProvider.getSeasonMetadata(
          tvId,
          seasonNumber,
          {
            language: "en-US",
          }
        );

        if (seasonMetadata) {
          // Convert SeasonMetadata to TmdbSeasonMetadata format
          // For TMDB provider, the _tmdb field should contain the original data
          const tmdbSeasonMetadata = (seasonMetadata as any)._tmdb || {
            season_number: seasonNumber,
            episodes: seasonMetadata.episodes?.map((ep) => ({
              episode_number: ep.episodeNumber,
              name: ep.name,
              overview: ep.description,
              air_date: ep.airDate,
              still_path: ep.stillUrl
                ? extractTmdbPath(ep.stillUrl) || undefined
                : undefined,
              runtime: ep.runtime,
            })),
          };
          episodeMetadataCache.set(
            seasonKey,
            tmdbSeasonMetadata as TmdbSeasonMetadata
          );
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
            `✓ Fetched season: S${seasonNumber} (${seasonMetadata.episodes?.length || 0} episodes)`
          );
        }
      } catch (error) {
        logger.warn(
          `Could not fetch season S${seasonNumber}: ${error instanceof Error ? error.message : error}`
        );
        episodesFetched++;
      }
    });
    episodeFetchPromises.push(fetchPromise);
  }

  await Promise.allSettled(episodeFetchPromises);
  logger.info("\n✓ Season metadata fetching complete\n");
}
