/**
 * Scanner Service Repository Implementation
 * HTTP client implementation for communicating with the Go scanner service
 */

import axios, { AxiosInstance } from "axios";
import type { IScannerServiceRepository } from "../../../domain/repositories/scan/scanner-service.repository.interface";
import type { ScanJob } from "../../../domain/entities/scan/scan-job.entity";
import type { ScanRequestOptions } from "../../../domain/entities/scan/scan-request.entity";
import { logger } from "@dester/logger";

export interface ScannerServiceRepositoryOptions {
  scannerServiceUrl: string;
  timeout?: number;
}

export class ScannerServiceRepository implements IScannerServiceRepository {
  private readonly httpClient: AxiosInstance;
  private readonly scannerServiceUrl: string;

  constructor(options: ScannerServiceRepositoryOptions) {
    this.scannerServiceUrl = options.scannerServiceUrl.replace(/\/$/, ""); // Remove trailing slash
    this.httpClient = axios.create({
      baseURL: this.scannerServiceUrl,
      timeout: options.timeout ?? 30000, // 30 seconds default
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async offloadScan(
    path: string,
    libraryId: string,
    options: ScanRequestOptions
  ): Promise<ScanJob> {
    try {
      // Build request body - Go service uses root_path, max_depth, media_type, scan_job_id, and rescan
      const requestBody: {
        root_path: string;
        library_id: string;
        max_depth?: number;
        media_type?: string;
        scan_job_id?: string;
        rescan?: boolean;
      } = {
        root_path: path,
        library_id: libraryId,
        max_depth: options.maxDepth,
      };

      // Add optional fields if provided
      if (options.mediaType) {
        requestBody.media_type = options.mediaType;
      }
      if (options.scanJobId) {
        requestBody.scan_job_id = options.scanJobId;
      }
      if (options.rescan !== undefined) {
        requestBody.rescan = options.rescan;
      }

      logger.info(
        `Offloading scan to Go scanner service: ${path} (max_depth: ${options.maxDepth}, rescan: ${options.rescan ?? false})`
      );

      const response = await this.httpClient.post<{
        job_id: string;
        total_files: number;
        message: string;
      }>("/scan", requestBody);

      return {
        jobId: response.data.job_id,
        totalFiles: response.data.total_files,
        message: response.data.message,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response
          ? `Scanner service error (${error.response.status}): ${
              error.response.data?.message || error.response.statusText
            }`
          : error.message || "Failed to connect to scanner service";

        logger.error(`Failed to offload scan: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}
