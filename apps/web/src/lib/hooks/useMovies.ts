import { useQuery } from "@tanstack/react-query";
import {
  getApiV1Movies,
  getApiV1MoviesId,
  type GetApiV1MoviesParams,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

const emptyMoviesData = {
  media: [],
  pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
};

export const useMovies = (filters?: GetApiV1MoviesParams) => {
  return useQuery({
    queryKey: ["movies", filters],
    queryFn: async () => {
      try {
        const response = await getApiV1Movies(filters);
        if (response.status === 200) {
          return response.data.data ?? emptyMoviesData;
        }
        return emptyMoviesData;
      } catch (error) {
        // If offline, let React Query handle it with cached data
        // Otherwise, log the error for debugging
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error fetching movies:", error);
        }
        throw error;
      }
    },
    placeholderData: emptyMoviesData, // Show empty state while loading
  });
};

export const useMovie = (id: string) => {
  return useQuery({
    queryKey: ["movies", id],
    queryFn: async () => {
      try {
        const response = await getApiV1MoviesId(id);
        if (response.status === 200) {
          return response.data.data?.media ?? null;
        }
        return null;
      } catch (error) {
        // If offline, let React Query handle it with cached data
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error fetching movie:", error);
        }
        throw error;
      }
    },
    enabled: !!id,
    placeholderData: null,
  });
};
