import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MediaFilters } from "@dester/api-client";

export const useMovies = (filters?: Omit<MediaFilters, "type">) => {
  return useQuery({
    queryKey: ["movies", filters],
    queryFn: () => apiClient.movies.list(filters),
  });
};

export const useMovie = (id: string) => {
  return useQuery({
    queryKey: ["movies", id],
    queryFn: () => apiClient.movies.getById(id),
    enabled: !!id,
  });
};
