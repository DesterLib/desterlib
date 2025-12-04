// Update MetadataService to use new table structure
import { Logger } from "@dester/logger";
import { Database } from "./database";
import { MetadataProvider } from "./providers/metadata-provider.interface";
import { ImageProcessor } from "./image-processor";
import { ScanJobLogger } from "./scan-job-logger";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

export class MetadataService {
  private database: Database;
  private provider: MetadataProvider;
  private logger: Logger;
  private imageProcessor: ImageProcessor;
  private scanJobLogger: ScanJobLogger | null;

  constructor(
    database: Database,
    provider: MetadataProvider,
    logger: Logger,
    storagePath: string = path.join(process.cwd(), "metadata"),
    scanJobLogger?: ScanJobLogger
  ) {
    this.database = database;
    this.provider = provider;
    this.logger = logger;
    this.imageProcessor = new ImageProcessor(logger, storagePath);
    this.scanJobLogger = scanJobLogger || null;
  }

  // ... (verifyLocalImagesExist kept as is) ...

  /**
   * Verify if local image files exist and are valid for the given URLs
   */
  private async verifyLocalImagesExist(
    posterUrl: string | null,
    backdropUrl: string | null,
    nullBackdropUrl: string | null = null
  ): Promise<{
    posterExists: boolean;
    backdropExists: boolean;
    nullBackdropExists: boolean;
  }> {
    // Get base storage path from image processor (accessing private property)
    const baseStoragePath = (this.imageProcessor as any)
      .baseStoragePath as string;

    let posterExists = false;
    let backdropExists = false;
    let nullBackdropExists = false;

    if (posterUrl?.startsWith("/metadata/")) {
      const relativePath = posterUrl.replace("/metadata/", "");
      const fullPath = path.join(baseStoragePath, relativePath);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.size > 0) {
          // Quick validation: try to read metadata with sharp
          await sharp(fullPath).metadata();
          posterExists = true;
        }
      } catch {
        posterExists = false;
      }
    }

    if (backdropUrl?.startsWith("/metadata/")) {
      const relativePath = backdropUrl.replace("/metadata/", "");
      const fullPath = path.join(baseStoragePath, relativePath);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.size > 0) {
          // Quick validation: try to read metadata with sharp
          await sharp(fullPath).metadata();
          backdropExists = true;
        }
      } catch {
        backdropExists = false;
      }
    }

    if (nullBackdropUrl?.startsWith("/metadata/")) {
      const relativePath = nullBackdropUrl.replace("/metadata/", "");
      const fullPath = path.join(baseStoragePath, relativePath);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.size > 0) {
          // Quick validation: try to read metadata with sharp
          await sharp(fullPath).metadata();
          nullBackdropExists = true;
        }
      } catch {
        nullBackdropExists = false;
      }
    }

    return { posterExists, backdropExists, nullBackdropExists };
  }

  // New signature accepting mediaType
  async fetchAndSaveMetadata(
    mediaId: string,
    mediaType: string, // 'MOVIE', 'TV_SHOW', etc.
    title: string,
    year?: number,
    libraryId?: string,
    rescan?: boolean
  ): Promise<void> {
    try {
      // Log rescan flag for debugging
      if (rescan) {
        this.logger.info(
          { mediaId, title, rescan },
          "RESCAN MODE: Forcing metadata re-fetch"
        );
      }

      // Check if media already has complete metadata (skip if rescan is true)
      const hasComplete =
        !rescan &&
        (await this.database.hasCompleteMetadata(mediaId, mediaType));
      if (hasComplete) {
        const existingMetadata = await this.database.getMediaMetadata(
          mediaId,
          mediaType
        );
        if (existingMetadata) {
          // Verify local images exist if we're using local paths
          const { posterExists, backdropExists, nullBackdropExists } =
            await this.verifyLocalImagesExist(
              existingMetadata.posterUrl,
              existingMetadata.backdropUrl,
              existingMetadata.nullBackdropUrl
            );

          // If we have ExternalId (TMDB link) and images exist, skip fetching
          // Check if at least poster or backdrop exists (including null variants)
          const hasValidImages =
            (existingMetadata.posterUrl?.startsWith("/metadata/")
              ? posterExists
              : existingMetadata.posterUrl !== null) ||
            (existingMetadata.backdropUrl?.startsWith("/metadata/")
              ? backdropExists
              : existingMetadata.backdropUrl !== null) ||
            existingMetadata.nullPosterUrl !== null ||
            (existingMetadata.nullBackdropUrl?.startsWith("/metadata/")
              ? nullBackdropExists
              : existingMetadata.nullBackdropUrl !== null);

          if (existingMetadata.hasExternalId && hasValidImages) {
            this.logger.debug(
              {
                mediaId,
                title,
                provider: this.provider.getProviderName(),
              },
              "Metadata already exists and images are valid, skipping fetch"
            );
            // Still update scan job metadata success counter
            if (libraryId) {
              await this.database
                .incrementScanJobMetadataSuccess(libraryId)
                .catch((error) => {
                  this.logger.debug(
                    { error, libraryId, mediaId },
                    "Failed to update metadata success count (non-critical)"
                  );
                });
            }
            return;
          }
        }
      }

      // Search for movie using the provider
      const metadata = await this.provider.searchMovie(title, year);

      if (!metadata) {
        this.logger.warn(
          {
            mediaId,
            title,
            year,
            provider: this.provider.getProviderName(),
          },
          "Movie not found in metadata provider"
        );
        // Track metadata failure if libraryId is provided
        if (libraryId) {
          // Get scan job ID for logging
          const scanJobId = await this.database.getActiveScanJobId(libraryId);

          // Log to scan job failure log if available
          if (scanJobId && this.scanJobLogger) {
            await this.scanJobLogger
              .logFailure(scanJobId, {
                mediaId,
                title,
                year,
                reason: "Movie not found in metadata provider",
              })
              .catch((error) => {
                this.logger.debug(
                  { error, scanJobId },
                  "Failed to write to scan job log (non-critical)"
                );
              });
          }

          await this.database
            .incrementScanJobMetadataFailure(libraryId)
            .catch((error) => {
              this.logger.debug(
                { error, libraryId, mediaId },
                "Failed to update metadata failure count (non-critical)"
              );
            });
        }
        return;
      }

      // Parse release date
      let releaseDate: Date | null = null;
      if (metadata.releaseDate) {
        releaseDate = new Date(metadata.releaseDate);
      }

      // Generate a unique provider-based ID string for filenames
      const providerIdStr = `${this.provider.getProviderName()}${metadata.providerId}`;

      // Process images (download & compress)
      const [
        localPosterPath,
        localBackdropPath,
        localNullPosterPath,
        localNullBackdropPath,
        localLogoPath,
      ] = await Promise.all([
        this.imageProcessor.processImage(
          metadata.posterUrl,
          "poster",
          providerIdStr,
          mediaType
        ),
        this.imageProcessor.processImage(
          metadata.backdropUrl,
          "backdrop",
          providerIdStr,
          mediaType
        ),
        this.imageProcessor.processImage(
          metadata.nullPosterUrl,
          "null-poster",
          providerIdStr,
          mediaType
        ),
        this.imageProcessor.processImage(
          metadata.nullBackdropUrl,
          "null-backdrop",
          providerIdStr,
          mediaType
        ),
        this.imageProcessor.processImage(
          metadata.logoUrl,
          "logo",
          providerIdStr,
          mediaType
        ),
      ]);

      // Save metadata to database
      const finalPosterUrl = localPosterPath
        ? `/metadata/${localPosterPath}`
        : metadata.posterUrl;
      const finalBackdropUrl = localBackdropPath
        ? `/metadata/${localBackdropPath}`
        : metadata.backdropUrl;
      const finalNullPosterUrl = localNullPosterPath
        ? `/metadata/${localNullPosterPath}`
        : metadata.nullPosterUrl;
      const finalNullBackdropUrl = localNullBackdropPath
        ? `/metadata/${localNullBackdropPath}`
        : metadata.nullBackdropUrl;
      const finalLogoUrl = localLogoPath
        ? `/metadata/${localLogoPath}`
        : metadata.logoUrl;

      await this.database.updateMediaMetadata(mediaId, mediaType, {
        tmdbId: parseInt(metadata.providerId, 10),
        title: metadata.title,
        overview: metadata.overview || null,
        posterUrl: finalPosterUrl,
        nullPosterUrl: finalNullPosterUrl,
        backdropUrl: finalBackdropUrl,
        nullBackdropUrl: finalNullBackdropUrl,
        logoUrl: finalLogoUrl,
        releaseDate,
        rating: metadata.rating || null,
        genres: metadata.genres,
      });

      this.logger.info(
        {
          mediaId,
          providerId: metadata.providerId,
          provider: this.provider.getProviderName(),
          title: metadata.title,
        },
        "Metadata saved successfully"
      );

      // Update scan job metadata success counter if libraryId is provided
      if (libraryId) {
        await this.database
          .incrementScanJobMetadataSuccess(libraryId)
          .catch((error) => {
            this.logger.debug(
              { error, libraryId, mediaId },
              "Failed to update metadata success count (non-critical)"
            );
          });
      }
    } catch (error) {
      this.logger.error(
        { error, mediaId, provider: this.provider.getProviderName() },
        "Failed to fetch and save metadata"
      );
      throw error;
    }
  }
}
