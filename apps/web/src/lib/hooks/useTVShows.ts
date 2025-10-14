import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MediaFilters } from "@dester/api-client";

export const useTVShows = (filters?: Omit<MediaFilters, "type">) => {
  return useQuery({
    queryKey: ["tv-shows", filters],
    queryFn: () => apiClient.tvShows.list(filters),
  });
};

export const useTVShow = (id: string) => {
  return useQuery({
    queryKey: ["tv-shows", id],
    queryFn: () => apiClient.tvShows.getById(id),
    enabled: !!id,
  });
};
