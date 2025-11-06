import prisma from "@/lib/database/prisma";
import { TVShowsListResponse, TVShowResponse } from "./tvshows.types";
import { serializeBigInt, NotFoundError } from "@/lib/utils";

export const tvshowsServices = {
  getTVShows: async (): Promise<TVShowsListResponse> => {
    const tvshows = await prisma.tVShow.findMany({
      include: {
        media: true,
      },
    });
    return serializeBigInt(tvshows) as TVShowsListResponse;
  },

  getTVShowById: async (id: string): Promise<TVShowResponse> => {
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
    const serialized = serializeBigInt(tvshow) as any;

    // Transform seasons and episodes to match API schema
    const seasonsWithTransformedData = serialized.seasons.map((season: any) => ({
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
    }));

    return {
      ...serialized,
      seasons: seasonsWithTransformedData,
    };
  },
};
