/**
 * Scan Status Service
 * Handles retrieving scan job status from the database
 */

import type { ScanJobRepository } from "../../infrastructure/repositories/scan/scan-job.repository";
import type { ScanJobStatus } from "../../domain/entities/scan/scan-job.entity";
import { NotFoundError } from "../../infrastructure/utils/errors";

/**
 * Calculate progress percentage for a scan job
 * Progress is split between scanning (0-50%) and metadata fetching (50-100%)
 */
export function calculateScanJobProgress(job: {
  status: string;
  metadataStatus?: string | null;
  scannedCount?: number | null;
  metadataSuccessCount?: number | null;
  metadataFailedCount?: number | null;
}): number {
  const scanStatus = job.status;
  const metadataStatus = job.metadataStatus || "NOT_STARTED";
  const scannedCount = job.scannedCount || 0;
  const metadataSuccessCount = job.metadataSuccessCount || 0;
  const metadataFailedCount = job.metadataFailedCount || 0;
  const totalMetadataProcessed = metadataSuccessCount + metadataFailedCount;

  // If scan is completed and metadata is completed, we're at 100%
  if (scanStatus === "COMPLETED" && metadataStatus === "COMPLETED") {
    return 100;
  }

  // If scan is completed but metadata is not started, we're at 50%
  if (scanStatus === "COMPLETED" && metadataStatus === "NOT_STARTED") {
    return 50;
  }

  // If scan is completed, calculate metadata progress (50-100% range)
  if (scanStatus === "COMPLETED") {
    if (scannedCount > 0) {
      const metadataProgress = totalMetadataProcessed / scannedCount;
      // Map metadata progress (0-1) to overall progress (50-100%)
      return Math.min(100, Math.max(50, 50 + metadataProgress * 50));
    }
    return 50; // No files scanned yet
  }

  // If scan is in progress, we're somewhere in 0-50% range
  if (scanStatus === "IN_PROGRESS") {
    // Progress is indeterminate during scanning, estimate at 25%
    return 25;
  }

  // If scan failed, progress stops
  if (scanStatus === "FAILED") {
    return 0;
  }

  // Default for pending/paused
  return 0;
}

export class ScanStatusService {
  constructor(private readonly scanJobRepository: ScanJobRepository) {}

  /**
   * Get scan job status
   * @param jobId - The scan job ID (database ID)
   * @returns Promise resolving to the scan job status
   */
  async getStatus(jobId: string): Promise<ScanJobStatus> {
    const scanJob = await this.scanJobRepository.findById(jobId);

    if (!scanJob) {
      throw new NotFoundError("Scan job", jobId);
    }

    // Map database status to API status format
    const statusMap: Record<
      string,
      "pending" | "processing" | "completed" | "failed"
    > = {
      PENDING: "pending",
      IN_PROGRESS: "processing",
      COMPLETED: "completed",
      FAILED: "failed",
      PAUSED: "pending", // Paused jobs show as pending for resumption
    };

    // Map metadata status to API format
    const metadataStatusMap: Record<
      string,
      "not_started" | "pending" | "processing" | "completed" | "failed"
    > = {
      NOT_STARTED: "not_started",
      PENDING: "pending",
      IN_PROGRESS: "processing",
      COMPLETED: "completed",
      FAILED: "failed",
    };

    // Calculate progress percentage
    const progress = calculateScanJobProgress({
      status: scanJob.status,
      metadataStatus: scanJob.metadataStatus,
      scannedCount: scanJob.scannedCount,
      metadataSuccessCount: scanJob.metadataSuccessCount,
      metadataFailedCount: scanJob.metadataFailedCount,
    });

    // Build status message
    let message = "";
    if (scanJob.status === "COMPLETED") {
      message = `Completed: ${scanJob.scannedCount} files scanned`;
    } else if (scanJob.status === "IN_PROGRESS") {
      message = `Processing: ${scanJob.scannedCount} files scanned`;
    } else {
      message = "Scan in progress";
    }

    return {
      jobId: scanJob.id,
      status: statusMap[scanJob.status] || "pending",
      metadataStatus:
        metadataStatusMap[scanJob.metadataStatus] || "not_started",
      totalFiles: scanJob.scannedCount,
      progress: Math.min(100, Math.max(0, progress)), // Ensure 0-100 range
      message,
      metadataSuccessCount: scanJob.metadataSuccessCount,
      metadataFailedCount: scanJob.metadataFailedCount,
    };
  }
}
