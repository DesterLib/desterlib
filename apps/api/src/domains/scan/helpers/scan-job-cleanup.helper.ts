/**
 * Scan job cleanup utilities
 * Handles zombie/stale scan jobs that may be stuck after crashes
 */

import { logger } from "@/lib/utils";
import prisma from "@/lib/database/prisma";
import { ScanJobStatus } from "@/lib/database";

/**
 * Mark stale scan jobs as FAILED
 * A scan job is considered stale if it's been IN_PROGRESS for more than the specified timeout
 */
export async function cleanupStaleJobs(
  staleTimeoutMs: number = 6 * 60 * 60 * 1000 // 6 hours default
): Promise<number> {
  try {
    const staleThreshold = new Date(Date.now() - staleTimeoutMs);

    // Find jobs that have been in progress for too long
    const staleJobs = await prisma.scanJob.findMany({
      where: {
        status: ScanJobStatus.IN_PROGRESS,
        OR: [
          // Job started but no batch completed recently
          {
            lastBatchAt: {
              lt: staleThreshold,
            },
          },
          // Job started but never completed a batch
          {
            lastBatchAt: null,
            startedAt: {
              lt: staleThreshold,
            },
          },
        ],
      },
      include: {
        library: {
          select: {
            name: true,
          },
        },
      },
    });

    if (staleJobs.length === 0) {
      logger.debug("No stale scan jobs found");
      return 0;
    }

    // Mark them as FAILED
    const updatePromises = staleJobs.map((job) =>
      prisma.scanJob.update({
        where: { id: job.id },
        data: {
          status: ScanJobStatus.FAILED,
          errorMessage: `Scan job marked as failed due to inactivity (timeout: ${staleTimeoutMs / 1000 / 60} minutes). Last activity: ${job.lastBatchAt?.toISOString() || job.startedAt?.toISOString() || "unknown"}`,
          completedAt: new Date(),
        },
      })
    );

    await Promise.all(updatePromises);

    logger.warn(
      `🧹 Cleaned up ${staleJobs.length} stale scan job(s):`
    );
    staleJobs.forEach((job) => {
      logger.warn(
        `   - ${job.library.name} (${job.currentBatch}/${job.totalBatches} batches, ${job.processedCount}/${job.totalFolders} folders)`
      );
    });

    return staleJobs.length;
  } catch (error) {
    logger.error(
      `Failed to cleanup stale jobs: ${error instanceof Error ? error.message : error}`
    );
    return 0;
  }
}

/**
 * Get scan job status with metadata
 */
export async function getScanJobStatus(scanJobId: string) {
  const job = await prisma.scanJob.findUnique({
    where: { id: scanJobId },
    include: {
      library: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!job) {
    return null;
  }

  const progressPercent =
    job.totalFolders > 0
      ? Math.floor(
          ((job.processedCount + job.failedCount) / job.totalFolders) * 100
        )
      : 0;

  return {
    id: job.id,
    status: job.status,
    library: job.library,
    progress: {
      currentBatch: job.currentBatch,
      totalBatches: job.totalBatches,
      processedFolders: job.processedCount,
      failedFolders: job.failedCount,
      totalFolders: job.totalFolders,
      percentComplete: progressPercent,
    },
    timestamps: {
      startedAt: job.startedAt,
      lastBatchAt: job.lastBatchAt,
      completedAt: job.completedAt,
    },
    error: job.errorMessage,
  };
}

