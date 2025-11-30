import type { Request, Response } from "express";
import { scanPathSchema } from "../schemas/scan.schema";
import type { z } from "zod";
import { logger } from "@dester/logger";
import { container } from "../../../infrastructure/container";
import { NotFoundError } from "../../../infrastructure/utils/errors";
import { getDefaultScanSettings } from "../../../infrastructure/core/settings";
import { libraryService } from "../../../app/library";
import { MediaType, ScanJobStatus } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma";
import type { ScanRequestOptions } from "../../../domain/entities/scan/scan-request.entity";
import { calculateScanJobProgress } from "../../../app/scan/get-scan-status.use-case";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

/**
 * Async handler wrapper for error handling
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: any) => Promise<any>
) {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send success response
 */
function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: {
    success: true;
    data: T;
    message?: string;
  } = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

export const scanControllers = {
  /**
   * Scan a path for media files
   * Offloads the scan request to the Go scanner service
   */
  post: asyncHandler(async (req: Request, res: Response) => {
    const { path, name, description, options } =
      req.validatedData as ScanPathRequest;

    // Path is already normalized by schema transform
    const normalizedPath = path;

    // Get default scan settings
    const defaults = getDefaultScanSettings();

    // Determine max depth based on media type and options
    const mediaType = options?.mediaType;
    if (!mediaType) {
      // Should be caught by validation but safety check
      throw new Error("Media type is required");
    }

    const maxDepth =
      options?.mediaTypeDepth?.[mediaType] ??
      defaults.mediaTypeDepth?.[mediaType] ??
      (mediaType === "tv" ? 4 : 2);

    // Map mediaType to Prisma MediaType enum
    const libraryType: MediaType | null =
      mediaType === "movie"
        ? MediaType.MOVIE
        : mediaType === "tv"
          ? MediaType.TV_SHOW
          : null;

    // Create or update library record with normalized path
    const library = await libraryService.createOrUpdateByPath({
      path: normalizedPath,
      name,
      description: description || null,
      libraryType,
    });

    logger.info(
      `Library record created/updated: ${library.name} (${normalizedPath})`
    );

    // Apply defaults for options that weren't provided
    const scanOptions: ScanRequestOptions = {
      maxDepth,
      mediaType,
      mediaTypeDepth: options?.mediaTypeDepth ?? defaults.mediaTypeDepth,
      filenamePattern: options?.filenamePattern ?? defaults.filenamePattern,
      directoryPattern: options?.directoryPattern ?? defaults.directoryPattern,
      rescan: options?.rescan ?? defaults.rescan ?? false,
      followSymlinks:
        options?.followSymlinks ?? defaults.followSymlinks ?? true,
    };

    logger.info(
      `Offloading scan to Go scanner service: ${normalizedPath} (max_depth: ${maxDepth}, rescan: ${scanOptions.rescan}, followSymlinks: ${scanOptions.followSymlinks})`
    );

    // Get use cases from container
    const offloadScanUseCase = container.getOffloadScanUseCase();
    const createScanJobUseCase = container.getCreateScanJobUseCase();

    // Create ScanJob record in database FIRST (before starting scanner)
    const scanJobEntity = await createScanJobUseCase.execute(
      library.id,
      normalizedPath,
      libraryType!
    );

    // Pass scanJobId to scanner service via scanOptions
    scanOptions.scanJobId = scanJobEntity.id;

    // Offload scan to Go scanner service (scanJobId is now passed via scanOptions)
    const scannerJob = await offloadScanUseCase.execute(
      normalizedPath,
      library.id,
      scanOptions
    );

    logger.info(
      `Created scan job record: ${scanJobEntity.id} for library ${library.id}`
    );

    return sendSuccess(
      res,
      {
        libraryId: library.id,
        libraryName: library.name,
        path: normalizedPath,
        mediaType,
        maxDepth,
        jobId: scanJobEntity.id,
        message: "Scan job created and offloaded to scanner service",
      },
      202,
      "Scan offloaded to scanner service successfully."
    );
  }),

  /**
   * Get scan job status
   */
  getJobStatus: asyncHandler(async (req: Request, res: Response) => {
    const { scanJobId } = req.validatedData as { scanJobId: string };

    if (!scanJobId) {
      throw new NotFoundError("Scan job", scanJobId);
    }

    // Get use case from container
    const getScanStatusUseCase = container.getGetScanStatusUseCase();
    const status = await getScanStatusUseCase.execute(scanJobId);

    return sendSuccess(res, status);
  }),

  /**
   * Get all scan jobs
   * Retrieves all scan jobs, optionally filtered by status or library ID
   */
  getAllJobs: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const libraryId = req.query.libraryId as string | undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;

    // Map status query param to enum
    let statusEnum: ScanJobStatus | undefined;
    if (status) {
      const validStatuses = Object.values(ScanJobStatus);
      const upperStatus = status.toUpperCase();
      if (validStatuses.includes(upperStatus as ScanJobStatus)) {
        statusEnum = upperStatus as ScanJobStatus;
      }
    }

    // Use repository to query scan jobs
    const scanJobRepo = container.getScanJobRepository();
    const { jobs, total } = await scanJobRepo.findAll({
      status: statusEnum,
      libraryId,
      limit: Math.min(limit, 100),
      offset,
    });

    // Fetch library info for each job and return only specified fields
    const jobsWithLibrary = await Promise.all(
      jobs.map(async (job) => {
        const library = await prisma.library.findUnique({
          where: { id: job.libraryId },
          select: {
            id: true,
            name: true,
            libraryPath: true,
          },
        });

        // Calculate progress for this job
        const progress = calculateScanJobProgress({
          status: job.status,
          metadataStatus: job.metadataStatus,
          scannedCount: job.scannedCount,
          metadataSuccessCount: job.metadataSuccessCount,
          metadataFailedCount: job.metadataFailedCount,
        });

        // Return only specified fields
        return {
          id: job.id,
          libraryId: job.libraryId,
          scanPath: job.scanPath,
          mediaType: job.mediaType,
          status: job.status,
          metadataStatus: job.metadataStatus ?? "NOT_STARTED",
          scannedCount: job.scannedCount,
          metadataSuccessCount: job.metadataSuccessCount ?? 0,
          metadataFailedCount: job.metadataFailedCount ?? 0,
          progress: Math.min(100, Math.max(0, progress)),
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          metadataStartedAt: job.metadataStartedAt ?? null,
          metadataCompletedAt: job.metadataCompletedAt ?? null,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          library: library || null,
        };
      })
    );

    return sendSuccess(res, {
      jobs: jobsWithLibrary,
      pagination: {
        total,
        limit: Math.min(limit, 100),
        offset,
        hasMore: offset + jobs.length < total,
      },
    });
  }),

  /**
   * Resume a paused or failed scan job
   */
  resume: asyncHandler(async (req: Request, res: Response) => {
    const { scanJobId } = req.validatedData as { scanJobId: string };

    if (!scanJobId) {
      throw new NotFoundError("Scan job", scanJobId);
    }

    const resumeScanUseCase = container.getResumeScanUseCase();
    const scanJob = await resumeScanUseCase.execute(scanJobId);

    if (!scanJob) {
      throw new NotFoundError("Scan job", scanJobId);
    }

    return sendSuccess(
      res,
      {
        scanJobId: scanJob.id,
        status: scanJob.status,
        message: "Scan job resumed successfully",
      },
      202,
      "Scan job resumed successfully"
    );
  }),

  /**
   * Cleanup stale scan jobs
   * Removes completed or failed scan jobs older than the specified days (default: 30)
   */
  cleanupStaleJobs: asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    if (isNaN(days) || days < 1) {
      throw new Error("Days must be a positive number");
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    logger.info(
      `Cleaning up scan jobs older than ${days} days (before ${cutoffDate.toISOString()})`
    );

    const scanJobRepo = container.getScanJobRepository();

    // Delete jobs efficiently using database query
    const deletedCount = await scanJobRepo.deleteMany({
      status: ["COMPLETED", "FAILED"],
      completedBefore: cutoffDate,
    });

    logger.info(`Cleaned up ${deletedCount} stale scan jobs`);

    return sendSuccess(
      res,
      {
        cleanedCount: deletedCount,
        message: `Successfully cleaned up ${deletedCount} stale scan jobs`,
      },
      200,
      `Cleaned up ${deletedCount} stale scan jobs`
    );
  }),
};
