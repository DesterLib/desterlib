/**
 * Scan Orchestrator Service
 *
 * Orchestrates scan operations, handling batch vs full scans
 */

import { logger } from "@/lib/utils";
import { wsManager } from "@/lib/websocket";
import { scanServices } from "../scan.services";
import type { ScanOptions } from "../scan.types";
import type { IMetadataProvider } from "@/lib/providers/metadata-provider.types";

export interface ScanOrchestratorOptions
  extends Omit<ScanOptions, "filenamePattern" | "directoryPattern"> {
  metadataProvider: IMetadataProvider;
  metadataProviderName?: string;
  originalPath?: string;
  // Normalized config (with compiled RegExp patterns)
  normalizedConfig?: {
    filenamePattern?: RegExp;
    directoryPattern?: RegExp;
    followSymlinks: boolean;
  };
}

export class ScanOrchestratorService {
  /**
   * Execute a scan (batch or full based on options)
   */
  async executeScan(
    mappedPath: string,
    options: ScanOrchestratorOptions
  ): Promise<void> {
    const useBatchScan = options.batchScan !== false;
    const mediaType = options.mediaType || "movie";

    if (useBatchScan) {
      logger.info(
        `🔄 Using batch scanning mode (${mediaType === "tv" ? "5" : "25"} folders per batch)`
      );
    } else {
      logger.info(`📁 Using full directory scanning mode`);
    }

    const scanPromise = useBatchScan
      ? scanServices.postBatched(mappedPath, options)
      : scanServices.post(mappedPath, options);

    return scanPromise
      .then((result) => {
        if ("totalFiles" in result) {
          logger.info(
            `✅ Scan completed: ${result.libraryName} (${result.totalSaved}/${result.totalFiles} items)`
          );
        } else {
          logger.info(`✅ Batch scan completed: ${result.libraryName}`);
          logger.info(
            `   📁 Folders: ${result.foldersProcessed}/${result.totalFolders} processed, ${result.foldersFailed} failed`
          );
          logger.info(
            `   🎬 Media Items: ${result.totalItemsSaved} saved to database`
          );
        }
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to scan path";
        logger.error(`❌ Scan failed: ${errorMessage}`);
        wsManager.sendScanError({
          error: errorMessage,
        });
        throw error; // Re-throw to be handled by queue service
      });
  }

  /**
   * Resume a scan job
   */
  async resumeScanJob(
    scanJobId: string,
    metadataProvider: IMetadataProvider
  ): Promise<void> {
    logger.info(`Resuming scan job: ${scanJobId}`);

    return scanServices
      .resumeScanJob(scanJobId, metadataProvider)
      .then((result) => {
        logger.info(`✅ Resumed scan completed: ${result.libraryName}`);
        logger.info(
          `   📁 Folders: ${result.foldersProcessed}/${result.totalFolders} processed, ${result.foldersFailed} failed`
        );
        logger.info(
          `   🎬 Media Items: ${result.totalItemsSaved} total in database`
        );
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to resume scan";
        logger.error(`❌ Resume scan failed: ${errorMessage}`);
        wsManager.sendScanError({
          error: errorMessage,
          scanJobId,
        });
        throw error;
      });
  }
}

export const scanOrchestratorService = new ScanOrchestratorService();
