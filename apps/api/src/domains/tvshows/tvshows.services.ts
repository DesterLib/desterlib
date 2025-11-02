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
    const serialized = serializeBigInt(tvshow) as TVShowResponse;

    // Add streamUrl to each episode
    const seasonsWithStreamUrls = serialized.seasons.map((season) => ({
      ...season,
      episodes: season.episodes.map((episode) => ({
        ...episode,
        streamUrl: `/api/v1/stream/${episode.id}`,
      })),
    }));

    return {
      ...serialized,
      seasons: seasonsWithStreamUrls,
    };
  },
};
