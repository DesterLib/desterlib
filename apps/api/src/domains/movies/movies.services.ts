import prisma from "@/lib/database/prisma";
import { MoviesListResponse, MovieResponse } from "./movies.types";
import { serializeBigInt, NotFoundError } from "@/lib/utils";

export const moviesServices = {
  getMovies: async (): Promise<MoviesListResponse> => {
    const movies = await prisma.movie.findMany({
      include: {
        media: true,
      },
    });
    return serializeBigInt(movies) as MoviesListResponse;
  },

  getMovieById: async (
    id: string
  ): Promise<MovieResponse & { streamUrl: string }> => {
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        media: true,
      },
    });
    if (!movie) {
      throw new NotFoundError("Movie", id);
    }
    const serialized = serializeBigInt(movie) as MovieResponse;
    return {
      ...serialized,
      streamUrl: `/api/v1/stream/${id}`,
    };
  },
};
