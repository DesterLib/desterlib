import { BaseEndpoint } from "./base.endpoint.js";
import {
  MediaListResponseSchema,
  MediaResponseSchema,
  StatisticsResponseSchema,
  type MediaFilters,
  type MediaListResponse,
  type MediaResponse,
  type StatisticsResponse,
} from "../schemas/media.schemas.js";

/**
 * Media endpoint module
 *
 * @example
 * ```ts
 * const media = await api.media.list({ type: 'MOVIE', limit: 10 });
 * const item = await api.media.getById('media-id');
 * const stats = await api.media.getStatistics();
 * ```
 */
export class MediaEndpoint extends BaseEndpoint {
  /**
   * List all media with optional filtering
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns List of media items
   */
  async list(filters?: MediaFilters): Promise<MediaListResponse> {
    const query = filters ? this.client.buildQueryString(filters) : "";
    return this.client.get(`/api/media${query}`, MediaListResponseSchema);
  }

  /**
   * Get a single media item by ID
   *
   * @param id - Media ID
   * @returns Media details
   */
  async getById(id: string): Promise<MediaResponse> {
    return this.client.get(`/api/media/${id}`, MediaResponseSchema);
  }

  /**
   * Get media statistics
   *
   * @returns Statistics about all media
   */
  async getStatistics(): Promise<StatisticsResponse> {
    return this.client.get("/api/media/statistics", StatisticsResponseSchema);
  }
}
