import { BaseEndpoint } from "./base.endpoint.js";
import {
  SearchResponseSchema,
  type SearchFilters,
  type SearchResponse,
} from "../schemas/search.schemas.js";

/**
 * Search endpoint module
 *
 * @example
 * ```ts
 * const results = await api.search.search({ q: 'avengers' });
 * const mediaOnly = await api.search.search({ q: 'avengers', type: 'media' });
 * const collectionsOnly = await api.search.search({ q: 'marvel', type: 'collections' });
 * ```
 */
export class SearchEndpoint extends BaseEndpoint {
  /**
   * Search for media and/or collections
   *
   * @param filters - Search query and optional type filter
   * @returns Search results
   */
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const query = this.client.buildQueryString(filters);
    return this.client.get(`/api/search${query}`, SearchResponseSchema);
  }
}
