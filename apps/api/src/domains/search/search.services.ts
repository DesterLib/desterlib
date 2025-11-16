import { prisma } from "../../lib/database";

export const searchServices = {
  /**
   * Search for media (movies and TV shows) by title
   */
  searchMedia: async (query: string) => {
    // Total limit across all media types
    const TOTAL_LIMIT = 10;

    // Fetch more than needed to ensure we get a good mix
    const FETCH_LIMIT = 20;

    // Search the Media table directly by title and filter by type
    const [movies, tvShows] = await Promise.all([
      // Search for movies
      prisma.media.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
          type: "MOVIE",
        },
        include: {
          movie: true,
        },
        orderBy: {
          title: "asc",
        },
        take: FETCH_LIMIT,
      }),
      // Search for TV shows
      prisma.media.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
          type: "TV_SHOW",
        },
        include: {
          tvShow: true,
        },
        orderBy: {
          title: "asc",
        },
        take: FETCH_LIMIT,
      }),
    ]);

    // Format results and convert BigInt to string for JSON serialization
    const formattedMovies = movies
      .filter((media) => media.movie !== null)
      .map((media) => ({
        ...media.movie,
        fileSize: media.movie!.fileSize?.toString() ?? null,
        media: {
          id: media.id,
          title: media.title,
          type: media.type,
          description: media.description,
          posterUrl: media.posterUrl,
          backdropUrl: media.backdropUrl,
          meshGradientColors: media.meshGradientColors,
          releaseDate: media.releaseDate,
          rating: media.rating,
          createdAt: media.createdAt,
          updatedAt: media.updatedAt,
        },
      }));

    const formattedTvShows = tvShows
      .filter((media) => media.tvShow !== null)
      .map((media) => ({
        ...media.tvShow,
        media: {
          id: media.id,
          title: media.title,
          type: media.type,
          description: media.description,
          posterUrl: media.posterUrl,
          backdropUrl: media.backdropUrl,
          meshGradientColors: media.meshGradientColors,
          releaseDate: media.releaseDate,
          rating: media.rating,
          createdAt: media.createdAt,
          updatedAt: media.updatedAt,
        },
      }));

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

    return {
      movies: finalMovies,
      tvShows: finalTvShows,
    };
  },
};
