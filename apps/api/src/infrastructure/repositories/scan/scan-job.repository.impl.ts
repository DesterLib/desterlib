/**
 * Scan Job Repository Implementation
 * Prisma-based implementation for managing ScanJob database records
 */

import { prisma } from "../../prisma";
import type {
  IScanJobRepository,
  ScanJobEntity,
  CreateScanJobInput,
  UpdateScanJobInput,
} from "../../../domain/repositories/scan/scan-job.repository.interface";
import type { ScanJobStatus } from "@prisma/client";
import { logger } from "@dester/logger";

export class ScanJobRepository implements IScanJobRepository {
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
      const where: any = {};

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
      const where: any = {};

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

  private mapToEntity(scanJob: any): ScanJobEntity {
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
