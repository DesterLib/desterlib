/**
 * Scanner Service Repository Interface
 * Abstraction for communicating with the Go scanner service
 */

import type { ScanJob } from "../../entities/scan/scan-job.entity";
import type { ScanRequestOptions } from "../../entities/scan/scan-request.entity";

export interface IScannerServiceRepository {
  /**
   * Offload a scan request to the Go scanner service
   * @param path - The root path to scan
   * @param libraryId - The library ID to associate with the scan
   * @param options - Scan options (maxDepth, etc.)
   * @returns Promise resolving to the scan job information
   */
  offloadScan(
    path: string,
    libraryId: string,
    options: ScanRequestOptions
  ): Promise<ScanJob>;
}
