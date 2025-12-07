/**
 * Metadata Fetcher Service
 * Handles fetching metadata from plugins and processing images
 */

import { logger } from "@dester/logger";
import type { IPlugin } from "@dester/types";
import {
  hasFetchMetadata,
  type IPluginWithFetchMetadata,
} from "../../infrastructure/plugins/plugin-extensions";
import { ImageProcessorService } from "../../infrastructure/image/image-processor.service";

export interface ProcessedMetadata {
  providerId: string;
  externalIdSource: string; // Plugin-defined source identifier
  title: string;
  overview: string | null;
  posterUrl: string | null;
  nullPosterUrl: string | null;
  backdropUrl: string | null;
  nullBackdropUrl: string | null;
  logoUrl: string | null;
  releaseDate: Date | null;
  rating: number | null;
  genres: string[];
}

export class MetadataFetcherService {
  private imageProcessor: ImageProcessorService;

  constructor(
    private readonly metadataPlugin: IPlugin | null,
    private readonly metadataPath: string
  ) {
    this.imageProcessor = new ImageProcessorService(metadataPath);
  }

  /**
   * Get the provider name from the plugin
   */
  getProviderName(): string {
    if (this.metadataPlugin && "getProviderName" in this.metadataPlugin) {
      return (
        this.metadataPlugin as { getProviderName(): string }
      ).getProviderName();
    }
    return "tmdb";
  }

  /**
   * Get the ExternalIdSource for the current plugin
   * Gets it directly from the plugin (plugins are self-describing)
   */
  getExternalIdSource(): string {
    // Get ExternalIdSource directly from plugin
    if (
      this.metadataPlugin &&
      "getExternalIdSource" in this.metadataPlugin &&
      typeof this.metadataPlugin.getExternalIdSource === "function"
    ) {
      const sourceString = this.metadataPlugin.getExternalIdSource();
      if (sourceString) {
        return sourceString.toUpperCase(); // Normalize to uppercase
      }
    }

    // Fallback: use provider name (for backward compatibility)
    return this.getProviderName().toUpperCase();
  }

  /**
   * Check if the plugin is available and supports fetchMetadata
   */
  isPluginAvailable(): boolean {
    return (
      this.metadataPlugin !== null && hasFetchMetadata(this.metadataPlugin)
    );
  }

  /**
   * Fetch metadata from the plugin
   */
  async fetchMetadata(
    title: string,
    year: number | undefined,
    mediaType: string
  ): Promise<ProcessedMetadata | null> {
    if (!this.metadataPlugin) {
      logger.warn("Metadata plugin unavailable");
      return null;
    }

    if (!hasFetchMetadata(this.metadataPlugin)) {
      throw new Error("Plugin does not support fetchMetadata method");
    }

    const metadata = await this.metadataPlugin.fetchMetadata(
      title,
      year,
      mediaType
    );

    if (!metadata) {
      logger.warn(
        {
          title,
          year,
          mediaType,
        },
        "Media not found in metadata provider"
      );
      return null;
    }

    const providerName = this.getProviderName();
    const externalIdSource = this.getExternalIdSource();
    const imageProviderIdStr = `${providerName}${metadata.providerId}`;

    // Process images - nullPoster/nullBackdrop are provider-specific (TMDB concept)
    // and will be null for providers that don't support them
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
        imageProviderIdStr,
        mediaType
      ),
      this.imageProcessor.processImage(
        metadata.backdropUrl,
        "backdrop",
        imageProviderIdStr,
        mediaType
      ),
      this.imageProcessor.processImage(
        metadata.nullPosterUrl,
        "null-poster",
        imageProviderIdStr,
        mediaType
      ),
      this.imageProcessor.processImage(
        metadata.nullBackdropUrl,
        "null-backdrop",
        imageProviderIdStr,
        mediaType
      ),
      this.imageProcessor.processImage(
        metadata.logoUrl,
        "logo",
        imageProviderIdStr,
        mediaType
      ),
    ]);

    // Store providerId as string for database (works with any provider)
    const providerIdStr = String(metadata.providerId);

    return {
      providerId: providerIdStr,
      externalIdSource,
      title: metadata.title,
      overview: metadata.overview,
      posterUrl: localPosterPath
        ? `/metadata/${localPosterPath}`
        : metadata.posterUrl,
      nullPosterUrl: localNullPosterPath
        ? `/metadata/${localNullPosterPath}`
        : metadata.nullPosterUrl,
      backdropUrl: localBackdropPath
        ? `/metadata/${localBackdropPath}`
        : metadata.backdropUrl,
      nullBackdropUrl: localNullBackdropPath
        ? `/metadata/${localNullBackdropPath}`
        : metadata.nullBackdropUrl,
      logoUrl: localLogoPath ? `/metadata/${localLogoPath}` : metadata.logoUrl,
      releaseDate: metadata.releaseDate ? new Date(metadata.releaseDate) : null,
      rating: metadata.rating,
      genres: metadata.genres || [],
    };
  }
}
