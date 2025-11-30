import { prisma } from "../../infrastructure/prisma";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../infrastructure/utils/errors";
import { serializeBigInt } from "../../infrastructure/utils/serialization";
import {
  enrichMediaWithColors,
  enrichMediaArrayWithColors,
} from "../../infrastructure/utils/media-enrichment";
import type {
  MoviesListResponse,
  MovieResponse,
} from "../../domain/entities/movies/movie.entity";

export const moviesService = {
  getMovies: async (): Promise<MoviesListResponse> => {
    logger.info("📽️  Fetching movies list...");

    const movies = await prisma.movie.findMany({
      include: {
        media: true,
      },
      orderBy: {
        media: {
          createdAt: "desc",
        },
      },
      take: 10, // Limit to 10 most recent
    });

    logger.info(`Found ${movies.length} movies, enriching with colors...`);

    // Enrich with mesh gradient colors on-demand
    const enrichedMovies = await enrichMediaArrayWithColors(
      movies.map((m) => m.media)
    );

    // Map back to movie structure
    const moviesWithColors = movies.map((movie, index) => ({
      ...movie,
      media: enrichedMovies[index],
    }));

    return serializeBigInt(moviesWithColors) as MoviesListResponse;
  },

  getMovieById: async (
    id: string
  ): Promise<MovieResponse & { streamUrl: string }> => {
    logger.info(`📽️  Fetching movie by ID: ${id}`);

    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        media: true,
      },
    });

    if (!movie) {
      throw new NotFoundError("Movie", id);
    }

    logger.info(
      `Found movie: "${movie.media.title}", enriching with colors...`
    );

    // Enrich with mesh gradient colors on-demand
    const enrichedMedia = await enrichMediaWithColors(movie.media);
    const movieWithColors = {
      ...movie,
      media: enrichedMedia,
    };

    const serialized = serializeBigInt(movieWithColors) as MovieResponse;
    return {
      ...serialized,
      streamUrl: `/api/v1/stream/${id}`,
    };
  },
};
