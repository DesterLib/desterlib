/**
 * Bulk Operations Service
 *
 * Provides batch operations for media items:
 * - Bulk delete
 * - Bulk update metadata
 * - Bulk add to collection
 * - Bulk remove from collection
 * - Bulk refresh metadata
 */

import { prisma } from "../prisma.js";
import { BadRequestError, NotFoundError } from "../errors.js";
import { invalidateCache } from "../cacheMiddleware.js";
import logger from "../../config/logger.js";
import type { MediaType } from "../../generated/prisma/index.js";

export interface BulkDeleteOptions {
  mediaIds: string[];
  deleteFiles?: boolean;
}

export interface BulkDeleteResult {
  success: boolean;
  deleted: number;
  failed: number;
  errors: Array<{ mediaId: string; error: string }>;
}

export interface BulkUpdateOptions {
  mediaIds: string[];
  updates: {
    genreIds?: string[];
    personIds?: string[];
    rating?: number;
    notes?: string;
  };
}

export interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: Array<{ mediaId: string; error: string }>;
}

export interface BulkCollectionOptions {
  mediaIds: string[];
  collectionId: string;
}

export interface BulkCollectionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ mediaId: string; error: string }>;
}

export interface BulkMetadataRefreshOptions {
  mediaIds: string[];
  force?: boolean;
}

export interface BulkMetadataRefreshResult {
  success: boolean;
  queued: number;
  failed: number;
  errors: Array<{ mediaId: string; error: string }>;
}

class BulkOperationsService {
  /**
   * Bulk delete media items
   */
  async deleteMedia(options: BulkDeleteOptions): Promise<BulkDeleteResult> {
    const { mediaIds, deleteFiles = false } = options;

    if (!mediaIds || mediaIds.length === 0) {
      throw new BadRequestError("No media IDs provided");
    }

    if (mediaIds.length > 1000) {
      throw new BadRequestError("Cannot delete more than 1000 items at once");
    }

    const result: BulkDeleteResult = {
      success: true,
      deleted: 0,
      failed: 0,
      errors: [],
    };

    logger.info(`Starting bulk delete of ${mediaIds.length} media items`, {
      deleteFiles,
    });

    for (const mediaId of mediaIds) {
      try {
        // Check if media exists
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
          include: {
            movie: true,
            tvShow: {
              include: {
                seasons: {
                  include: {
                    episodes: true,
                  },
                },
              },
            },
            music: true,
            comic: true,
          },
        });

        if (!media) {
          result.failed++;
          result.errors.push({
            mediaId,
            error: "Media not found",
          });
          continue;
        }

        // TODO: If deleteFiles is true, delete actual files from disk
        // This requires careful implementation to avoid data loss

        // Delete from database
        await prisma.media.delete({
          where: { id: mediaId },
        });

        result.deleted++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          mediaId,
          error: (error as Error).message,
        });
        logger.error(`Failed to delete media ${mediaId}:`, error);
      }
    }

    // Invalidate cache
    await invalidateCache("cache:GET:/api/v1/media*");

    result.success = result.failed === 0;

    logger.info(
      `Bulk delete completed: ${result.deleted} deleted, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Bulk update media metadata
   */
  async updateMedia(options: BulkUpdateOptions): Promise<BulkUpdateResult> {
    const { mediaIds, updates } = options;

    if (!mediaIds || mediaIds.length === 0) {
      throw new BadRequestError("No media IDs provided");
    }

    if (mediaIds.length > 1000) {
      throw new BadRequestError("Cannot update more than 1000 items at once");
    }

    const result: BulkUpdateResult = {
      success: true,
      updated: 0,
      failed: 0,
      errors: [],
    };

    logger.info(`Starting bulk update of ${mediaIds.length} media items`);

    for (const mediaId of mediaIds) {
      try {
        // Check if media exists
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        });

        if (!media) {
          result.failed++;
          result.errors.push({
            mediaId,
            error: "Media not found",
          });
          continue;
        }

        // Build update object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};

        if (updates.rating !== undefined) {
          updateData.rating = updates.rating;
        }

        // Update genres
        if (updates.genreIds) {
          updateData.genres = {
            set: updates.genreIds.map((id) => ({ id })),
          };
        }

        // Update persons
        if (updates.personIds) {
          updateData.persons = {
            set: updates.personIds.map((id) => ({ id })),
          };
        }

        // Perform update
        await prisma.media.update({
          where: { id: mediaId },
          data: updateData,
        });

        result.updated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          mediaId,
          error: (error as Error).message,
        });
        logger.error(`Failed to update media ${mediaId}:`, error);
      }
    }

    // Invalidate cache
    await invalidateCache("cache:GET:/api/v1/media*");

    result.success = result.failed === 0;

    logger.info(
      `Bulk update completed: ${result.updated} updated, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Bulk add media to collection
   */
  async addToCollection(
    options: BulkCollectionOptions
  ): Promise<BulkCollectionResult> {
    const { mediaIds, collectionId } = options;

    if (!mediaIds || mediaIds.length === 0) {
      throw new BadRequestError("No media IDs provided");
    }

    if (!collectionId) {
      throw new BadRequestError("Collection ID is required");
    }

    if (mediaIds.length > 1000) {
      throw new BadRequestError("Cannot process more than 1000 items at once");
    }

    // Check if collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    const result: BulkCollectionResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    logger.info(
      `Adding ${mediaIds.length} media items to collection ${collectionId}`
    );

    for (const mediaId of mediaIds) {
      try {
        // Check if media exists
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        });

        if (!media) {
          result.failed++;
          result.errors.push({
            mediaId,
            error: "Media not found",
          });
          continue;
        }

        // Check if already in collection
        const existing = await prisma.mediaCollection.findUnique({
          where: {
            mediaId_collectionId: {
              mediaId,
              collectionId,
            },
          },
        });

        if (existing) {
          result.processed++;
          continue; // Already in collection, skip
        }

        // Add to collection
        await prisma.mediaCollection.create({
          data: {
            mediaId,
            collectionId,
          },
        });

        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          mediaId,
          error: (error as Error).message,
        });
        logger.error(`Failed to add media ${mediaId} to collection:`, error);
      }
    }

    // Invalidate cache
    await invalidateCache("cache:GET:/api/v1/collections*");

    result.success = result.failed === 0;

    logger.info(
      `Bulk add to collection completed: ${result.processed} processed, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Bulk remove media from collection
   */
  async removeFromCollection(
    options: BulkCollectionOptions
  ): Promise<BulkCollectionResult> {
    const { mediaIds, collectionId } = options;

    if (!mediaIds || mediaIds.length === 0) {
      throw new BadRequestError("No media IDs provided");
    }

    if (!collectionId) {
      throw new BadRequestError("Collection ID is required");
    }

    if (mediaIds.length > 1000) {
      throw new BadRequestError("Cannot process more than 1000 items at once");
    }

    const result: BulkCollectionResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    logger.info(
      `Removing ${mediaIds.length} media items from collection ${collectionId}`
    );

    for (const mediaId of mediaIds) {
      try {
        // Remove from collection
        await prisma.mediaCollection.deleteMany({
          where: {
            mediaId,
            collectionId,
          },
        });

        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          mediaId,
          error: (error as Error).message,
        });
        logger.error(
          `Failed to remove media ${mediaId} from collection:`,
          error
        );
      }
    }

    // Invalidate cache
    await invalidateCache("cache:GET:/api/v1/collections*");

    result.success = result.failed === 0;

    logger.info(
      `Bulk remove from collection completed: ${result.processed} processed, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Bulk refresh metadata (queue for background processing)
   */
  async refreshMetadata(
    options: BulkMetadataRefreshOptions
  ): Promise<BulkMetadataRefreshResult> {
    const { mediaIds, force: _force = false } = options;

    if (!mediaIds || mediaIds.length === 0) {
      throw new BadRequestError("No media IDs provided");
    }

    if (mediaIds.length > 500) {
      throw new BadRequestError("Cannot refresh more than 500 items at once");
    }

    const result: BulkMetadataRefreshResult = {
      success: true,
      queued: 0,
      failed: 0,
      errors: [],
    };

    logger.info(`Queueing ${mediaIds.length} media items for metadata refresh`);

    for (const mediaId of mediaIds) {
      try {
        // Check if media exists
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        });

        if (!media) {
          result.failed++;
          result.errors.push({
            mediaId,
            error: "Media not found",
          });
          continue;
        }

        // TODO: Implement actual metadata refresh logic
        // This would typically involve:
        // 1. Fetching metadata from TMDB/other sources
        // 2. Updating the database
        // For now, we'll just mark it as queued

        logger.info(`Queued media ${mediaId} for metadata refresh`);
        result.queued++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          mediaId,
          error: (error as Error).message,
        });
        logger.error(`Failed to queue media ${mediaId} for refresh:`, error);
      }
    }

    result.success = result.failed === 0;

    logger.info(
      `Bulk metadata refresh completed: ${result.queued} queued, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Get bulk operation statistics
   */
  async getStatistics(): Promise<{
    totalMedia: number;
    mediaByType: Record<MediaType, number>;
  }> {
    const [totalMedia, mediaByType] = await Promise.all([
      prisma.media.count(),
      prisma.media.groupBy({
        by: ["type"],
        _count: true,
      }),
    ]);

    const typeMap: Record<MediaType, number> = {
      MOVIE: 0,
      TV_SHOW: 0,
      MUSIC: 0,
      COMIC: 0,
    };

    mediaByType.forEach((item) => {
      typeMap[item.type] = item._count;
    });

    return {
      totalMedia,
      mediaByType: typeMap,
    };
  }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService();
