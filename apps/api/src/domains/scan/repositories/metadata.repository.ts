/**
 * Metadata Repository
 *
 * Handles metadata fetching using metadata provider plugins
 */

import type {
  IMetadataProvider,
  MediaType,
  MediaMetadata,
} from "@/lib/providers/metadata-provider.types";
import type { MediaEntry } from "../scan.types";
import { logger } from "@/lib/utils";
import {
  createRateLimiter,
  type RateLimiter,
} from "../helpers/rate-limiter.helper";
import prisma from "@/lib/database/prisma";
import { ExternalIdSource } from "@/lib/database";

export interface FetchMetadataOptions {
  metadataProvider: IMetadataProvider;
  mediaType: MediaType;
  libraryId: string;
  rescan?: boolean;
  providerName?: string; // Provider name for database queries (e.g., "TMDB", "TVDB")
}

export interface FetchMetadataResult {
  metadataFromCache: number;
  metadataFromProvider: number;
  totalFetched: number;
}

class MetadataRepository {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = createRateLimiter();
  }

  async fetchMetadata(
    mediaEntries: MediaEntry[],
    options: FetchMetadataOptions
  ): Promise<FetchMetadataResult> {
    const { metadataProvider, mediaType, libraryId, rescan = false } = options;

    let metadataFromCache = 0;
    let metadataFromProvider = 0;
    let totalFetched = 0;

    // Check for existing metadata in database if not rescanning
    const existingMetadataMap = new Map<string, MediaMetadata>();
    if (!rescan) {
      const providerIds = mediaEntries
        .filter((e) => e.extractedIds.tmdbId) // TODO: Support other provider IDs
        .map((e) => e.extractedIds.tmdbId!);

      if (providerIds.length > 0) {
        const providerName =
          options.providerName || metadataProvider.name.toUpperCase();
        const existing = await this.fetchExistingMetadata(
          providerIds,
          libraryId,
          providerName
        );
        existing.forEach((meta, id) => {
          existingMetadataMap.set(id, meta);
        });
        metadataFromCache = existing.size;
      }
    }

    // Fetch metadata for entries
    const fetchPromises: Promise<void>[] = [];

    for (const mediaEntry of mediaEntries) {
      const { extractedIds } = mediaEntry;

      if (extractedIds.tmdbId) {
        const fetchPromise = this.rateLimiter.add(async () => {
          // Check if we already have metadata
          if (existingMetadataMap.has(extractedIds.tmdbId!)) {
            const cached = existingMetadataMap.get(extractedIds.tmdbId!)!;
            mediaEntry.metadata = this.mapToTmdbFormat(cached);
            totalFetched++;
            return;
          }

          // Fetch from provider
          try {
            const metadata = await metadataProvider.getMetadata(
              extractedIds.tmdbId!,
              mediaType
            );

            if (metadata) {
              mediaEntry.metadata = this.mapToTmdbFormat(metadata);
              mediaEntry.plainPosterUrl = metadata.plainPosterUrl || null;
              mediaEntry.logoUrl = metadata.logoUrl || null;
              totalFetched++;
              metadataFromProvider++;
            }
          } catch (error) {
            logger.error(
              `Failed to fetch metadata for ${extractedIds.tmdbId}: ${error instanceof Error ? error.message : error}`
            );
            totalFetched++;
          }
        });
        fetchPromises.push(fetchPromise);
      } else if (extractedIds.title) {
        // Search by title
        const searchPromise = this.rateLimiter.add(async () => {
          try {
            const searchResult = await metadataProvider.search(
              extractedIds.title!,
              mediaType,
              {
                year: extractedIds.year,
              }
            );

            if (searchResult) {
              extractedIds.tmdbId = searchResult.id;

              // Fetch full metadata
              const metadata = await metadataProvider.getMetadata(
                searchResult.id,
                mediaType
              );

              if (metadata) {
                mediaEntry.metadata = this.mapToTmdbFormat(metadata);
                mediaEntry.plainPosterUrl = metadata.plainPosterUrl || null;
                mediaEntry.logoUrl = metadata.logoUrl || null;
                totalFetched++;
                metadataFromProvider++;
              }
            } else {
              totalFetched++;
            }
          } catch (error) {
            logger.error(
              `Failed to search for "${extractedIds.title}": ${error instanceof Error ? error.message : error}`
            );
            totalFetched++;
          }
        });
        fetchPromises.push(searchPromise);
      }
    }

    await Promise.allSettled(fetchPromises);

    return {
      metadataFromCache,
      metadataFromProvider,
      totalFetched,
    };
  }

  private async fetchExistingMetadata(
    ids: string[],
    libraryId: string,
    providerName: string = "TMDB" // Default to TMDB for backward compatibility
  ): Promise<Map<string, MediaMetadata>> {
    const metadataMap = new Map<string, MediaMetadata>();

    // Map provider name to ExternalIdSource enum
    // Default to TMDB if provider name doesn't match known sources
    let source: ExternalIdSource;
    const upperProviderName = providerName.toUpperCase();
    if (upperProviderName === "TMDB") {
      source = ExternalIdSource.TMDB;
    } else if (upperProviderName === "IMDB") {
      source = ExternalIdSource.IMDB;
    } else if (upperProviderName === "TVDB") {
      source = ExternalIdSource.TVDB;
    } else {
      // Default to TMDB for backward compatibility
      source = ExternalIdSource.TMDB;
    }

    const existingExternalIds = await prisma.externalId.findMany({
      where: {
        source: source,
        externalId: {
          in: ids,
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
        media: true,
      },
    });

    existingExternalIds.forEach((extId) => {
      const { media } = extId;
      metadataMap.set(extId.externalId, {
        id: extId.externalId,
        title: media.title,
        description: media.description || undefined,
        posterUrl: media.posterUrl || undefined,
        plainPosterUrl: media.plainPosterUrl,
        backdropUrl: media.backdropUrl || undefined,
        logoUrl: media.logoUrl,
        releaseDate: media.releaseDate?.toISOString().split("T")[0],
        rating: media.rating || undefined,
      });
    });

    return metadataMap;
  }

  /**
   * Map standardized metadata to TMDB format (for backward compatibility)
   */
  private mapToTmdbFormat(metadata: MediaMetadata): any {
    return {
      id: parseInt(metadata.id),
      title: metadata.title,
      name: metadata.title,
      overview: metadata.description,
      poster_path: metadata.posterUrl
        ? metadata.posterUrl
            .split("/")
            .pop()
            ?.replace(/^original/, "")
        : undefined,
      backdrop_path: metadata.backdropUrl
        ? metadata.backdropUrl
            .split("/")
            .pop()
            ?.replace(/^original/, "")
        : undefined,
      release_date: metadata.releaseDate,
      first_air_date: metadata.releaseDate,
      vote_average: metadata.rating,
      genres: metadata.genres?.map((name) => ({ name })) || [],
    };
  }
}

export const scanMetadataRepository = new MetadataRepository();
