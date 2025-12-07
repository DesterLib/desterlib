/**
 * Metadata Processor Service
 * Orchestrates the workflow for processing a single metadata job
 */

import { logger } from "@dester/logger";
import type { ScanJobRepository } from "../../infrastructure/repositories/scan/scan-job.repository";
import type { IPlugin } from "@dester/types";
import type { MetadataJob } from "../../domain/entities/metadata";
import { MetadataValidatorService } from "./metadata-validator.service";
import { MetadataFetcherService } from "./metadata-fetcher.service";
import { MetadataUpdaterService } from "./metadata-updater.service";
import {
  MetadataError,
  METADATA_ERROR_CODES,
} from "../../infrastructure/utils/errors";

export class MetadataProcessorService {
  private validator: MetadataValidatorService;
  private fetcher: MetadataFetcherService;
  private updater: MetadataUpdaterService;
  private processingLibraries: Set<string> = new Set();

  constructor(
    private readonly scanJobRepository: ScanJobRepository,
    private readonly metadataPlugin: IPlugin | null,
    private readonly metadataPath: string
  ) {
    this.validator = new MetadataValidatorService(metadataPath);
    this.fetcher = new MetadataFetcherService(metadataPlugin, metadataPath);
    this.updater = new MetadataUpdaterService();
  }

  /**
   * Process a metadata job
   * @param job - The metadata job to process
   */
  async process(job: MetadataJob): Promise<void> {
    const {
      media_id,
      title,
      year,
      library_id,
      folder_path,
      filename,
      media_type,
      rescan,
    } = job;
    const type = (media_type || "MOVIE").toUpperCase();

    // Validate job data
    if (!media_id || !title) {
      logger.warn({ job }, "Invalid job data, skipping");
      if (library_id) {
        await this.trackFailure(
          library_id,
          media_id || "unknown",
          title || "Unknown",
          year,
          filename,
          folder_path,
          "Invalid job data (missing media_id or title)"
        );
      }
      return;
    }

    // Check plugin availability
    if (!this.fetcher.isPluginAvailable()) {
      logger.warn(
        { mediaId: media_id },
        "Metadata plugin unavailable, skipping job"
      );
      if (library_id) {
        await this.trackFailure(
          library_id,
          media_id,
          title,
          year,
          filename,
          folder_path,
          "Metadata plugin unavailable"
        );
      }
      return;
    }

    // Update metadata status if this is the first job for this library
    if (library_id && !this.isProcessingLibrary(library_id)) {
      await this.scanJobRepository
        .updateMetadataStatus(library_id, "IN_PROGRESS")
        .catch((err) => {
          logger.debug(
            { error: err, library_id },
            "Failed to update metadata status (non-critical)"
          );
        });
    }

    try {
      // Check if media exists
      const mediaExists = await this.validator.checkMediaExists(media_id, type);
      if (!mediaExists) {
        logger.warn(
          { mediaId: media_id, type },
          "Media record not found, skipping job"
        );
        if (library_id) {
          await this.trackFailure(
            library_id,
            media_id,
            title,
            year,
            filename,
            folder_path,
            "Media record not found"
          );
        }
        return;
      }

      const externalIdSource = this.fetcher.getExternalIdSource();

      // Check if we need to fetch metadata (skip if rescan is false and metadata is complete)
      if (!rescan) {
        const hasComplete = await this.validator.hasCompleteMetadata(
          media_id,
          type
        );
        if (hasComplete) {
          const isValid = await this.validator.isMetadataValid(
            media_id,
            type,
            externalIdSource
          );

          if (isValid) {
            logger.debug(
              {
                mediaId: media_id,
                title,
              },
              "Metadata already exists and images are valid, skipping fetch"
            );
            if (library_id) {
              await this.scanJobRepository
                .incrementMetadataSuccess(library_id)
                .catch((error) => {
                  logger.debug(
                    { error, libraryId: library_id, mediaId: media_id },
                    "Failed to update metadata success count (non-critical)"
                  );
                });
            }
            return;
          }
        }
      }

      // Fetch metadata from plugin
      const processedMetadata = await this.fetcher.fetchMetadata(
        title,
        year,
        type
      );

      if (!processedMetadata) {
        logger.warn(
          {
            mediaId: media_id,
            title,
            year,
          },
          "Media not found in metadata provider"
        );
        if (library_id) {
          await this.trackFailure(
            library_id,
            media_id,
            title,
            year,
            filename,
            folder_path,
            "Media not found in metadata provider"
          );
        }
        return;
      }

      // Update database with metadata
      await this.updater.updateMediaMetadata(media_id, type, processedMetadata);

      logger.info(
        { mediaId: media_id, type },
        "Metadata processed successfully"
      );

      // Update scan job tracking
      if (library_id) {
        await this.scanJobRepository
          .incrementMetadataSuccess(library_id)
          .catch((error) => {
            logger.debug(
              { error, libraryId: library_id, mediaId: media_id },
              "Failed to update metadata success count (non-critical)"
            );
          });

        await this.scanJobRepository
          .checkAndMarkMetadataComplete(library_id)
          .catch((error) => {
            logger.debug(
              { error, libraryId: library_id },
              "Failed to check metadata completion (non-critical)"
            );
          });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isMediaNotFound =
        error instanceof MetadataError &&
        error.code === METADATA_ERROR_CODES.MEDIA_NOT_FOUND;

      if (library_id) {
        await this.trackFailure(
          library_id,
          media_id,
          title || "Unknown",
          year,
          filename,
          folder_path,
          isMediaNotFound
            ? "Media record not found"
            : "Error processing metadata job",
          errorMessage
        );
      }

      if (isMediaNotFound) {
        logger.warn(
          {
            mediaId: media_id,
            error: errorMessage,
          },
          "Media record not found, skipping job (will not retry)"
        );
        return;
      }

      logger.error(
        { error, mediaId: media_id },
        "Failed to process metadata job"
      );

      throw error;
    }
  }

  /**
   * Track if we're already processing a library (to avoid duplicate status updates)
   */
  private isProcessingLibrary(libraryId: string): boolean {
    if (this.processingLibraries.has(libraryId)) {
      return true;
    }
    this.processingLibraries.add(libraryId);
    return false;
  }

  /**
   * Track metadata processing failure
   */
  private async trackFailure(
    libraryId: string,
    _mediaId: string,
    _title: string,
    _year: number | undefined,
    _filename: string | undefined,
    _folderPath: string | undefined,
    _reason: string,
    _error?: string
  ): Promise<void> {
    try {
      await this.scanJobRepository
        .incrementMetadataFailure(libraryId)
        .catch((err) => {
          logger.debug(
            { error: err, libraryId },
            "Failed to track metadata failure (non-critical)"
          );
        });
    } catch (err) {
      logger.debug(
        { error: err, libraryId },
        "Failed to track metadata failure (non-critical)"
      );
    }
  }
}
