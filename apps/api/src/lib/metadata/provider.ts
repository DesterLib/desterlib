import { MediaType, ExternalIdSource } from "../../generated/prisma/index.js";
import type {
  MediaMetadata,
  MediaSearchResult,
  SeasonMetadata,
  EpisodeMetadata,
} from "./types.js";

/**
 * Base interface for all metadata providers
 * Providers implement this to fetch metadata from external sources
 */
export interface MetadataProvider {
  /**
   * The name of the provider (e.g., "tmdb", "imdb")
   */
  readonly name: string;

  /**
   * The external ID source this provider handles
   */
  readonly source: ExternalIdSource;

  /**
   * Media types this provider supports
   */
  readonly supportedMediaTypes: MediaType[];

  /**
   * Search for media by title and optional filters
   */
  search(
    query: string,
    mediaType: MediaType,
    options?: {
      year?: number;
      language?: string;
      includeAdult?: boolean;
    }
  ): Promise<MediaSearchResult[]>;

  /**
   * Get full metadata for a specific media item by external ID
   */
  getMetadata(
    externalId: string,
    mediaType: MediaType,
    options?: {
      language?: string;
    }
  ): Promise<MediaMetadata | null>;

  /**
   * Get season metadata for a TV show
   */
  getSeasonMetadata?(
    showExternalId: string,
    seasonNumber: number,
    options?: {
      language?: string;
    }
  ): Promise<SeasonMetadata | null>;

  /**
   * Get episode metadata for a TV show
   */
  getEpisodeMetadata?(
    showExternalId: string,
    seasonNumber: number,
    episodeNumber: number,
    options?: {
      language?: string;
    }
  ): Promise<EpisodeMetadata | null>;

  /**
   * Check if the provider is properly configured and available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Abstract base class for metadata providers
 * Provides common functionality and validation
 */
export abstract class BaseMetadataProvider implements MetadataProvider {
  abstract readonly name: string;
  abstract readonly source: ExternalIdSource;
  abstract readonly supportedMediaTypes: MediaType[];

  abstract search(
    query: string,
    mediaType: MediaType,
    options?: {
      year?: number;
      language?: string;
      includeAdult?: boolean;
    }
  ): Promise<MediaSearchResult[]>;

  abstract getMetadata(
    externalId: string,
    mediaType: MediaType,
    options?: {
      language?: string;
    }
  ): Promise<MediaMetadata | null>;

  async isAvailable(): Promise<boolean> {
    // Default implementation - providers can override
    return true;
  }

  /**
   * Validate that this provider supports the given media type
   */
  protected validateMediaType(mediaType: MediaType): void {
    if (!this.supportedMediaTypes.includes(mediaType)) {
      throw new Error(
        `Provider ${this.name} does not support media type ${mediaType}`
      );
    }
  }
}
