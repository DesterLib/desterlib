/**
 * Offload Scan Use Case
 * Business logic for offloading a scan request to the Go scanner service
 */

import type { IScannerServiceRepository } from "../../domain/repositories/scan/scanner-service.repository.interface";
import type { ScanJob } from "../../domain/entities/scan/scan-job.entity";
import type { ScanRequestOptions } from "../../domain/entities/scan/scan-request.entity";

export class OffloadScanUseCase {
  constructor(
    private readonly scannerServiceRepository: IScannerServiceRepository
  ) {}

  /**
   * Execute the offload scan use case
   * @param path - The root path to scan
   * @param libraryId - The library ID
   * @param options - Scan options (defaults already applied in controller)
   * @returns Promise resolving to the scan job information
   */
  async execute(
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
