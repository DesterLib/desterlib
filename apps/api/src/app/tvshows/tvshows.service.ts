import { prisma } from "../../infrastructure/prisma";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../infrastructure/utils/errors";
import { serializeBigInt } from "../../infrastructure/utils/serialization";
import {
  enrichMediaWithColors,
  enrichMediaArrayWithColors,
} from "../../infrastructure/utils/media-enrichment";
import type {
  TVShowsListResponse,
  TVShowResponse,
} from "../../domain/entities/tvshows/tvshow.entity";

export const tvshowsService = {
  getTVShows: async (): Promise<TVShowsListResponse> => {
    logger.info("📺 Fetching TV shows list...");

    const tvshows = await prisma.tVShow.findMany({
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

    logger.info(`Found ${tvshows.length} TV shows, enriching with colors...`);

    // Enrich with mesh gradient colors on-demand
    const enrichedMedia = await enrichMediaArrayWithColors(
      tvshows.map((tv) => tv.media)
    );

    // Map back to tvshow structure
    const tvshowsWithColors = tvshows.map((tvshow, index) => ({
      ...tvshow,
      media: enrichedMedia[index],
    }));

    return serializeBigInt(tvshowsWithColors) as TVShowsListResponse;
  },

  getTVShowById: async (id: string): Promise<TVShowResponse> => {
    logger.info(`📺 Fetching TV show by ID: ${id}`);

    const tvshow = await prisma.tVShow.findUnique({
      where: { id },
      include: {
        media: true,
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
    });

    if (!tvshow) {
      throw new NotFoundError("TV Show", id);
    }

    logger.info(
      `Found TV show: "${tvshow.media.title}", enriching with colors...`
    );

    // Enrich with mesh gradient colors on-demand
    const enrichedMedia = await enrichMediaWithColors(tvshow.media);
    const tvshowWithColors = {
      ...tvshow,
      media: enrichedMedia,
    };

    const serialized = serializeBigInt(tvshowWithColors) as any;

    // Transform seasons and episodes to match API schema
    const seasonsWithTransformedData = serialized.seasons.map(
      (season: any) => ({
        id: season.id,
        seasonNumber: season.number,
        name: `Season ${season.number}`,
        overview: null,
        airDate: null,
        posterUrl: season.posterUrl,
        tvShowId: season.tvShowId,
        episodes: season.episodes.map((episode: any) => ({
          id: episode.id,
          episodeNumber: episode.number,
          seasonNumber: season.number,
          title: episode.title,
          overview: null,
          airDate: episode.airDate,
          runtime: episode.duration,
          stillUrl: episode.stillPath,
          filePath: episode.filePath,
          fileSize: episode.fileSize,
          seasonId: episode.seasonId,
          streamUrl: `/api/v1/stream/${episode.id}`,
        })),
      })
    );

    return {
      ...serialized,
      seasons: seasonsWithTransformedData,
    };
  },
};
