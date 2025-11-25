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
import { extractTmdbPath, getTmdbImageUrl } from "./tmdb-image.helper";
import prisma from "@/lib/database/prisma";

/**
 * Fetch and extract plain poster and logo URLs from TMDB images endpoint
 * Queries them separately for better efficiency and clarity
 */
async function fetchAdditionalImages(
  tmdbId: string,
  mediaType: "movie" | "tv",
  tmdbApiKey: string,
  rateLimiter: RateLimiter
): Promise<{ plainPosterUrl: string | null; logoUrl: string | null }> {
  try {
    logger.info(
      `Fetching additional images for TMDB ID ${tmdbId} (${mediaType})`
    );

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
    // Note: We bypass the rate limiter for image fetches since they're called after main metadata
    // and we want them to complete quickly. The rate limiter might be blocking these requests.
    const timeoutMs = 15000; // 15 seconds timeout per request (increased from 10)
    const [posterData, logoData] = await Promise.allSettled([
      // Fetch plain poster without language-specific text
      // Use include_image_language=null to get images where iso_639_1 is null
      withTimeout(
        (async () => {
          logger.info(`Fetching plain poster for TMDB ID ${tmdbId}...`);
          return await tmdbServices.getImages(tmdbId, mediaType as TmdbType, {
            apiKey: tmdbApiKey,
            language: "en-US", // Main language parameter
            includeImageLanguage: "null", // Get images where iso_639_1 is null (no language)
          });
        })(),
        timeoutMs,
        `Plain poster fetch timeout for TMDB ID ${tmdbId}`
      ),
      // Fetch English logo
      // Use include_image_language=en,null to get English logos and those without language
      withTimeout(
        (async () => {
          logger.info(`Fetching logo for TMDB ID ${tmdbId}...`);
          return await tmdbServices.getImages(tmdbId, mediaType as TmdbType, {
            apiKey: tmdbApiKey,
            language: "en-US", // Main language parameter
            includeImageLanguage: "en,null", // Get English logos and those without language tags
          });
        })(),
        timeoutMs,
        `Logo fetch timeout for TMDB ID ${tmdbId}`
      ),
    ]);

    // Handle results from Promise.allSettled
    const posterResult =
      posterData.status === "fulfilled" ? posterData.value : null;
    const logoResult = logoData.status === "fulfilled" ? logoData.value : null;

    if (posterData.status === "rejected") {
      logger.warn(
        `Failed to fetch plain poster for TMDB ID ${tmdbId}: ${posterData.reason}`
      );
    }
    if (logoData.status === "rejected") {
      logger.warn(
        `Failed to fetch logo for TMDB ID ${tmdbId}: ${logoData.reason}`
      );
    }

    // Extract plain poster (first poster without language)
    let plainPosterUrl: string | null = null;
    if (posterResult?.posters && Array.isArray(posterResult.posters)) {
      // Find poster with iso_639_1 === null (no language tag)
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
      // Find logo with iso_639_1 === "en" (English)
      // If no English logo found, fallback to one with iso_639_1 === null
      const englishLogo = logoResult.logos.find(
        (logo: any) => logo.iso_639_1 === "en"
      );
      if (englishLogo?.file_path) {
        logoUrl = getTmdbImageUrl(englishLogo.file_path);
      } else {
        // Fallback to logo without language tag
        const fallbackLogo = logoResult.logos.find(
          (logo: any) => logo.iso_639_1 === null
        );
        if (fallbackLogo?.file_path) {
          logoUrl = getTmdbImageUrl(fallbackLogo.file_path);
        }
      }
    }

    logger.info(
      `Completed fetching additional images for TMDB ID ${tmdbId}: plainPoster=${plainPosterUrl ? "found" : "none"}, logo=${logoUrl ? "found" : "none"}`
    );

    return { plainPosterUrl, logoUrl };
  } catch (error) {
    logger.warn(
      `Failed to fetch additional images for TMDB ID ${tmdbId}: ${error instanceof Error ? error.message : error}`
    );
    return { plainPosterUrl: null, logoUrl: null };
  }
}

/**
 * Fetch existing metadata from database for given TMDB IDs
 */
export async function fetchExistingMetadata(
  tmdbIds: string[],
  libraryId: string
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

  if (tmdbIds.length === 0) {
    return { metadataMap: existingMetadataMap, imagesMap: existingImagesMap };
  }

  logger.info(
    `Checking for existing metadata for ${tmdbIds.length} TMDB ID(s) in library ${libraryId}`
  );

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
    existingImagesMap: Map<
      string,
      { plainPosterUrl: string | null; logoUrl: string | null }
    >;
    libraryId: string;
    scanLogger?: import("./scan-log.helper").ScanLogger;
  }
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
    existingImagesMap,
    libraryId,
    scanLogger,
  } = options;

  logger.info(
    `fetchMetadataForEntries called with ${mediaEntries.length} entries (mediaType: ${mediaType})`
  );

  const metadataFetchPromises: Promise<void>[] = [];
  let metadataFetched = 0;
  let metadataFromCache = 0;
  let metadataFromTMDB = 0;
  const totalMetadataToFetch = mediaEntries.filter(
    (e) => e.extractedIds.tmdbId || e.extractedIds.title
  ).length;

  logger.info(
    `Total metadata to fetch: ${totalMetadataToFetch} (entries with TMDB ID or title)`
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

            // Fetch additional images (plain poster and logo)
            const { plainPosterUrl, logoUrl } = await fetchAdditionalImages(
              tmdbId,
              "tv",
              tmdbApiKey,
              rateLimiter
            );

            // Apply metadata and images to all episodes of this show
            episodes.forEach((ep) => {
              ep.metadata = typedMetadata;
              ep.plainPosterUrl = plainPosterUrl;
              ep.logoUrl = logoUrl;
            });
            metadataFetched += episodes.length;
            metadataFromTMDB++;

            logger.info(
              `✓ Fetched show metadata: "${typedMetadata.title || typedMetadata.name}" (applied to ${episodes.length} episode(s))`
            );
          }
        } catch (error) {
          logger.error(
            `✗ Failed to fetch TMDB ID ${tmdbId}: ${error instanceof Error ? error.message : error}`
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
              `✓ Search found TMDB ID ${foundId} for: "${extractedIds.title}"`
            );

            // Update all episodes with the found TMDB ID
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
              const metadata = await tmdbServices.get(
                foundId,
                "tv" as TmdbType,
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

                // Fetch additional images (plain poster and logo)
                const { plainPosterUrl, logoUrl } = await fetchAdditionalImages(
                  foundId,
                  "tv",
                  tmdbApiKey,
                  rateLimiter
                );

                episodes.forEach((ep) => {
                  ep.metadata = typedMetadata;
                  ep.plainPosterUrl = plainPosterUrl;
                  ep.logoUrl = logoUrl;
                });
                metadataFetched += episodes.length;
                metadataFromTMDB++;

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

              // Debug: Log genres from TMDB
              const genres = (metadata as any).genres;
              if (genres && genres.length > 0) {
                logger.debug(
                  `TMDB returned ${genres.length} genres for "${typedMetadata.title || typedMetadata.name}": ${genres.map((g: any) => g.name).join(", ")}`
                );
              } else {
                logger.warn(
                  `TMDB returned NO genres for "${typedMetadata.title || typedMetadata.name}"`
                );
              }

              // Fetch additional images (plain poster and logo)
              const { plainPosterUrl, logoUrl } = await fetchAdditionalImages(
                extractedIds.tmdbId!,
                mediaType,
                tmdbApiKey,
                rateLimiter
              );

              metadataCache.set(extractedIds.tmdbId!, typedMetadata);
              mediaEntry.metadata = typedMetadata;
              mediaEntry.plainPosterUrl = plainPosterUrl;
              mediaEntry.logoUrl = logoUrl;
              metadataFetched++;
              metadataFromTMDB++;

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
              `✗ Failed to fetch TMDB ID ${extractedIds.tmdbId} (${mediaEntry.name}): ${metadataError instanceof Error ? metadataError.message : metadataError}`
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
                // Get additional images if available
                const images = existingImagesMap.get(foundId) || {
                  plainPosterUrl: null,
                  logoUrl: null,
                };
                mediaEntry.plainPosterUrl = images.plainPosterUrl;
                mediaEntry.logoUrl = images.logoUrl;
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
                  }
                );
                if (metadata) {
                  const typedMetadata = metadata as TmdbMetadata;

                  // Debug: Log genres from TMDB
                  const genres = (metadata as any).genres;
                  if (genres && genres.length > 0) {
                    logger.debug(
                      `TMDB search returned ${genres.length} genres for "${typedMetadata.title || typedMetadata.name}": ${genres.map((g: any) => g.name).join(", ")}`
                    );
                  } else {
                    logger.warn(
                      `TMDB search returned NO genres for "${typedMetadata.title || typedMetadata.name}"`
                    );
                  }

                  // Fetch additional images (plain poster and logo)
                  const { plainPosterUrl, logoUrl } =
                    await fetchAdditionalImages(
                      foundId,
                      mediaType,
                      tmdbApiKey,
                      rateLimiter
                    );

                  metadataCache.set(foundId, typedMetadata);
                  mediaEntry.metadata = typedMetadata;
                  mediaEntry.plainPosterUrl = plainPosterUrl;
                  mediaEntry.logoUrl = logoUrl;
                  metadataFetched++;
                  metadataFromTMDB++;

                  scanLogger?.logSearchAttempt(
                    mediaEntry.path,
                    extractedIds.title!,
                    1, // results found
                    foundId,
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
    `All metadata fetch promises completed. Stats: ${metadataFromCache} from cache, ${metadataFromTMDB} from TMDB, ${metadataFetched} total fetched`
  );

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
  }
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
          { apiKey: tmdbApiKey }
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
