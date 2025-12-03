import { prisma } from "../../infrastructure/prisma";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../infrastructure/utils/errors";
import { serializeBigInt } from "../../infrastructure/utils/serialization";
import type {
  TVShowsListResponse,
  TVShowResponse,
} from "../../domain/entities/tvshows/tvshow.entity";

export const tvshowsService = {
  getTVShows: async (baseUrl: string): Promise<TVShowsListResponse> => {
    logger.info("📺 Fetching TV shows list...");

    // Fetch TV Shows metadata
    const tvshows = await prisma.tVShow.findMany({
      include: {
        genres: true, // Include genres
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 most recent
    });

    logger.info(`Found ${tvshows.length} TV shows`);

    return serializeBigInt(tvshows, baseUrl) as unknown as TVShowsListResponse;
  },

  getTVShowById: async (
    id: string,
    baseUrl: string
  ): Promise<TVShowResponse> => {
    logger.info(`📺 Fetching TV show by ID: ${id}`);

    const tvshow = await prisma.tVShow.findUnique({
      where: { id },
      include: {
        genres: true, // Include genres
        seasons: {
          include: {
            episodes: {
              include: {
                mediaItems: true, // Files for episodes
              },
            },
          },
        },
      },
    });

    if (!tvshow) {
      throw new NotFoundError("TV Show", id);
    }

    logger.info(`Found TV show: "${tvshow.title}"`);

    const serialized = serializeBigInt(tvshow, baseUrl) as any;

    // Transform seasons and episodes to match API schema
    const seasonsWithTransformedData = serialized.seasons.map(
      (season: any) => ({
        id: season.id,
        seasonNumber: season.number,
        name: season.name || `Season ${season.number}`,
        overview: season.overview,
        airDate: season.airDate,
        posterUrl: season.posterUrl,
        tvShowId: season.tvShowId,
        episodes: season.episodes.map((episode: any) => {
          // Get file info from the first media item if available
          const mediaItem =
            episode.mediaItems && episode.mediaItems.length > 0
              ? episode.mediaItems[0]
              : null;

          return {
            id: episode.id,
            episodeNumber: episode.number,
            seasonNumber: season.number,
            title: episode.title,
            overview: episode.description,
            airDate: episode.airDate,
            runtime: mediaItem?.duration,
            stillUrl: episode.stillUrl,
            // File info from MediaItem
            filePath: mediaItem?.filePath,
            fileSize: mediaItem?.fileSize,
            seasonId: episode.seasonId,
            streamUrl: mediaItem
              ? `${baseUrl}/api/v1/stream/${mediaItem.id}`
              : null,
          };
        }),
      })
    );

    return {
      ...serialized,
      seasons: seasonsWithTransformedData,
    };
  },
};
