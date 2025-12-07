/**
 * Scan Job Repository
 * Prisma-based implementation for managing ScanJob database records
 *
 * Error Handling Strategy:
 * - Critical operations (create, findById, update, delete, findAll, deleteMany):
 *   These operations are essential for core functionality. Errors are logged with
 *   logger.error and re-thrown to allow callers to handle them appropriately.
 *
 * - Non-critical operations (updateMetadataStatus, incrementMetadataSuccess,
 *   incrementMetadataFailure, checkAndMarkMetadataComplete, getActiveScanJobId):
 *   These operations are used for tracking and monitoring metadata processing.
 *   Failures in these operations should not block the main workflow, so errors are
 *   logged with logger.debug and methods return silently (void methods) or return
 *   a safe default (boolean methods return false, nullable methods return null).
 *   This ensures that metadata processing can continue even if tracking fails.
 */

import { prisma } from "../../prisma";
import type { ScanJobStatus, MetadataJobStatus, MediaType, Prisma } from "@prisma/client";
import { logger } from "@dester/logger";

/**
 * Scan Job Entity
 * Represents a scan job in the system
 */
export interface ScanJobEntity {
  id: string;
  libraryId: string;
  scanPath: string;
  mediaType: MediaType;
  status: ScanJobStatus;
  metadataStatus: MetadataJobStatus;
  scannedCount: number;
  metadataSuccessCount: number;
  metadataFailedCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  metadataStartedAt: Date | null;
  metadataCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new scan job
 */
export interface CreateScanJobInput {
  libraryId: string;
  scanPath: string;
  mediaType: MediaType;
}

/**
 * Input for updating a scan job
 */
export interface UpdateScanJobInput {
  status?: ScanJobStatus;
  scannedCount?: number;
  metadataSuccessCount?: number;
  metadataFailedCount?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

/**
 * Active scan job statuses that are considered "in progress"
 * These are jobs that are pending, in progress, or completed but may still have metadata processing
 */
const ACTIVE_SCAN_JOB_STATUSES: ScanJobStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

export class ScanJobRepository {
  async create(input: CreateScanJobInput): Promise<ScanJobEntity> {
    try {
      const scanJob = await prisma.scanJob.create({
        data: {
          libraryId: input.libraryId,
          scanPath: input.scanPath,
          mediaType: input.mediaType,
          status: "PENDING",
        },
      });

      return this.mapToEntity(scanJob);
    } catch (error) {
      logger.error(`Failed to create scan job: ${error}`);
      throw error;
    }
  }

  async findById(id: string): Promise<ScanJobEntity | null> {
    try {
      const scanJob = await prisma.scanJob.findUnique({
        where: { id },
      });

      return scanJob ? this.mapToEntity(scanJob) : null;
    } catch (error) {
      logger.error(`Failed to find scan job by ID ${id}: ${error}`);
      throw error;
    }
  }

  async findByLibraryId(libraryId: string): Promise<ScanJobEntity[]> {
    try {
      const scanJobs = await prisma.scanJob.findMany({
        where: { libraryId },
        orderBy: { createdAt: "desc" },
      });

      return scanJobs.map(this.mapToEntity);
    } catch (error) {
      logger.error(
        `Failed to find scan jobs by library ID ${libraryId}: ${error}`
      );
      throw error;
    }
  }

  async findByStatus(status: ScanJobStatus): Promise<ScanJobEntity[]> {
    try {
      const scanJobs = await prisma.scanJob.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
      });

      return scanJobs.map(this.mapToEntity);
    } catch (error) {
      logger.error(`Failed to find scan jobs by status ${status}: ${error}`);
      throw error;
    }
  }

  async update(
    id: string,
    updates: UpdateScanJobInput
  ): Promise<ScanJobEntity> {
    try {
      const scanJob = await prisma.scanJob.update({
        where: { id },
        data: updates,
      });

      return this.mapToEntity(scanJob);
    } catch (error) {
      logger.error(`Failed to update scan job ${id}: ${error}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.scanJob.delete({
        where: { id },
      });
    } catch (error) {
      logger.error(`Failed to delete scan job ${id}: ${error}`);
      throw error;
    }
  }

  async deleteMany(criteria: {
    status?: ScanJobStatus[];
    completedBefore?: Date;
  }): Promise<number> {
    try {
      const where: Prisma.ScanJobWhereInput = {};

      if (criteria.status && criteria.status.length > 0) {
        where.status = { in: criteria.status };
      }

      if (criteria.completedBefore) {
        // Only delete jobs that have completedAt set and are before the cutoff date
        where.completedAt = {
          not: null,
          lt: criteria.completedBefore,
        };
      }

      const result = await prisma.scanJob.deleteMany({ where });
      return result.count;
    } catch (error) {
      logger.error(`Failed to delete scan jobs: ${error}`);
      throw error;
    }
  }

  async findAll(options?: {
    status?: ScanJobStatus;
    libraryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: ScanJobEntity[]; total: number }> {
    try {
      const where: Prisma.ScanJobWhereInput = {};

      if (options?.status) {
        where.status = options.status;
      }

      if (options?.libraryId) {
        where.libraryId = options.libraryId;
      }

      const limit = Math.min(options?.limit ?? 50, 100);
      const offset = options?.offset ?? 0;

      const [jobs, total] = await Promise.all([
        prisma.scanJob.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        }),
        prisma.scanJob.count({ where }),
      ]);

      return {
        jobs: jobs.map(this.mapToEntity),
        total,
      };
    } catch (error) {
      logger.error(`Failed to find all scan jobs: ${error}`);
      throw error;
    }
  }

  async updateMetadataStatus(
    libraryId: string,
    status: MetadataJobStatus
  ): Promise<void> {
    try {
      // Find the latest scan job for this library (not necessarily active)
      const latestJob = await prisma.scanJob.findFirst({
        where: { libraryId },
        orderBy: { createdAt: "desc" },
      });

      if (!latestJob) {
        return;
      }

      // Build update data
      const updateData: Prisma.ScanJobUpdateInput = {
        metadataStatus: status,
        updatedAt: new Date(),
      };

      if (status === "IN_PROGRESS") {
        updateData.metadataStartedAt =
          latestJob.metadataStartedAt || new Date();
      } else if (status === "COMPLETED" || status === "FAILED") {
        updateData.metadataCompletedAt = new Date();
      }

      await prisma.scanJob.update({
        where: { id: latestJob.id },
        data: updateData,
      });
    } catch (error) {
      logger.debug(
        { error, libraryId, status },
        "Failed to update metadata status (non-critical)"
      );
    }
  }

  async incrementMetadataSuccess(libraryId: string): Promise<void> {
    try {
      const latestJob = await this.findLatestActiveScanJob(libraryId);
      if (!latestJob) {
        return;
      }

      const updateData = this.buildMetadataIncrementUpdateData(
        latestJob,
        "success"
      );

      await prisma.scanJob.update({
        where: { id: latestJob.id },
        data: updateData,
      });
    } catch (error) {
      logger.debug(
        { error, libraryId },
        "Failed to increment metadata success count (non-critical)"
      );
    }
  }

  async incrementMetadataFailure(libraryId: string): Promise<void> {
    try {
      const latestJob = await this.findLatestActiveScanJob(libraryId);
      if (!latestJob) {
        return;
      }

      const updateData = this.buildMetadataIncrementUpdateData(
        latestJob,
        "failure"
      );

      await prisma.scanJob.update({
        where: { id: latestJob.id },
        data: updateData,
      });
    } catch (error) {
      logger.debug(
        { error, libraryId },
        "Failed to increment metadata failure count (non-critical)"
      );
    }
  }

  async checkAndMarkMetadataComplete(libraryId: string): Promise<boolean> {
    try {
      // Find the latest active scan job with IN_PROGRESS metadata status
      const job = await this.findLatestActiveScanJob(
        libraryId,
        {
          metadataStatus: "IN_PROGRESS",
        },
        {
          id: true,
          scannedCount: true,
          metadataSuccessCount: true,
          metadataFailedCount: true,
          scanPath: true,
        }
      );

      if (!job) {
        return false;
      }

      const totalProcessed =
        (job.metadataSuccessCount || 0) + (job.metadataFailedCount || 0);
      const totalScanned = job.scannedCount || 0;

      if (totalScanned > 0 && totalProcessed >= totalScanned) {
        await prisma.scanJob.update({
          where: { id: job.id },
          data: {
            metadataStatus: "COMPLETED",
            metadataCompletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info(
          {
            libraryId,
            scanJobId: job.id,
            scannedCount: totalScanned,
            totalProcessed,
          },
          "✅ Library metadata fetching completed successfully"
        );

        return true;
      }

      return false;
    } catch (error) {
      logger.debug(
        { error, libraryId },
        "Failed to check metadata completion (non-critical)"
      );
      return false;
    }
  }

  async getActiveScanJobId(libraryId: string): Promise<string | null> {
    try {
      const job = await this.findLatestActiveScanJob(libraryId, undefined, {
        id: true,
      });

      return job?.id || null;
    } catch (error) {
      logger.debug(
        { error, libraryId },
        "Failed to get active scan job ID (non-critical)"
      );
      return null;
    }
  }

  /**
   * Find the latest active scan job for a library
   * @param libraryId - The library ID to search for
   * @param additionalWhere - Additional where conditions to apply
   * @param select - Optional select clause to limit returned fields
   * @returns The latest active scan job or null if not found
   */
  private async findLatestActiveScanJob<
    T extends Prisma.ScanJobSelect | undefined = undefined,
  >(
    libraryId: string,
    additionalWhere?: Prisma.ScanJobWhereInput,
    select?: T
  ): Promise<Prisma.ScanJobGetPayload<
    T extends Prisma.ScanJobSelect ? { select: T } : {}
  > | null> {
    const where: Prisma.ScanJobWhereInput = {
      libraryId,
      status: { in: ACTIVE_SCAN_JOB_STATUSES },
      ...additionalWhere,
    };

    const result = await prisma.scanJob.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      ...(select && { select }),
    });

    return result as Prisma.ScanJobGetPayload<
      T extends Prisma.ScanJobSelect ? { select: T } : {}
    > | null;
  }

  /**
   * Build update data for metadata increment operations
   * Handles common logic for both success and failure increments
   */
  private buildMetadataIncrementUpdateData(
    latestJob: Prisma.ScanJobGetPayload<{}>,
    incrementType: "success" | "failure"
  ): Prisma.ScanJobUpdateInput {
    const updateData: Prisma.ScanJobUpdateInput = {
      updatedAt: new Date(),
    };

    if (incrementType === "success") {
      updateData.metadataSuccessCount = { increment: 1 };
    } else {
      updateData.metadataFailedCount = { increment: 1 };
    }

    // Update metadataStatus if it's NOT_STARTED
    if (latestJob.metadataStatus === "NOT_STARTED") {
      updateData.metadataStatus = "IN_PROGRESS";
    }

    // Set metadataStartedAt if not already set
    if (!latestJob.metadataStartedAt) {
      updateData.metadataStartedAt = new Date();
    }

    return updateData;
  }

  private mapToEntity(scanJob: Prisma.ScanJobGetPayload<{}>): ScanJobEntity {
    return {
      id: scanJob.id,
      libraryId: scanJob.libraryId,
      scanPath: scanJob.scanPath,
      mediaType: scanJob.mediaType,
      status: scanJob.status,
      metadataStatus: scanJob.metadataStatus ?? "NOT_STARTED",
      scannedCount: scanJob.scannedCount,
      metadataSuccessCount: scanJob.metadataSuccessCount ?? 0,
      metadataFailedCount: scanJob.metadataFailedCount ?? 0,
      startedAt: scanJob.startedAt,
      completedAt: scanJob.completedAt,
      metadataStartedAt: scanJob.metadataStartedAt ?? null,
      metadataCompletedAt: scanJob.metadataCompletedAt ?? null,
      createdAt: scanJob.createdAt,
      updatedAt: scanJob.updatedAt,
    };
  }
}
