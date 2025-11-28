/**
 * TMDB Metadata Provider Plugin
 *
 * Implements the IMetadataProvider interface for The Movie Database (TMDB)
 */

import type {
  IMetadataProvider,
  MediaMetadata,
  MediaType,
  MetadataProviderConfig,
  MetadataSearchResult,
  SeasonMetadata,
  EpisodeMetadata,
} from "../metadata-provider.types";
import { tmdbServices } from "./tmdb.services";
import { logger } from "@/lib/utils";

/**
 * Get full TMDB image URL from a relative path
 */
function getTmdbImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

  // If it's already a full URL, check if it's malformed with repeated prefixes
  if (path.startsWith("http")) {
    // Check for repeated TMDB prefixes and clean them up
    if (path.includes(TMDB_IMAGE_BASE_URL)) {
      // Extract the actual path part after the last occurrence of the base URL
      const lastIndex = path.lastIndexOf(TMDB_IMAGE_BASE_URL);
      if (lastIndex >= 0) {
        const actualPath = path.substring(
          lastIndex + TMDB_IMAGE_BASE_URL.length
        );
        return `${TMDB_IMAGE_BASE_URL}${actualPath}`;
      }
    }
    // If it's a valid URL without issues, return as-is
    return path;
  }

  // Ensure path starts with / if it doesn't
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}${cleanPath}`;
}

export class TmdbMetadataProvider implements IMetadataProvider {
  readonly name = "tmdb";
  readonly displayName = "The Movie Database (TMDB)";
  private apiKey: string | null = null;
  private baseImageUrl = "https://image.tmdb.org/t/p/original";

  initialize(config: MetadataProviderConfig): void {
    if (config.apiKey && typeof config.apiKey === "string") {
      this.apiKey = config.apiKey;
    } else {
      throw new Error("TMDB API key is required");
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getMetadata(
    id: string,
    type: MediaType,
    options?: {
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<MediaMetadata | null> {
    if (!this.apiKey) {
      throw new Error("TMDB provider is not configured. API key is required.");
    }

    try {
      const tmdbType = type === "tv" ? "tv" : "movie";
      const metadata = await tmdbServices.get(id, tmdbType, {
        apiKey: this.apiKey,
        lang: options?.language || "en-US",
        extraParams: {
          append_to_response: "credits",
        },
      });

      if (!metadata) {
        return null;
      }

      return this.mapTmdbToStandardMetadata(metadata, type);
    } catch (error) {
      logger.error(
        `Failed to fetch TMDB metadata for ${type} ${id}: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  async search(
    query: string,
    type: MediaType,
    options?: {
      year?: string;
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<MetadataSearchResult | null> {
    if (!this.apiKey) {
      throw new Error("TMDB provider is not configured. API key is required.");
    }

    try {
      const result = await tmdbServices.search(query, type, {
        apiKey: this.apiKey,
        year: options?.year,
        lang: options?.language || "en-US",
      });

      if (!result) {
        return null;
      }

      // If result is a string (ID), fetch full metadata
      if (typeof result === "string") {
        const metadata = await this.getMetadata(result, type, options);
        if (!metadata) {
          return null;
        }
        return {
          id: metadata.id,
          title: metadata.title,
          type,
          posterUrl: metadata.posterUrl,
        };
      }

      // If result is already a search result object
      return {
        id: String(result.id || ""),
        title: result.title || result.name || "",
        year: result.release_date || result.first_air_date || undefined,
        type,
        posterUrl: result.poster_path
          ? getTmdbImageUrl(result.poster_path) || undefined
          : undefined,
      };
    } catch (error) {
      logger.error(
        `Failed to search TMDB for "${query}": ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  async getSeasonMetadata(
    tvId: string,
    seasonNumber: number,
    options?: {
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<SeasonMetadata | null> {
    if (!this.apiKey) {
      throw new Error("TMDB provider is not configured. API key is required.");
    }

    try {
      const seasonData = await tmdbServices.getSeason(tvId, seasonNumber, {
        apiKey: this.apiKey,
        lang: options?.language || "en-US",
      });

      if (!seasonData) {
        return null;
      }

      return {
        seasonNumber: seasonData.season_number || seasonNumber,
        episodes: seasonData.episodes?.map((ep: any) => ({
          episodeNumber: ep.episode_number || 0,
          name: ep.name,
          description: ep.overview,
          airDate: ep.air_date,
          stillUrl: ep.still_path
            ? getTmdbImageUrl(ep.still_path) || undefined
            : undefined,
          runtime: ep.runtime,
        })),
        posterUrl: seasonData.poster_path
          ? getTmdbImageUrl(seasonData.poster_path) || undefined
          : undefined,
      };
    } catch (error) {
      logger.error(
        `Failed to fetch TMDB season metadata: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  async getEpisodeMetadata(
    tvId: string,
    seasonNumber: number,
    episodeNumber: number,
    options?: {
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<EpisodeMetadata | null> {
    if (!this.apiKey) {
      throw new Error("TMDB provider is not configured. API key is required.");
    }

    try {
      const episodeData = await tmdbServices.getEpisode(
        tvId,
        seasonNumber,
        episodeNumber,
        {
          apiKey: this.apiKey,
          lang: options?.language || "en-US",
        }
      );

      if (!episodeData) {
        return null;
      }

      return {
        episodeNumber: episodeData.episode_number || episodeNumber,
        name: episodeData.name,
        description: episodeData.overview,
        airDate: episodeData.air_date,
        stillUrl: episodeData.still_path
          ? getTmdbImageUrl(episodeData.still_path) || undefined
          : undefined,
        runtime: episodeData.runtime,
      };
    } catch (error) {
      logger.error(
        `Failed to fetch TMDB episode metadata: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  async getImages(
    id: string,
    type: MediaType,
    options?: {
      language?: string;
      includeImageLanguage?: string;
      [key: string]: unknown;
    }
  ): Promise<{
    posters?: Array<{ file_path: string; iso_639_1?: string | null }>;
    logos?: Array<{ file_path: string; iso_639_1?: string | null }>;
    backdrops?: Array<{ file_path: string; iso_639_1?: string | null }>;
    [key: string]: unknown;
  } | null> {
    if (!this.apiKey) {
      throw new Error("TMDB provider is not configured. API key is required.");
    }

    try {
      const tmdbType = type === "tv" ? "tv" : "movie";
      const images = await tmdbServices.getImages(id, tmdbType, {
        apiKey: this.apiKey,
        language: options?.language || "en-US",
        includeImageLanguage: options?.includeImageLanguage,
      });

      return images;
    } catch (error) {
      logger.error(
        `Failed to fetch TMDB images: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }
  }

  /**
   * Map TMDB API response to standardized metadata format
   */
  private mapTmdbToStandardMetadata(
    tmdbData: any,
    type: MediaType
  ): MediaMetadata {
    return {
      id: String(tmdbData.id),
      title: tmdbData.title || tmdbData.name || "",
      description: tmdbData.overview,
      posterUrl: tmdbData.poster_path
        ? getTmdbImageUrl(tmdbData.poster_path) || undefined
        : undefined,
      backdropUrl: tmdbData.backdrop_path
        ? getTmdbImageUrl(tmdbData.backdrop_path) || undefined
        : undefined,
      releaseDate: tmdbData.release_date || tmdbData.first_air_date,
      rating: tmdbData.vote_average,
      genres: tmdbData.genres?.map((g: any) => g.name) || [],
      // Include original TMDB data for backward compatibility
      _tmdb: tmdbData,
    };
  }
}
