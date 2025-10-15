import type { MediaType } from "../../generated/prisma/index.js";
import { NotFoundError, BadRequestError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

const API_BASE_URL = `http://localhost:${env.PORT}`;

export interface MediaFilters {
  type?: MediaType;
  search?: string;
  genreId?: string;
  personId?: string;
  collectionId?: string;
  minRating?: number;
  maxRating?: number;
  releasedAfter?: Date;
  releasedBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: "title" | "releaseDate" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export class MediaService {
  /**
   * Get all media with optional filters
   */
  async getMedia(filters: MediaFilters = {}) {
    const {
      type,
      search,
      genreId,
      personId,
      collectionId,
      minRating,
      maxRating,
      releasedAfter,
      releasedBefore,
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) where.rating.gte = minRating;
      if (maxRating !== undefined) where.rating.lte = maxRating;
    }

    if (releasedAfter || releasedBefore) {
      where.releaseDate = {};
      if (releasedAfter) where.releaseDate.gte = releasedAfter;
      if (releasedBefore) where.releaseDate.lte = releasedBefore;
    }

    if (genreId) {
      where.genres = {
        some: { genreId },
      };
    }

    if (personId) {
      where.people = {
        some: { personId },
      };
    }

    if (collectionId) {
      where.collections = {
        some: { collectionId },
      };
    }

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }
    if (offset < 0) {
      throw new BadRequestError("Offset must be non-negative");
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          people: {
            include: {
              person: true,
            },
          },
          collections: {
            include: {
              collection: true,
            },
          },
          externalIds: true,
          movie: {
            select: {
              id: true,
              duration: true,
              director: true,
              trailerUrl: true,
              filePath: true,
              mediaId: true,
            },
          },
          tvShow: {
            include: {
              seasons: {
                include: {
                  episodes: {
                    select: {
                      id: true,
                      title: true,
                      number: true,
                      duration: true,
                      airDate: true,
                      filePath: true,
                      seasonId: true,
                    },
                  },
                },
                orderBy: { number: "asc" },
              },
            },
          },
          music: {
            select: {
              id: true,
              artist: true,
              album: true,
              genre: true,
              duration: true,
              filePath: true,
              mediaId: true,
            },
          },
          comic: {
            select: {
              id: true,
              issue: true,
              volume: true,
              publisher: true,
              pages: true,
              filePath: true,
              mediaId: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.media.count({ where }),
    ]);

    return {
      media: this.addStreamingUrlsToArray(media),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get a single media by ID
   */
  async getMediaById(id: string) {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        people: {
          include: {
            person: true,
          },
        },
        collections: {
          include: {
            collection: true,
          },
        },
        externalIds: true,
        movie: true,
        tvShow: {
          include: {
            seasons: {
              include: {
                episodes: {
                  select: {
                    id: true,
                    title: true,
                    number: true,
                    duration: true,
                    airDate: true,
                    filePath: true,
                    seasonId: true,
                  },
                },
              },
              orderBy: { number: "asc" },
            },
          },
        },
        music: true,
        comic: true,
      },
    });

    if (!media) {
      throw new NotFoundError(`Media with ID ${id} not found`);
    }

    return this.addStreamingUrls(media);
  }

  /**
   * Get all movies
   */
  async getMovies(filters: Omit<MediaFilters, "type"> = {}) {
    return this.getMedia({ ...filters, type: "MOVIE" });
  }

  /**
   * Get a single movie by ID
   */
  async getMovieById(id: string) {
    const media = await this.getMediaById(id);

    if (media.type !== "MOVIE") {
      throw new BadRequestError(`Media with ID ${id} is not a movie`);
    }

    return media;
  }

  /**
   * Get all TV shows
   */
  async getTVShows(filters: Omit<MediaFilters, "type"> = {}) {
    return this.getMedia({ ...filters, type: "TV_SHOW" });
  }

  /**
   * Get a single TV show by ID
   */
  async getTVShowById(id: string) {
    const media = await this.getMediaById(id);

    if (media.type !== "TV_SHOW") {
      throw new BadRequestError(`Media with ID ${id} is not a TV show`);
    }

    return media;
  }

  /**
   * Get a specific season of a TV show
   */
  async getSeasonById(tvShowId: string, seasonNumber: number) {
    const tvShow = await this.getTVShowById(tvShowId);

    const season = tvShow.tvShow?.seasons.find(
      (s: any) => s.number === seasonNumber
    );

    if (!season) {
      throw new NotFoundError(
        `Season ${seasonNumber} not found for TV show ${tvShowId}`
      );
    }

    return season;
  }

  /**
   * Get a specific episode of a TV show
   */
  async getEpisodeById(
    tvShowId: string,
    seasonNumber: number,
    episodeNumber: number
  ) {
    const season = await this.getSeasonById(tvShowId, seasonNumber);

    const episode = season.episodes.find(
      (e: any) => e.number === episodeNumber
    );

    if (!episode) {
      throw new NotFoundError(
        `Episode ${episodeNumber} not found in season ${seasonNumber} of TV show ${tvShowId}`
      );
    }

    return episode;
  }

  /**
   * Get all music
   */
  async getMusic(filters: Omit<MediaFilters, "type"> = {}) {
    return this.getMedia({ ...filters, type: "MUSIC" });
  }

  /**
   * Get a single music by ID
   */
  async getMusicById(id: string) {
    const media = await this.getMediaById(id);

    if (media.type !== "MUSIC") {
      throw new BadRequestError(`Media with ID ${id} is not music`);
    }

    return media;
  }

  /**
   * Get all comics
   */
  async getComics(filters: Omit<MediaFilters, "type"> = {}) {
    return this.getMedia({ ...filters, type: "COMIC" });
  }

  /**
   * Get a single comic by ID
   */
  async getComicById(id: string) {
    const media = await this.getMediaById(id);

    if (media.type !== "COMIC") {
      throw new BadRequestError(`Media with ID ${id} is not a comic`);
    }

    return media;
  }

  /**
   * Get media statistics
   */
  async getStatistics() {
    const [totalMedia, movieCount, tvShowCount, musicCount, comicCount] =
      await Promise.all([
        prisma.media.count(),
        prisma.media.count({ where: { type: "MOVIE" } }),
        prisma.media.count({ where: { type: "TV_SHOW" } }),
        prisma.media.count({ where: { type: "MUSIC" } }),
        prisma.media.count({ where: { type: "COMIC" } }),
      ]);

    return {
      total: totalMedia,
      byType: {
        movies: movieCount,
        tvShows: tvShowCount,
        music: musicCount,
        comics: comicCount,
      },
    };
  }

  /**
   * Add streaming URLs to media object
   */
  private addStreamingUrls(media: any): any {
    if (!media) return media;

    // Add streaming URL for movies
    if (media.movie && media.movie.filePath) {
      media.movie.streamUrl = `${API_BASE_URL}/api/media/stream/movie/${media.id}`;
    }

    // Add streaming URLs for TV show episodes
    if (media.tvShow?.seasons) {
      for (const season of media.tvShow.seasons) {
        if (season.episodes) {
          for (const episode of season.episodes) {
            if (episode.filePath) {
              episode.streamUrl = `${API_BASE_URL}/api/media/stream/episode/${media.id}/${season.number}/${episode.number}`;
            }
          }
        }
      }
    }

    return media;
  }

  /**
   * Add streaming URLs to an array of media objects
   */
  private addStreamingUrlsToArray(mediaArray: any[]): any[] {
    return mediaArray.map((media) => this.addStreamingUrls(media));
  }
}

// Export singleton instance
export const mediaService = new MediaService();
