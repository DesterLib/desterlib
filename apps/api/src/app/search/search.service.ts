import { prisma } from "../../infrastructure/prisma";
import { serializeBigInt } from "../../infrastructure/utils/serialization";

export const searchService = {
  /**
   * Search for media (movies and TV shows) by title
   */
  searchMedia: async (query: string, baseUrl: string) => {
    // Total limit across all media types
    const TOTAL_LIMIT = 10;

    // Fetch more than needed to ensure we get a good mix
    const FETCH_LIMIT = 20;

    // Search movies and TV shows directly
    const [movies, tvShows] = await Promise.all([
      // Search for movies
      prisma.movie.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          mediaItems: true,
          genres: true,
        },
        orderBy: {
          title: "asc",
        },
        take: FETCH_LIMIT,
      }),
      // Search for TV shows
      prisma.tVShow.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          genres: true,
        },
        orderBy: {
          title: "asc",
        },
        take: FETCH_LIMIT,
      }),
    ]);

    // Format results and convert BigInt to string for JSON serialization
    const formattedMovies = movies.map((movie) => {
      return {
        ...movie,
        mediaItems: movie.mediaItems.map((item) => ({
          ...item,
          fileSize: item.fileSize?.toString() ?? null,
        })),
      };
    });

    const formattedTvShows = tvShows.map((tvShow) => {
      return {
        ...tvShow,
      };
    });

    // Interleave movies and TV shows, then limit to TOTAL_LIMIT
    const combined = [];
    const maxLength = Math.max(formattedMovies.length, formattedTvShows.length);

    for (let i = 0; i < maxLength && combined.length < TOTAL_LIMIT; i++) {
      if (i < formattedMovies.length && combined.length < TOTAL_LIMIT) {
        combined.push({ type: "movie", data: formattedMovies[i] });
      }
      if (i < formattedTvShows.length && combined.length < TOTAL_LIMIT) {
        combined.push({ type: "tvShow", data: formattedTvShows[i] });
      }
    }

    // Separate back into movies and TV shows
    const finalMovies = combined
      .filter((item) => item.type === "movie")
      .map((item) => item.data);
    const finalTvShows = combined
      .filter((item) => item.type === "tvShow")
      .map((item) => item.data);

    return serializeBigInt(
      {
        movies: finalMovies,
        tvShows: finalTvShows,
      },
      baseUrl
    );
  },
};
