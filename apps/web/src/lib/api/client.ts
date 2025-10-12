const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Movie {
  id: number;
  title: string;
  year: number;
  image: string;
  duration: string;
  resolution: string;
  videoCodec: string;
  videoBitrate: string;
  audioCodec: string;
  audioBitrate: string;
  fileSize: string;
  frameRate: string;
  description: string;
  director: string;
  cast: string[];
  genre: string[];
  rating: string;
  imdbRating: string;
  audioTracks: Array<{
    language: string;
    codec: string;
    channels: string;
  }>;
  subtitles: string[];
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
  movies: {
    getAll: () => fetcher<{ movies: Movie[]; total: number }>("/api/movies"),
    getById: (id: number) => fetcher<{ movie: Movie }>(`/api/movies/${id}`),
  },
};
