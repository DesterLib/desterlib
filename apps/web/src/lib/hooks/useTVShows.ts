import { useQuery } from "@tanstack/react-query";
import {
  getApiV1TvShows,
  getApiV1TvShowsId,
  type GetApiV1TvShowsParams,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

const emptyTVShowsData = {
  media: [],
  pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
};

export const useTVShows = (filters?: GetApiV1TvShowsParams) => {
  return useQuery({
    queryKey: ["tv-shows", filters],
    queryFn: async () => {
      try {
        const response = await getApiV1TvShows(filters);
        if (response.status === 200) {
          return response.data.data ?? emptyTVShowsData;
        }
        return emptyTVShowsData;
      } catch (error) {
        // If offline, let React Query handle it with cached data
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error fetching TV shows:", error);
        }
        throw error;
      }
    },
    placeholderData: emptyTVShowsData,
  });
};

export const useTVShow = (id: string) => {
  return useQuery({
    queryKey: ["tv-shows", id],
    queryFn: async () => {
      try {
        const response = await getApiV1TvShowsId(id);
        if (response.status === 200) {
          return response.data.data?.media ?? null;
        }
        return null;
      } catch (error) {
        // If offline, let React Query handle it with cached data
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error fetching TV show:", error);
        }
        throw error;
      }
    },
    enabled: !!id,
    placeholderData: null,
  });
};
