import { prisma } from "../../infrastructure/prisma";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../infrastructure/utils/errors";
import { serializeBigInt } from "../../infrastructure/utils/serialization";
import type {
  MoviesListResponse,
  MovieResponse,
} from "../../domain/entities/movies/movie.entity";

export const moviesService = {
  getMovies: async (baseUrl: string): Promise<MoviesListResponse> => {
    logger.info("📽️  Fetching movies list...");

    // Fetch Movie metadata including associated files
    const movies = await prisma.movie.findMany({
      include: {
        mediaItems: true, // List of files associated with the movie
        genres: true, // Include genres
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 most recent
    });

    logger.info(`Found ${movies.length} movies`);

    // Map to response structure
    const moviesResponse = movies.map((movie) => ({
      ...movie,
      media: movie.mediaItems, // Map 'mediaItems' (files) to 'media' property
    }));

    return serializeBigInt(
      moviesResponse,
      baseUrl
    ) as unknown as MoviesListResponse;
  },

  getMovieById: async (
    id: string,
    baseUrl: string
  ): Promise<MovieResponse & { streamUrl?: string }> => {
    // Look up by Movie ID (metadata)
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        mediaItems: true, // List of files
        genres: true, // Include genres
      },
    });

    if (!movie) {
      throw new NotFoundError("Movie", id);
    }

    logger.info(`Found movie: "${movie.title}"`);

    // Map to response structure
    const movieWithFiles = {
      ...movie,
      media: movie.mediaItems, // Map files to 'media' property
    };

    const serialized = serializeBigInt(
      movieWithFiles,
      baseUrl
    ) as unknown as MovieResponse;

    // Add streamUrl using the first file's ID if available
    const firstFileId =
      movie.mediaItems && movie.mediaItems.length > 0
        ? movie.mediaItems[0]?.id
        : undefined;

    return {
      ...serialized,
      ...(firstFileId
        ? { streamUrl: `${baseUrl}/api/v1/stream/${firstFileId}` }
        : {}),
    };
  },
};
