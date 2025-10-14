import { BaseEndpoint } from "./base.endpoint.js";
import {
  MediaListResponseSchema,
  MediaResponseSchema,
  type MediaFilters,
  type MediaListResponse,
  type MediaResponse,
} from "../schemas/media.schemas.js";

/**
 * TV Shows endpoint module
 *
 * @example
 * ```ts
 * const tvShows = await api.tvShows.list({ limit: 10 });
 * const show = await api.tvShows.getById('show-id');
 * const streamUrl = api.tvShows.getStreamUrl('show-id');
 * ```
 */
export class TVShowsEndpoint extends BaseEndpoint {
  /**
   * List all TV shows with optional filtering
   *
   * @param filters - Query parameters for filtering and pagination (type is excluded)
   * @returns List of TV shows
   */
  async list(filters?: Omit<MediaFilters, "type">): Promise<MediaListResponse> {
    const query = filters ? this.client.buildQueryString(filters) : "";
    return this.client.get(`/api/tv-shows${query}`, MediaListResponseSchema);
  }

  /**
   * Get a single TV show by ID
   *
   * @param id - TV show ID
   * @returns TV show details
   */
  async getById(id: string): Promise<MediaResponse> {
    return this.client.get(`/api/tv-shows/${id}`, MediaResponseSchema);
  }

  /**
   * Get the stream URL for a TV show
   *
   * @param id - TV show ID
   * @returns Stream URL
   */
  getStreamUrl(id: string): string {
    return `${this.client.getBaseUrl()}/api/stream/tv-show/${id}`;
  }
}
