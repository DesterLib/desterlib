/**
 * Metadata Validator Service
 * Handles validation of media records and existing metadata
 */

import { prisma } from "../../infrastructure/prisma";
import { logger } from "@dester/logger";
import path from "path";
import fs from "fs/promises";

export interface MediaMetadataInfo {
  posterUrl: string | null;
  backdropUrl: string | null;
  nullPosterUrl: string | null;
  nullBackdropUrl: string | null;
  hasExternalId: boolean;
}

export class MetadataValidatorService {
  constructor(private readonly metadataPath: string) {}

  /**
   * Check if a media record exists in the database
   */
  async checkMediaExists(mediaId: string, mediaType: string): Promise<boolean> {
    try {
      if (mediaType === "TV_SHOW") {
        const tvShow = await prisma.tVShow.findUnique({
          where: { id: mediaId },
          select: { id: true },
        });
        return tvShow !== null;
      } else {
        const movie = await prisma.movie.findUnique({
          where: { id: mediaId },
          select: { id: true },
        });
        return movie !== null;
      }
    } catch (error) {
      logger.warn(
        { error, mediaId, mediaType },
        "Failed to check media existence"
      );
      return false;
    }
  }

  /**
   * Check if media has complete metadata
   */
  async hasCompleteMetadata(
    mediaId: string,
    mediaType: string
  ): Promise<boolean> {
    try {
      const selectFields = {
        title: true,
        overview: true,
        posterUrl: true,
        backdropUrl: true,
      };

      if (mediaType === "TV_SHOW") {
        const tvShow = await prisma.tVShow.findUnique({
          where: { id: mediaId },
          select: selectFields,
        });
        return !!(
          tvShow &&
          tvShow.title &&
          tvShow.overview &&
          (tvShow.posterUrl || tvShow.backdropUrl)
        );
      } else {
        const movie = await prisma.movie.findUnique({
          where: { id: mediaId },
          select: selectFields,
        });
        return !!(
          movie &&
          movie.title &&
          movie.overview &&
          (movie.posterUrl || movie.backdropUrl)
        );
      }
    } catch (error) {
      logger.warn(
        { error, mediaId },
        "Failed to check if media has complete metadata"
      );
      return false;
    }
  }

  /**
   * Get existing media metadata
   */
  async getMediaMetadata(
    mediaId: string,
    mediaType: string,
    externalIdSource?: string
  ): Promise<MediaMetadataInfo | null> {
    try {
      // If externalIdSource is provided, check for that specific provider
      // Otherwise, check for any external ID (for backward compatibility)
      const externalIdWhere = externalIdSource
        ? { source: externalIdSource }
        : undefined;

      const selectFields = {
        posterUrl: true,
        backdropUrl: true,
        nullPosterUrl: true,
        nullBackdropUrl: true,
        externalIds: {
          where: externalIdWhere,
          select: { id: true },
        },
      };

      if (mediaType === "TV_SHOW") {
        const tvShow = await prisma.tVShow.findUnique({
          where: { id: mediaId },
          select: selectFields,
        });

        if (!tvShow) return null;

        return {
          posterUrl: tvShow.posterUrl,
          backdropUrl: tvShow.backdropUrl,
          nullPosterUrl: tvShow.nullPosterUrl,
          nullBackdropUrl: tvShow.nullBackdropUrl,
          hasExternalId: tvShow.externalIds.length > 0,
        };
      } else {
        const movie = await prisma.movie.findUnique({
          where: { id: mediaId },
          select: selectFields,
        });

        if (!movie) return null;

        return {
          posterUrl: movie.posterUrl,
          backdropUrl: movie.backdropUrl,
          nullPosterUrl: movie.nullPosterUrl,
          nullBackdropUrl: movie.nullBackdropUrl,
          hasExternalId: movie.externalIds.length > 0,
        };
      }
    } catch (error) {
      logger.warn({ error, mediaId }, "Failed to get existing media metadata");
      return null;
    }
  }

  /**
   * Verify if a local image file exists
   */
  private async verifyLocalImageExists(
    imageUrl: string | null
  ): Promise<boolean> {
    if (!imageUrl?.startsWith("/metadata/")) {
      return imageUrl !== null;
    }

    const relativePath = imageUrl.replace("/metadata/", "");
    const fullPath = path.join(this.metadataPath, relativePath);
    try {
      const stats = await fs.stat(fullPath);
      return stats.size > 0;
    } catch {
      return false;
    }
  }

  /**
   * Verify if local poster and backdrop images exist
   */
  async verifyLocalImagesExist(
    posterUrl: string | null,
    backdropUrl: string | null
  ): Promise<{
    posterExists: boolean;
    backdropExists: boolean;
  }> {
    const [posterExists, backdropExists] = await Promise.all([
      this.verifyLocalImageExists(posterUrl),
      this.verifyLocalImageExists(backdropUrl),
    ]);

    return { posterExists, backdropExists };
  }

  /**
   * Check if existing metadata is valid and complete
   */
  async isMetadataValid(
    mediaId: string,
    mediaType: string,
    externalIdSource: string
  ): Promise<boolean> {
    const existingMetadata = await this.getMediaMetadata(
      mediaId,
      mediaType,
      externalIdSource
    );

    if (!existingMetadata) {
      return false;
    }

    const { posterExists, backdropExists } = await this.verifyLocalImagesExist(
      existingMetadata.posterUrl,
      existingMetadata.backdropUrl
    );

    // Check for valid images - nullPoster/nullBackdrop are provider-specific (TMDB)
    // and optional, so we only check the standard poster/backdrop for validation
    const hasValidImages =
      (existingMetadata.posterUrl?.startsWith("/metadata/")
        ? posterExists
        : existingMetadata.posterUrl !== null) ||
      (existingMetadata.backdropUrl?.startsWith("/metadata/")
        ? backdropExists
        : existingMetadata.backdropUrl !== null);

    return existingMetadata.hasExternalId && hasValidImages;
  }
}
