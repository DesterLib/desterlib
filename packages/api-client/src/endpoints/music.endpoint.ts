import { BaseEndpoint } from "./base.endpoint.js";
import {
  MediaListResponseSchema,
  MediaResponseSchema,
  type MediaFilters,
  type MediaListResponse,
  type MediaResponse,
} from "../schemas/media.schemas.js";

/**
 * Music endpoint module
 *
 * @example
 * ```ts
 * const music = await api.music.list({ limit: 10 });
 * const track = await api.music.getById('track-id');
 * const streamUrl = api.music.getStreamUrl('track-id');
 * ```
 */
export class MusicEndpoint extends BaseEndpoint {
  /**
   * List all music with optional filtering
   *
   * @param filters - Query parameters for filtering and pagination (type is excluded)
   * @returns List of music items
   */
  async list(filters?: Omit<MediaFilters, "type">): Promise<MediaListResponse> {
    const query = filters ? this.client.buildQueryString(filters) : "";
    return this.client.get(`/api/music${query}`, MediaListResponseSchema);
  }

  /**
   * Get a single music item by ID
   *
   * @param id - Music ID
   * @returns Music details
   */
  async getById(id: string): Promise<MediaResponse> {
    return this.client.get(`/api/music/${id}`, MediaResponseSchema);
  }

  /**
   * Get the stream URL for a music item
   *
   * @param id - Music ID
   * @returns Stream URL
   */
  getStreamUrl(id: string): string {
    return `${this.client.getBaseUrl()}/api/stream/music/${id}`;
  }
}
