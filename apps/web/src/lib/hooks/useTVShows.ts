import { useQuery } from "@tanstack/react-query";
import {
  getApiV1TvShows,
  getApiV1TvShowsId,
  type GetApiV1TvShowsParams,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

export const useTVShows = (filters?: GetApiV1TvShowsParams) => {
  return useQuery({
    queryKey: ["tv-shows", filters],
    queryFn: async () => {
      const response = await getApiV1TvShows(filters);
      if (response.status === 200) {
        return (
          response.data.data ?? {
            media: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
          }
        );
      }
      return {
        media: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      };
    },
  });
};

export const useTVShow = (id: string) => {
  return useQuery({
    queryKey: ["tv-shows", id],
    queryFn: async () => {
      const response = await getApiV1TvShowsId(id);
      if (response.status === 200) {
        return response.data.data?.media ?? null;
      }
      return null;
    },
    enabled: !!id,
  });
};
