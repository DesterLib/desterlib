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
import { Prisma, type MediaType } from "../../generated/prisma/index.js";

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

        // Delete physical files if requested
        if (options.deleteFiles) {
          const filesToDelete: string[] = [];

          // Collect file paths
          if (media.movie?.filePath) {
            filesToDelete.push(media.movie.filePath);
          }
          if (media.music?.filePath) {
            filesToDelete.push(media.music.filePath);
          }
          if (media.comic?.filePath) {
            filesToDelete.push(media.comic.filePath);
          }
          if (media.tvShow) {
            for (const season of media.tvShow.seasons) {
              for (const episode of season.episodes) {
                if (episode.filePath) {
                  filesToDelete.push(episode.filePath);
                }
              }
            }
          }

          // Delete files from disk
          const fs = await import("fs/promises");
          for (const filePath of filesToDelete) {
            try {
              await fs.unlink(filePath);
              logger.info(`Deleted file: ${filePath}`);
            } catch (error) {
              logger.error(`Failed to delete file ${filePath}:`, error);
              // Continue with other files even if one fails
            }
          }
        }

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
        const updateData: Prisma.MediaUpdateInput = {};

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
          updateData.people = {
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
        // Check if media exists and get external IDs
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
          include: { externalIds: true },
        });

        if (!media) {
          result.failed++;
          result.errors.push({
            mediaId,
            error: "Media not found",
          });
          continue;
        }

        // Find TMDB ID
        const tmdbId = media.externalIds.find(
          (ext) => ext.source === "TMDB"
        )?.externalId;

        if (!tmdbId) {
          result.failed++;
          result.errors.push({
            mediaId,
            error: "No TMDB ID found",
          });
          logger.warn(`No TMDB ID found for media ${mediaId}`);
          continue;
        }

        // Fetch and update metadata based on media type
        if (media.type === "MOVIE" || media.type === "TV_SHOW") {
          // Use metadata service to fetch fresh data
          const { MetadataService } = await import(
            "../metadata/metadataService.js"
          );
          const metadataService = MetadataService.getInstance();

          const freshMetadata = await metadataService.getMetadata(
            tmdbId,
            "TMDB",
            media.type
          );

          if (freshMetadata) {
            // Update media fields
            await prisma.media.update({
              where: { id: mediaId },
              data: {
                title: freshMetadata.title,
                description: freshMetadata.description,
                posterUrl: freshMetadata.posterUrl,
                backdropUrl: freshMetadata.backdropUrl,
                releaseDate: freshMetadata.releaseDate,
                rating: freshMetadata.rating,
              },
            });

            // Update genres if available
            if (freshMetadata.genres && freshMetadata.genres.length > 0) {
              const { genreService } = await import("../genreService.js");
              await genreService.updateGenresForMedia(
                mediaId,
                freshMetadata.genres
              );
            }

            logger.info(`Refreshed metadata for ${media.type} ${mediaId}`);
            result.queued++;
          } else {
            throw new Error("Failed to fetch metadata from TMDB");
          }
        } else {
          // Music and Comics don't use TMDB
          result.failed++;
          result.errors.push({
            mediaId,
            error: `Metadata refresh not supported for ${media.type}`,
          });
        }
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
