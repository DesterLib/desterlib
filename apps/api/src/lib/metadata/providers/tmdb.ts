import {
  MediaType,
  ExternalIdSource,
} from "../../../generated/prisma/index.js";
import { BaseMetadataProvider } from "../provider.js";
import logger from "../../../config/logger.js";
import { prisma } from "../../../lib/prisma.js";
import type {
  MediaMetadata,
  MediaSearchResult,
  SeasonMetadata,
  EpisodeMetadata,
  PersonMetadata,
} from "../types.js";

/**
 * TMDB API configuration
 * Configure via application settings (Settings > Libraries > TMDB API Key)
 */
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Image sizes
const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";
const PROFILE_SIZE = "w185";
const STILL_SIZE = "w300";

interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
  genres?: { id: number; name: string }[];
  imdb_id?: string;
  credits?: {
    cast?: TMDBCast[];
    crew?: TMDBCrew[];
  };
  videos?: {
    results?: TMDBVideo[];
  };
}

interface TMDBTVShow {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  first_air_date?: string;
  vote_average?: number;
  poster_path?: string;
  backdrop_path?: string;
  genres?: { id: number; name: string }[];
  created_by?: { name: string }[];
  networks?: { name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  external_ids?: {
    imdb_id?: string;
    tvdb_id?: number;
  };
  credits?: {
    cast?: TMDBCast[];
    crew?: TMDBCrew[];
  };
}

interface TMDBSeason {
  season_number: number;
  name?: string;
  overview?: string;
  air_date?: string;
  episode_count?: number;
  poster_path?: string;
}

interface TMDBEpisode {
  season_number: number;
  episode_number: number;
  name: string;
  overview?: string;
  air_date?: string;
  runtime?: number;
  still_path?: string;
}

interface TMDBCast {
  name: string;
  character?: string;
  profile_path?: string;
  order?: number;
}

interface TMDBCrew {
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

interface TMDBVideo {
  type: string;
  site: string;
  key: string;
  official?: boolean;
}

interface TMDBSearchResult {
  id: number;
  title?: string; // for movies
  name?: string; // for TV shows
  original_title?: string;
  original_name?: string;
  release_date?: string; // for movies
  first_air_date?: string; // for TV shows
  overview?: string;
  poster_path?: string;
  media_type?: string;
}

/**
 * TMDB (The Movie Database) metadata provider
 * Supports movies and TV shows
 */
export class TMDBProvider extends BaseMetadataProvider {
  readonly name = "tmdb";
  readonly source = ExternalIdSource.TMDB;
  readonly supportedMediaTypes = [MediaType.MOVIE, MediaType.TV_SHOW];

  /**
   * Get TMDB API key from database settings
   */
  private async getApiKey(): Promise<string | null> {
    try {
      const settings = await prisma.settings.findUnique({
        where: { id: "default" },
        select: { tmdbApiKey: true },
      });
      return settings?.tmdbApiKey || null;
    } catch (error) {
      logger.error("Failed to fetch TMDB API key from database:", { error });
      return null;
    }
  }

  /**
   * Check if TMDB API key is configured
   */
  override async isAvailable(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!apiKey;
  }

  /**
   * Make a request to TMDB API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<T | null> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      logger.warn("TMDB API key not configured - metadata fetch skipped");
      return null;
    }

    try {
      const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
      url.searchParams.append("api_key", apiKey);

      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, String(value));
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorBody = await response
          .text()
          .catch(() => "Unable to read error body");
        logger.error(
          `TMDB API error: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            endpoint,
            error: errorBody,
          }
        );
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      logger.error("TMDB API request failed:", {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        endpoint,
      });
      return null;
    }
  }

  /**
   * Build full image URL
   */
  private getImageUrl(
    path: string | null | undefined,
    size: string
  ): string | undefined {
    if (!path) return undefined;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  /**
   * Search for media on TMDB
   */
  async search(
    query: string,
    mediaType: MediaType,
    options?: {
      year?: number;
      language?: string;
      includeAdult?: boolean;
    }
  ): Promise<MediaSearchResult[]> {
    this.validateMediaType(mediaType);

    const endpoint =
      mediaType === MediaType.MOVIE ? "/search/movie" : "/search/tv";
    const params: Record<string, string | number | boolean> = {
      query,
      language: options?.language || "en-US",
      include_adult: options?.includeAdult ?? false,
    };

    if (options?.year) {
      if (mediaType === MediaType.MOVIE) {
        params.year = options.year;
      } else {
        params.first_air_date_year = options.year;
      }
    }

    const response = await this.request<{ results: TMDBSearchResult[] }>(
      endpoint,
      params
    );

    if (!response?.results) {
      return [];
    }

    return response.results.map((result) => {
      const title = result.title || result.name || "";
      const releaseDate =
        result.release_date || result.first_air_date
          ? new Date(result.release_date || result.first_air_date!)
          : undefined;

      return {
        externalId: String(result.id),
        title,
        originalTitle: result.original_title || result.original_name,
        releaseDate,
        overview: result.overview,
        posterUrl: this.getImageUrl(result.poster_path, POSTER_SIZE),
        mediaType,
      };
    });
  }

  /**
   * Get full metadata for a movie or TV show
   */
  async getMetadata(
    externalId: string,
    mediaType: MediaType,
    options?: {
      language?: string;
    }
  ): Promise<MediaMetadata | null> {
    this.validateMediaType(mediaType);

    if (mediaType === MediaType.MOVIE) {
      return this.getMovieMetadata(externalId, options);
    } else {
      return this.getTVShowMetadata(externalId, options);
    }
  }

  /**
   * Get movie metadata
   */
  private async getMovieMetadata(
    externalId: string,
    options?: {
      language?: string;
    }
  ): Promise<MediaMetadata | null> {
    const movie = await this.request<TMDBMovie>(`/movie/${externalId}`, {
      language: options?.language || "en-US",
      append_to_response: "credits,videos",
    });

    if (!movie) {
      return null;
    }

    // Find official trailer
    const trailer = movie.videos?.results?.find(
      (v) =>
        v.type === "Trailer" && v.site === "YouTube" && (v.official ?? true)
    );

    const trailerUrl = trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : undefined;

    // Get director from crew
    const director = movie.credits?.crew?.find(
      (c) => c.job === "Director"
    )?.name;

    // Parse cast and crew
    const cast = this.parseCast(movie.credits?.cast);
    const crew = this.parseCrew(movie.credits?.crew);

    // Build external IDs
    const externalIds: Array<{ source: ExternalIdSource; id: string }> = [
      { source: ExternalIdSource.TMDB, id: String(movie.id) },
    ];
    if (movie.imdb_id) {
      externalIds.push({
        source: ExternalIdSource.IMDB as ExternalIdSource,
        id: movie.imdb_id,
      });
    }

    return {
      title: movie.title,
      originalTitle: movie.original_title,
      description: movie.overview,
      releaseDate: movie.release_date
        ? new Date(movie.release_date)
        : undefined,
      rating: movie.vote_average,
      posterUrl: this.getImageUrl(movie.poster_path, POSTER_SIZE),
      backdropUrl: this.getImageUrl(movie.backdrop_path, BACKDROP_SIZE),
      genres: movie.genres?.map((g) => g.name),
      movie: {
        duration: movie.runtime,
        director,
        trailerUrl,
      },
      cast,
      crew,
      externalIds,
    };
  }

  /**
   * Get TV show metadata
   */
  private async getTVShowMetadata(
    externalId: string,
    options?: {
      language?: string;
    }
  ): Promise<MediaMetadata | null> {
    const show = await this.request<TMDBTVShow>(`/tv/${externalId}`, {
      language: options?.language || "en-US",
      append_to_response: "credits,external_ids",
    });

    if (!show) {
      return null;
    }

    // Parse cast and crew
    const cast = this.parseCast(show.credits?.cast);
    const crew = this.parseCrew(show.credits?.crew);

    // Build external IDs
    const externalIds: Array<{ source: ExternalIdSource; id: string }> = [
      { source: ExternalIdSource.TMDB, id: String(show.id) },
    ];
    if (show.external_ids?.imdb_id) {
      externalIds.push({
        source: ExternalIdSource.IMDB as ExternalIdSource,
        id: show.external_ids.imdb_id,
      });
    }
    if (show.external_ids?.tvdb_id) {
      externalIds.push({
        source: ExternalIdSource.TVDB as ExternalIdSource,
        id: String(show.external_ids.tvdb_id),
      });
    }

    return {
      title: show.name,
      originalTitle: show.original_name,
      description: show.overview,
      releaseDate: show.first_air_date
        ? new Date(show.first_air_date)
        : undefined,
      rating: show.vote_average,
      posterUrl: this.getImageUrl(show.poster_path, POSTER_SIZE),
      backdropUrl: this.getImageUrl(show.backdrop_path, BACKDROP_SIZE),
      genres: show.genres?.map((g) => g.name),
      tvShow: {
        creator: show.created_by?.[0]?.name,
        network: show.networks?.[0]?.name,
        numberOfSeasons: show.number_of_seasons,
        numberOfEpisodes: show.number_of_episodes,
      },
      cast,
      crew,
      externalIds,
    };
  }

  /**
   * Get season metadata
   */
  async getSeasonMetadata(
    showExternalId: string,
    seasonNumber: number,
    options?: {
      language?: string;
    }
  ): Promise<SeasonMetadata | null> {
    const season = await this.request<TMDBSeason>(
      `/tv/${showExternalId}/season/${seasonNumber}`,
      {
        language: options?.language || "en-US",
      }
    );

    if (!season) {
      return null;
    }

    return {
      number: season.season_number,
      name: season.name,
      overview: season.overview,
      airDate: season.air_date ? new Date(season.air_date) : undefined,
      episodeCount: season.episode_count,
      posterUrl: this.getImageUrl(season.poster_path, POSTER_SIZE),
    };
  }

  /**
   * Get episode metadata
   */
  async getEpisodeMetadata(
    showExternalId: string,
    seasonNumber: number,
    episodeNumber: number,
    options?: {
      language?: string;
    }
  ): Promise<EpisodeMetadata | null> {
    const episode = await this.request<TMDBEpisode>(
      `/tv/${showExternalId}/season/${seasonNumber}/episode/${episodeNumber}`,
      {
        language: options?.language || "en-US",
      }
    );

    if (!episode) {
      return null;
    }

    return {
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      title: episode.name,
      overview: episode.overview,
      airDate: episode.air_date ? new Date(episode.air_date) : undefined,
      duration: episode.runtime,
      stillUrl: this.getImageUrl(episode.still_path, STILL_SIZE),
    };
  }

  /**
   * Parse cast from TMDB format
   */
  private parseCast(cast?: TMDBCast[]): PersonMetadata[] {
    if (!cast) return [];

    return cast
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .slice(0, 20) // Limit to top 20 cast members
      .map((c) => ({
        name: c.name,
        role: "actor",
        character: c.character,
        profileUrl: this.getImageUrl(c.profile_path, PROFILE_SIZE),
      }));
  }

  /**
   * Parse crew from TMDB format
   */
  private parseCrew(crew?: TMDBCrew[]): PersonMetadata[] {
    if (!crew) return [];

    // Filter for important crew roles
    const importantJobs = [
      "Director",
      "Writer",
      "Screenplay",
      "Producer",
      "Executive Producer",
      "Director of Photography",
      "Original Music Composer",
    ];

    return crew
      .filter((c) => importantJobs.includes(c.job))
      .slice(0, 15) // Limit crew members
      .map((c) => ({
        name: c.name,
        role: c.job.toLowerCase().replace(/ /g, "_"),
        profileUrl: this.getImageUrl(c.profile_path, PROFILE_SIZE),
      }));
  }
}

// Export singleton instance
export const tmdbProvider = new TMDBProvider();
