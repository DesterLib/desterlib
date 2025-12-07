/**
 * Scan Offload Service
 * Handles offloading scan requests to the Go scanner service
 */

import type { ScannerServiceRepository } from "../../infrastructure/repositories/scan/scanner-service.repository";
import type { ScanJob } from "../../domain/entities/scan/scan-job.entity";
import type { ScanRequestOptions } from "../../domain/entities/scan/scan-request.entity";

export class ScanOffloadService {
  constructor(
    private readonly scannerServiceRepository: ScannerServiceRepository
  ) {}

  /**
   * Offload a scan request to the Go scanner service
   * @param path - The root path to scan
   * @param libraryId - The library ID
   * @param options - Scan options (defaults already applied in controller)
   * @returns Promise resolving to the scan job information
   */
  async offload(
    path: string,
    libraryId: string,
    options: ScanRequestOptions
  ): Promise<ScanJob> {
    // Ensure maxDepth is set (should already be set by controller, but double-check)
    const maxDepth =
      options.maxDepth ??
      options.mediaTypeDepth?.[options.mediaType || "movie"] ??
      (options.mediaType === "tv" ? 4 : 2);

    // Offload to Go scanner service with all options
    return await this.scannerServiceRepository.offloadScan(path, libraryId, {
      ...options,
      maxDepth,
    });
  }
}
