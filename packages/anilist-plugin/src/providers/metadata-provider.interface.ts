/**
 * Metadata Provider Interface
 * Standard interface for all metadata providers
 */

export interface MetadataProvider {
  /**
   * Get the provider name (e.g., "tmdb", "anilist")
   */
  getProviderName(): string;

  /**
   * Check if the provider is available and configured
   */
  isAvailable(): boolean;
}

/**
 * Standardized movie metadata format
 * All providers should return data in this format
 */
export interface MovieMetadata {
  providerId: string; // Provider-specific ID (e.g., TMDB ID, AniList ID)
  title: string;
  overview: string | null;
  releaseDate: string | null; // ISO date string
  rating: number | null;
  posterUrl: string | null;
  nullPosterUrl: string | null;
  backdropUrl: string | null;
  nullBackdropUrl: string | null;
  logoUrl: string | null;
  genres: string[];
}
