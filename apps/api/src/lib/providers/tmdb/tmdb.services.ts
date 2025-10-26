import axios from "axios";
import type { TmdbType } from "./tmdb.types";

export const tmdbServices = {
  get: async (
    id: string,
    type: TmdbType,
    {
      apiKey,
      lang = "en-US",
      abortSignal,
      extraParams,
    }: {
      apiKey: string;
      lang?: string;
      abortSignal?: AbortSignal;
      extraParams?: Record<string, string | number | boolean>;
    }
  ) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/${type}/${id}`,
        {
          signal: abortSignal,
          params: {
            api_key: apiKey,
            language: lang,
            ...extraParams,
          },
          timeout: 8000,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) throw new Error("Network error / no response");
        throw new Error(
          `TMDB ${type} ${id} failed (${error.response.status}): ${
            error.response.data?.status_message || "Unknown error"
          }`
        );
      }
      throw error;
    }
  },
  getEpisode: async (
    tvId: string,
    seasonNumber: number,
    episodeNumber: number,
    {
      apiKey,
      lang = "en-US",
    }: {
      apiKey: string;
      lang?: string;
    }
  ) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
        {
          params: {
            api_key: apiKey,
            language: lang,
          },
          timeout: 8000,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) throw new Error("Network error / no response");
        throw new Error(
          `TMDB episode fetch failed (${error.response.status}): ${
            error.response.data?.status_message || "Unknown error"
          }`
        );
      }
      throw error;
    }
  },
  getSeason: async (
    tvId: string,
    seasonNumber: number,
    {
      apiKey,
      lang = "en-US",
    }: {
      apiKey: string;
      lang?: string;
    }
  ) => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}`,
        {
          params: {
            api_key: apiKey,
            language: lang,
          },
          timeout: 8000,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) throw new Error("Network error / no response");
        throw new Error(
          `TMDB season fetch failed (${error.response.status}): ${
            error.response.data?.status_message || "Unknown error"
          }`
        );
      }
      throw error;
    }
  },
  search: async (
    query: string,
    type: "movie" | "tv",
    {
      apiKey,
      year,
      lang = "en-US",
    }: {
      apiKey: string;
      year?: string;
      lang?: string;
    }
  ) => {
    try {
      const params: Record<string, string> = {
        api_key: apiKey,
        query,
        language: lang,
      };
      if (year) {
        params.year = year;
      }

      const response = await axios.get(
        `https://api.themoviedb.org/3/search/${type}`,
        {
          params,
          timeout: 8000,
        }
      );

      const results = response.data.results || [];
      return results.length > 0 ? results[0].id.toString() : null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) throw new Error("Network error / no response");
        throw new Error(
          `TMDB search failed (${error.response.status}): ${
            error.response.data?.status_message || "Unknown error"
          }`
        );
      }
      throw error;
    }
  },
};
