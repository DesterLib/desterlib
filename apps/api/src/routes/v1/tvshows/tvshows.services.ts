import prisma from "@/lib/database/prisma";
import { TVShowsListResponse, TVShowResponse } from "./tvshows.types";
import { serializeBigInt } from "@/lib/utils";

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
      throw new Error(`TV Show with ID ${id} not found`);
    }
    return serializeBigInt(tvshow) as TVShowResponse;
  },
};
