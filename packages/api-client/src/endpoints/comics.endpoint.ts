import { BaseEndpoint } from "./base.endpoint.js";
import {
  MediaListResponseSchema,
  MediaResponseSchema,
  type MediaFilters,
  type MediaListResponse,
  type MediaResponse,
} from "../schemas/media.schemas.js";

/**
 * Comics endpoint module
 *
 * @example
 * ```ts
 * const comics = await api.comics.list({ limit: 10 });
 * const comic = await api.comics.getById('comic-id');
 * const streamUrl = api.comics.getStreamUrl('comic-id');
 * ```
 */
export class ComicsEndpoint extends BaseEndpoint {
  /**
   * List all comics with optional filtering
   *
   * @param filters - Query parameters for filtering and pagination (type is excluded)
   * @returns List of comics
   */
  async list(filters?: Omit<MediaFilters, "type">): Promise<MediaListResponse> {
    const query = filters ? this.client.buildQueryString(filters) : "";
    return this.client.get(`/api/comics${query}`, MediaListResponseSchema);
  }

  /**
   * Get a single comic by ID
   *
   * @param id - Comic ID
   * @returns Comic details
   */
  async getById(id: string): Promise<MediaResponse> {
    return this.client.get(`/api/comics/${id}`, MediaResponseSchema);
  }

  /**
   * Get the stream URL for a comic
   *
   * @param id - Comic ID
   * @returns Stream URL
   */
  getStreamUrl(id: string): string {
    return `${this.client.getBaseUrl()}/api/stream/comic/${id}`;
  }
}
