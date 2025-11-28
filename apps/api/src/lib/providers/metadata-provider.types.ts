/**
 * Metadata Provider Plugin System
 *
 * This defines the interface that all metadata providers must implement.
 * This allows for easy extension to support multiple metadata sources (TMDB, TVDB, OMDB, etc.)
 */

export type MediaType = "movie" | "tv";

export interface MetadataProviderConfig {
  apiKey?: string;
  [key: string]: unknown;
}

/**
 * Standardized metadata structure that all providers must return
 */
export interface MediaMetadata {
  id: string; // Provider-specific ID (e.g., TMDB ID)
  title: string;
  description?: string;
  posterUrl?: string;
  plainPosterUrl?: string | null;
  backdropUrl?: string;
  logoUrl?: string | null;
  releaseDate?: string;
  rating?: number;
  genres?: string[];
  [key: string]: unknown; // Allow additional provider-specific fields
}

/**
 * Season metadata for TV shows
 */
export interface SeasonMetadata {
  seasonNumber: number;
  episodes?: EpisodeMetadata[];
  posterUrl?: string;
  [key: string]: unknown;
}

/**
 * Episode metadata for TV shows
 */
export interface EpisodeMetadata {
  episodeNumber: number;
  name?: string;
  description?: string;
  airDate?: string;
  stillUrl?: string;
  runtime?: number;
  [key: string]: unknown;
}

/**
 * Search result from metadata provider
 */
export interface MetadataSearchResult {
  id: string;
  title: string;
  year?: string;
  type: MediaType;
  posterUrl?: string;
}

/**
 * Metadata Provider Plugin Interface
 *
 * All metadata providers must implement this interface
 */
export interface IMetadataProvider {
  /**
   * Unique identifier for this provider (e.g., "tmdb", "tvdb", "omdb")
   */
  readonly name: string;

  /**
   * Human-readable name for this provider
   */
  readonly displayName: string;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: MetadataProviderConfig): Promise<void> | void;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Fetch metadata by provider-specific ID
   */
  getMetadata(
    id: string,
    type: MediaType,
    options?: {
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<MediaMetadata | null>;

  /**
   * Search for media by title
   */
  search(
    query: string,
    type: MediaType,
    options?: {
      year?: string;
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<MetadataSearchResult | null>;

  /**
   * Fetch season metadata for TV shows
   */
  getSeasonMetadata?(
    tvId: string,
    seasonNumber: number,
    options?: {
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<SeasonMetadata | null>;

  /**
   * Fetch episode metadata for TV shows
   */
  getEpisodeMetadata?(
    tvId: string,
    seasonNumber: number,
    episodeNumber: number,
    options?: {
      language?: string;
      [key: string]: unknown;
    }
  ): Promise<EpisodeMetadata | null>;

  /**
   * Get additional images (posters, logos, etc.)
   */
  getImages?(
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
  } | null>;
}
