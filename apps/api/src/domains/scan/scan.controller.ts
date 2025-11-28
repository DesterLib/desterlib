import type { Request, Response } from "express";
import { scanPathSchema } from "./scan.schema";
import type { z } from "zod";
import { asyncHandler, sendSuccess, logger } from "@/lib/utils";
import { scanValidationService } from "./services/scan-validation.service";
import { metadataProviderService } from "./services/metadata-provider.service";
import { scanOrchestratorService } from "./services/scan-orchestrator.service";
import { scanQueueService } from "./services/scan-queue.service";
import { scanConfigService } from "./services/scan-config.service";
import { scanServices } from "./scan.services";
import { getSettings } from "@/core/config/settings";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

export const scanControllers = {
  /**
   * Scan a path for media files
   */
  post: asyncHandler(async (req: Request, res: Response) => {
    const { path, options } = req.validatedData as ScanPathRequest;

    // Get DB settings as defaults
    const dbSettings = await getSettings();
    const defaultScanSettings = dbSettings.scanSettings || {};

    // Merge DB settings with request options (request options take precedence)
    const mergedOptions = {
      ...defaultScanSettings,
      ...options,
      // Handle mediaTypeDepth merge if both exist
      mediaTypeDepth: options?.mediaTypeDepth
        ? {
            ...(defaultScanSettings.mediaTypeDepth || {}),
            ...options.mediaTypeDepth,
          }
        : defaultScanSettings.mediaTypeDepth,
    };

    // Validate path and get mapped path
    const validation = await scanValidationService.validateScanPath(
      path,
      mergedOptions.mediaType
    );

    // Normalize scan configuration
    const normalizedConfig = scanConfigService.normalizeConfig(mergedOptions);

    // Get configured metadata provider
    const providerConfig =
      await metadataProviderService.getConfiguredProvider();

    const scanOptions = {
      ...mergedOptions,
      metadataProvider: providerConfig.provider,
      metadataProviderName: providerConfig.provider.name,
      originalPath: path !== validation.mappedPath ? path : undefined,
      normalizedConfig: {
        filenamePattern: normalizedConfig.filenamePattern,
        directoryPattern: normalizedConfig.directoryPattern,
        followSymlinks: normalizedConfig.followSymlinks,
      },
    };

    logger.info(`Scanning path: ${validation.mappedPath} (original: ${path})`);

    // Create scan task
    const scanTask = async () => {
      await scanOrchestratorService.executeScan(
        validation.mappedPath,
        scanOptions
      );
    };

    // Queue or execute scan
    const queueResult = await scanQueueService.enqueue(scanTask);

    return sendSuccess(
      res,
      {
        path,
        mediaType: mergedOptions.mediaType,
        queued: queueResult.queued,
        ...(queueResult.queuePosition && {
          queuePosition: queueResult.queuePosition,
        }),
      },
      202,
      queueResult.queued
        ? `Scan queued. ${queueResult.queuePosition} scan(s) ahead in queue. Progress will be sent via WebSocket when started.`
        : "Scan started successfully. Progress will be sent via WebSocket."
    );
  }),

  /**
   * Resume a failed or paused scan job
   */
  resumeScan: asyncHandler(async (req: Request, res: Response) => {
    const { scanJobId } = req.params;

    if (!scanJobId) {
      throw new Error("Scan job ID is required");
    }

    // Get configured metadata provider
    const providerConfig =
      await metadataProviderService.getConfiguredProvider();

    // Resume scan in background
    scanOrchestratorService
      .resumeScanJob(scanJobId, providerConfig.provider)
      .catch((error) => {
        // Error already logged and sent via WebSocket in orchestrator
        logger.error(`Failed to resume scan job: ${error}`);
      });

    return sendSuccess(
      res,
      { scanJobId },
      202,
      "Scan resumed successfully. Progress will be sent via WebSocket."
    );
  }),

  /**
   * Get scan job status
   */
  getJobStatus: asyncHandler(async (req: Request, res: Response) => {
    const { scanJobId } = req.params;

    if (!scanJobId) {
      throw new Error("Scan job ID is required");
    }

    const status = await scanServices.getJobStatus(scanJobId);

    if (!status) {
      throw new Error(`Scan job ${scanJobId} not found`);
    }

    return sendSuccess(res, status);
  }),

  /**
   * Cleanup stale scan jobs
   */
  cleanupStaleJobs: asyncHandler(async (req: Request, res: Response) => {
    logger.info("Manual cleanup of stale scan jobs requested");

    const result = await scanServices.cleanupStaleJobs();

    return sendSuccess(
      res,
      result,
      200,
      "Stale scan jobs cleaned up successfully"
    );
  }),
};
