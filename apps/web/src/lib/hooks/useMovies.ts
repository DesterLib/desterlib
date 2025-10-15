import { useQuery } from "@tanstack/react-query";
import {
  getApiMovies,
  getApiMoviesId,
  type GetApiMoviesParams,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

export const useMovies = (filters?: GetApiMoviesParams) => {
  return useQuery({
    queryKey: ["movies", filters],
    queryFn: async () => {
      const response = await getApiMovies(filters);
      return response.data;
    },
  });
};

export const useMovie = (id: string) => {
  return useQuery({
    queryKey: ["movies", id],
    queryFn: async () => {
      const response = await getApiMoviesId(id);
      return response.data;
    },
    enabled: !!id,
  });
};
