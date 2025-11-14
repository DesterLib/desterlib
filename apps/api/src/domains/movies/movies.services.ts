import prisma from "@/lib/database/prisma";
import { MoviesListResponse, MovieResponse } from "./movies.types";
import { serializeBigInt, NotFoundError, logger } from "@/lib/utils";
import { enrichMediaWithColors, enrichMediaArrayWithColors } from "../scan/helpers";

export const moviesServices = {
  getMovies: async (): Promise<MoviesListResponse> => {
    logger.info("📽️  Fetching movies list...");
    
    const movies = await prisma.movie.findMany({
      include: {
        media: true,
      },
      orderBy: {
        media: {
          createdAt: 'desc', // Most recent first
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
    
    logger.info(`Found movie: "${movie.media.title}", enriching with colors...`);
    
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
