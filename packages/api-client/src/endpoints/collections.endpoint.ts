import { BaseEndpoint } from "./base.endpoint.js";
import {
  CollectionListResponseSchema,
  CollectionResponseSchema,
  type CollectionListResponse,
  type CollectionResponse,
} from "../schemas/collection.schemas.js";

/**
 * Collections endpoint module
 *
 * @example
 * ```ts
 * const collections = await api.collections.list();
 * const collection = await api.collections.getById('collection-id');
 * const libraries = await api.collections.getLibraries();
 * ```
 */
export class CollectionsEndpoint extends BaseEndpoint {
  /**
   * List all collections
   *
   * @returns List of collections
   */
  async list(): Promise<CollectionListResponse> {
    return this.client.get("/api/collections", CollectionListResponseSchema);
  }

  /**
   * Get a single collection by ID
   *
   * @param id - Collection ID
   * @returns Collection details
   */
  async getById(id: string): Promise<CollectionResponse> {
    return this.client.get(`/api/collections/${id}`, CollectionResponseSchema);
  }

  /**
   * Get all libraries (collections that are libraries)
   *
   * @returns List of library collections
   */
  async getLibraries(): Promise<CollectionListResponse> {
    return this.client.get(
      "/api/collections/libraries",
      CollectionListResponseSchema
    );
  }
}
