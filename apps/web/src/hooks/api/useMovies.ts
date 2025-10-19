import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";
import type { MoviesListResponse, MovieResponse } from "@/types/api";

export const useMovies = () => {
  return useQuery<MoviesListResponse>({
    queryKey: ["movies"],
    queryFn: async () => {
      const response =
        await axiosClient.get<MoviesListResponse>("/api/v1/movies");
      return response.data;
    },
  });
};

export const useMovieById = (id: string) => {
  return useQuery<MovieResponse>({
    queryKey: ["movies", id],
    queryFn: async () => {
      const response = await axiosClient.get<MovieResponse>(
        `/api/v1/movies/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};
