import { useQuery } from "@tanstack/react-query";
import {
  getApiV1Movies,
  getApiV1MoviesId,
  type GetApiV1MoviesParams,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

export const useMovies = (filters?: GetApiV1MoviesParams) => {
  return useQuery({
    queryKey: ["movies", filters],
    queryFn: async () => {
      const response = await getApiV1Movies(filters);
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

export const useMovie = (id: string) => {
  return useQuery({
    queryKey: ["movies", id],
    queryFn: async () => {
      const response = await getApiV1MoviesId(id);
      if (response.status === 200) {
        return response.data.data?.media ?? null;
      }
      return null;
    },
    enabled: !!id,
  });
};
