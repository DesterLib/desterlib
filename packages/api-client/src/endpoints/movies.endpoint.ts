import { BaseEndpoint } from "./base.endpoint.js";
import {
  MediaListResponseSchema,
  MediaResponseSchema,
  type MediaFilters,
  type MediaListResponse,
  type MediaResponse,
} from "../schemas/media.schemas.js";

/**
 * Movies endpoint module
 *
 * @example
 * ```ts
 * const movies = await api.movies.list({ limit: 10 });
 * const movie = await api.movies.getById('movie-id');
 * const streamUrl = api.movies.getStreamUrl('movie-id');
 * ```
 */
export class MoviesEndpoint extends BaseEndpoint {
  /**
   * List all movies with optional filtering
   *
   * @param filters - Query parameters for filtering and pagination (type is excluded)
   * @returns List of movies
   */
  async list(filters?: Omit<MediaFilters, "type">): Promise<MediaListResponse> {
    const query = filters ? this.client.buildQueryString(filters) : "";
    return this.client.get(`/api/movies${query}`, MediaListResponseSchema);
  }

  /**
   * Get a single movie by ID
   *
   * @param id - Movie ID
   * @returns Movie details
   */
  async getById(id: string): Promise<MediaResponse> {
    return this.client.get(`/api/movies/${id}`, MediaResponseSchema);
  }

  /**
   * Get the stream URL for a movie
   *
   * @param id - Movie ID
   * @returns Stream URL
   */
  getStreamUrl(id: string): string {
    return `${this.client.getBaseUrl()}/api/stream/movie/${id}`;
  }
}
