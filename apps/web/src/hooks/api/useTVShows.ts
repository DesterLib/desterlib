import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";
import type { TVShowsListResponse, TVShowResponse } from "@/types/api";

export const useTVShows = () => {
  return useQuery<TVShowsListResponse>({
    queryKey: ["tv-shows"],
    queryFn: async () => {
      const response =
        await axiosClient.get<TVShowsListResponse>("/api/v1/tvshows");
      return response.data;
    },
  });
};

export const useTVShowById = (id: string) => {
  return useQuery<TVShowResponse>({
    queryKey: ["tv-shows", id],
    queryFn: async () => {
      const response = await axiosClient.get<TVShowResponse>(
        `/api/v1/tvshows/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};
