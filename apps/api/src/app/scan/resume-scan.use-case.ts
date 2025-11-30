/**
 * Resume Scan Use Case
 * Business logic for resuming a paused or failed scan job
 */

import type { IScanJobRepository } from "../../domain/repositories/scan/scan-job.repository.interface";
import { NotFoundError } from "../../infrastructure/utils/errors";
import { logger } from "@dester/logger";

export class ResumeScanUseCase {
  constructor(private readonly scanJobRepository: IScanJobRepository) {}

  /**
   * Execute the resume scan use case
   * @param scanJobId - The scan job ID to resume
   * @returns Promise resolving to the updated scan job entity
   */
  async execute(scanJobId: string) {
    // Find the scan job
    const scanJob = await this.scanJobRepository.findById(scanJobId);

    if (!scanJob) {
      throw new NotFoundError("Scan job", scanJobId);
    }

    // Check if scan job can be resumed
    if (scanJob.status !== "PAUSED" && scanJob.status !== "FAILED") {
      throw new Error(
        `Cannot resume scan job with status ${scanJob.status}. Only PAUSED or FAILED jobs can be resumed.`
      );
    }

    // Update status to IN_PROGRESS
    await this.scanJobRepository.update(scanJobId, {
      status: "IN_PROGRESS",
      startedAt: scanJob.startedAt || new Date(),
    });

    logger.info(`Resuming scan job ${scanJobId}`);

    // Note: The actual resumption logic would need to be handled by the scanner service
    // For now, we just update the database status

    return await this.scanJobRepository.findById(scanJobId);
  }
}
