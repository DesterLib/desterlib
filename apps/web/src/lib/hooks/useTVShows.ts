import { useQuery } from "@tanstack/react-query";
import {
  getApiTvShows,
  getApiTvShowsId,
  type GetApiTvShowsParams,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

export const useTVShows = (filters?: GetApiTvShowsParams) => {
  return useQuery({
    queryKey: ["tv-shows", filters],
    queryFn: async () => {
      const response = await getApiTvShows(filters);
      return response.data;
    },
  });
};

export const useTVShow = (id: string) => {
  return useQuery({
    queryKey: ["tv-shows", id],
    queryFn: async () => {
      const response = await getApiTvShowsId(id);
      return response.data;
    },
    enabled: !!id,
  });
};
