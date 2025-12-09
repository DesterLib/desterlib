/**
 * Metadata provider interface
 * Defines the contract for metadata providers (TMDB, OMDB, etc.)
 */
export interface MetadataProvider {
  /**
   * Search for a movie by title and optional year
   * @param title Movie title
   * @param year Optional release year
   * @returns Movie metadata or null if not found
   */
  searchMovie(title: string, year?: number): Promise<MovieMetadata | null>;

  /**
   * Get detailed movie information by provider-specific ID
   * @param movieId Provider-specific movie ID
   * @returns Movie metadata
   */
  getMovieDetails(movieId: number): Promise<MovieMetadata>;

  /**
   * Search for a TV show by title and optional year
   * @param title TV show title
   * @param year Optional first air year
   * @returns TV show metadata or null if not found
   */
  searchTVShow?(title: string, year?: number): Promise<MovieMetadata | null>;

  /**
   * Get detailed TV show information by provider-specific ID
   * @param tvShowId Provider-specific TV show ID
   * @returns TV show metadata
   */
  getTVShowDetails?(tvShowId: number): Promise<MovieMetadata>;

  /**
   * Get the provider name (e.g., "tmdb", "omdb")
   */
  getProviderName(): string;

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): boolean;
}

/**
 * Standardized movie metadata format
 * All providers should return data in this format
 */
export interface MovieMetadata {
  providerId: string; // Provider-specific ID (e.g., TMDB ID)
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
