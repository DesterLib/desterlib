const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Episode {
  id: string;
  title: string;
  number: number;
  duration?: number;
  airDate?: string;
  filePath?: string;
  streamUrl?: string;
}

export interface Movie {
  id: string;
  duration?: number;
  director?: string;
  trailerUrl?: string;
  filePath?: string;
  streamUrl?: string;
}

export interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

export interface TVShow {
  id: string;
  creator?: string;
  network?: string;
  seasons: Season[];
}

export interface Media {
  id: string;
  title: string;
  type: "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC";
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating?: number;
  releaseDate?: string;
  movie?: Movie;
  tvShow?: TVShow;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  mediaCount: number;
  recentMedia: Media[];
  createdAt: string;
  updatedAt: string;
}

interface SuccessEnvelope<T> {
  success: true;
  requestId: string;
  data: T;
}

interface ErrorEnvelope {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope;

async function fetcher<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      requestId: "unknown",
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}

export const api = {
  collections: {
    getAll: () => fetcher<{ collections: Collection[] }>("/api/collections"),
    getById: (slugOrId: string) =>
      fetcher<{ collection: Collection }>(`/api/collections/${slugOrId}`),
  },
  media: {
    getAll: (params?: { type?: string; collectionId?: string }) => {
      const query = new URLSearchParams();
      if (params?.type) query.append("type", params.type);
      if (params?.collectionId)
        query.append("collectionId", params.collectionId);
      return fetcher<{ media: Media[] }>(
        `/api/media${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    getById: (id: string) => fetcher<{ media: Media }>(`/api/media/${id}`),
  },
  movies: {
    getAll: (params?: {
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const query = new URLSearchParams();
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.sortBy) query.append("sortBy", params.sortBy);
      if (params?.sortOrder) query.append("sortOrder", params.sortOrder);
      return fetcher<{ media: Media[] }>(
        `/api/movies${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    getById: (id: string) => fetcher<{ media: Media }>(`/api/movies/${id}`),
  },
  tvShows: {
    getAll: (params?: {
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      const query = new URLSearchParams();
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.sortBy) query.append("sortBy", params.sortBy);
      if (params?.sortOrder) query.append("sortOrder", params.sortOrder);
      return fetcher<{ media: Media[] }>(
        `/api/tv-shows${query.toString() ? `?${query.toString()}` : ""}`
      );
    },
    getById: (id: string) => fetcher<{ media: Media }>(`/api/tv-shows/${id}`),
  },
  search: {
    query: (q: string, type?: "media" | "collections") => {
      const params = new URLSearchParams({ q });
      if (type) params.append("type", type);
      return fetcher<{
        query: string;
        media?: Media[];
        collections?: Collection[];
        total: number;
      }>(`/api/search?${params.toString()}`);
    },
  },
};
