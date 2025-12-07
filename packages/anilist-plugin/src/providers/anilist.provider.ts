import axios, { AxiosInstance } from "axios";
import { Logger } from "@dester/logger";
import { RateLimiter } from "../rate-limiter";
import { MetadataProvider, MovieMetadata } from "./metadata-provider.interface";

/**
 * AniList GraphQL Types
 */
interface AniListMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  averageScore: number | null;
  coverImage: {
    large: string | null;
    extraLarge: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  format: string; // ANIME, MANGA, etc.
  type: string; // ANIME, MANGA
}

interface AniListPage {
  media: AniListMedia[];
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
}

interface AniListResponse {
  data: {
    Page: AniListPage;
    Media?: AniListMedia;
  };
}

/**
 * AniList metadata provider
 * Uses GraphQL API to fetch anime and manga metadata
 */
export class AniListProvider implements MetadataProvider {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private logger: Logger;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second
  private baseUrl: string = "https://graphql.anilist.co";

  constructor(rateLimiter: RateLimiter, logger: Logger) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.rateLimiter = rateLimiter;
    this.logger = logger;
  }

  getProviderName(): string {
    return "anilist";
  }

  isAvailable(): boolean {
    // AniList doesn't require API keys for basic queries
    return true;
  }

  /**
   * Search for anime by title
   */
  async searchAnime(
    title: string,
    year?: number
  ): Promise<MovieMetadata | null> {
    await this.rateLimiter.acquire();

    const query = `
      query ($search: String, $type: MediaType) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: $type) {
            id
            title {
              romaji
              english
              native
            }
            description
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            averageScore
            coverImage {
              large
              extraLarge
            }
            bannerImage
            genres
            format
            type
          }
        }
      }
    `;

    const variables: any = {
      search: title,
      type: "ANIME",
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.post<AniListResponse>("", {
          query,
          variables,
        });

        if (response.data.data.Page.media.length === 0) {
          this.logger.warn({ title, year }, "No AniList results found");
          return null;
        }

        // Filter by year if provided, otherwise use first result
        let anime = response.data.data.Page.media[0];
        if (year) {
          const yearMatch = response.data.data.Page.media.find(
            (m) => m.startDate.year === year
          );
          if (yearMatch) {
            anime = yearMatch;
          }
        }

        // Fetch full details for better image quality
        return await this.getAnimeDetails(anime.id);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const delay = this.baseRetryDelay * Math.pow(2, attempt);

        this.logger.warn(
          {
            error: lastError.message,
            attempt: attempt + 1,
            title,
          },
          "AniList search failed, retrying..."
        );

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      { error: lastError, title },
      "AniList search failed after retries"
    );
    throw lastError || new Error("AniList search failed");
  }

  /**
   * Get detailed anime information by ID
   */
  async getAnimeDetails(animeId: number): Promise<MovieMetadata> {
    await this.rateLimiter.acquire();

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          averageScore
          coverImage {
            large
            extraLarge
          }
          bannerImage
          genres
          format
          type
        }
      }
    `;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.post<AniListResponse>("", {
          query,
          variables: { id: animeId },
        });

        if (!response.data.data.Media) {
          throw new Error("Anime not found");
        }

        return this.mapAniListToMetadata(response.data.data.Media);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const delay = this.baseRetryDelay * Math.pow(2, attempt);

        this.logger.warn(
          {
            error: lastError.message,
            attempt: attempt + 1,
            animeId,
          },
          "AniList getAnimeDetails failed, retrying..."
        );

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      { error: lastError, animeId },
      "AniList getAnimeDetails failed after retries"
    );
    throw lastError || new Error("AniList getAnimeDetails failed");
  }

  /**
   * Map AniList anime data to standardized metadata format
   */
  private mapAniListToMetadata(anime: AniListMedia): MovieMetadata {
    // Prefer English title, fallback to romaji, then native
    const title =
      anime.title.english || anime.title.romaji || anime.title.native || "";

    // Format description (remove HTML tags)
    const description = anime.description
      ? anime.description.replace(/<[^>]*>/g, "").trim()
      : null;

    // Format release date (ISO format)
    let releaseDate: string | null = null;
    if (anime.startDate.year) {
      const month = anime.startDate.month || 1;
      const day = anime.startDate.day || 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      releaseDate = `${anime.startDate.year}-${monthStr}-${dayStr}`;
    }

    // Convert averageScore (0-100) to rating (0-10)
    const rating = anime.averageScore ? anime.averageScore / 10 : null;

    // Use extraLarge cover image as poster, large as fallback
    const posterUrl =
      anime.coverImage.extraLarge || anime.coverImage.large || null;

    // AniList doesn't have null posters/backdrops like TMDB
    // Use the same image for both
    const nullPosterUrl = posterUrl;

    // Use banner image as backdrop
    const backdropUrl = anime.bannerImage || null;
    const nullBackdropUrl = backdropUrl;

    // AniList doesn't provide logos
    const logoUrl = null;

    return {
      providerId: anime.id.toString(),
      title,
      overview: description,
      releaseDate,
      rating,
      posterUrl,
      nullPosterUrl,
      backdropUrl,
      nullBackdropUrl,
      logoUrl,
      genres: anime.genres || [],
    };
  }
}
