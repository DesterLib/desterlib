import axios, { AxiosInstance } from "axios";
import { Logger } from "@dester/logger";
import { RateLimiter } from "../rate-limiter";
import { MetadataProvider, MovieMetadata } from "./metadata-provider.interface";

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: Array<{ id: number; name: string }>;
}

interface TMDBSearchResult {
  results: Array<{
    id: number;
    title: string;
    release_date: string;
  }>;
}

/**
 * TMDB (The Movie Database) metadata provider
 */
export class TMDBProvider implements MetadataProvider {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private logger: Logger;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second
  private apiKey: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    baseUrl: string = "https://api.themoviedb.org/3",
    rateLimiter: RateLimiter,
    logger: Logger
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      params: {
        api_key: apiKey,
      },
      timeout: 10000,
    });

    this.rateLimiter = rateLimiter;
    this.logger = logger;
  }

  getProviderName(): string {
    return "tmdb";
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Search for a movie by title and year
   */
  async searchMovie(
    title: string,
    year?: number
  ): Promise<MovieMetadata | null> {
    await this.rateLimiter.acquire();

    const params: any = {
      query: title,
    };

    if (year) {
      params.year = year;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.get<TMDBSearchResult>(
          "/search/movie",
          {
            params,
          }
        );

        if (response.data.results.length === 0) {
          this.logger.warn({ title, year }, "No TMDB results found");
          return null;
        }

        // Return the first result (most relevant)
        const movieId = response.data.results[0].id;
        return await this.getMovieDetails(movieId);
      } catch (error: any) {
        lastError = error;
        const delay = this.baseRetryDelay * Math.pow(2, attempt);
        this.logger.warn(
          { error: error.message, attempt: attempt + 1, delay },
          "TMDB search failed, retrying..."
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.logger.error(
      { error: lastError, title, year },
      "TMDB search failed after retries"
    );
    throw lastError || new Error("TMDB search failed");
  }

  /**
   * Get detailed movie information by TMDB ID
   */
  async getMovieDetails(movieId: number): Promise<MovieMetadata> {
    await this.rateLimiter.acquire();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.get<TMDBMovie>(`/movie/${movieId}`, {
          params: {
            append_to_response: "credits,images",
          },
        });

        return this.mapTMDBToMetadata(response.data);
      } catch (error: any) {
        lastError = error;
        const delay = this.baseRetryDelay * Math.pow(2, attempt);
        this.logger.warn(
          { error: error.message, attempt: attempt + 1, delay, movieId },
          "TMDB getMovieDetails failed, retrying..."
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.logger.error(
      { error: lastError, movieId },
      "TMDB getMovieDetails failed after retries"
    );
    throw lastError || new Error("TMDB getMovieDetails failed");
  }

  /**
   * Map TMDB movie data to standardized metadata format
   */
  private mapTMDBToMetadata(tmdbMovie: TMDBMovie): MovieMetadata {
    const posterUrl = this.getImageUrl(tmdbMovie.poster_path);
    const backdropUrl = this.getImageUrl(tmdbMovie.backdrop_path);
    const genres = tmdbMovie.genres.map((g) => g.name);

    return {
      providerId: tmdbMovie.id.toString(),
      title: tmdbMovie.title,
      overview: tmdbMovie.overview || null,
      releaseDate: tmdbMovie.release_date || null,
      rating: tmdbMovie.vote_average || null,
      posterUrl,
      backdropUrl,
      genres,
    };
  }

  /**
   * Build full image URL from path
   */
  private getImageUrl(
    path: string | null,
    size: string = "original"
  ): string | null {
    if (!path) {
      return null;
    }
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}
