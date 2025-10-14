import { BaseEndpoint } from "./base.endpoint.js";
import {
  ScanResponseSchema,
  SyncResponseSchema,
  SyncAllResponseSchema,
  type ScanRequest,
  type SyncRequest,
  type ScanResponse,
  type SyncResponse,
  type SyncAllResponse,
} from "../schemas/scan.schemas.js";

/**
 * Scan endpoint module
 *
 * @example
 * ```ts
 * const result = await api.scan.scan({
 *   path: '/path/to/media',
 *   mediaType: 'MOVIE'
 * });
 * const syncResult = await api.scan.sync({
 *   collectionName: 'Movies',
 *   mediaType: 'MOVIE'
 * });
 * const syncAllResult = await api.scan.syncAll();
 * ```
 */
export class ScanEndpoint extends BaseEndpoint {
  /**
   * Scan a directory for media files
   *
   * @param request - Scan request parameters
   * @returns Scan result with statistics
   */
  async scan(request: ScanRequest): Promise<ScanResponse> {
    return this.client.post("/api/scan", request, ScanResponseSchema);
  }

  /**
   * Sync a collection to check for changes
   *
   * @param request - Sync request parameters
   * @returns Sync result with statistics
   */
  async sync(request: SyncRequest): Promise<SyncResponse> {
    return this.client.post("/api/scan/sync", request, SyncResponseSchema);
  }

  /**
   * Sync all libraries
   *
   * @returns Sync results for all libraries
   */
  async syncAll(): Promise<SyncAllResponse> {
    return this.client.post("/api/scan/sync-all", {}, SyncAllResponseSchema);
  }
}
