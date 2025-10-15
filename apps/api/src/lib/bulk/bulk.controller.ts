/**
 * Bulk Operations Controller
 *
 * Handles HTTP requests for bulk operations
 */

import type { Request, Response, NextFunction } from "express";
import { bulkOperationsService } from "./bulk.service.js";
import { BadRequestError, AppError } from "../errors.js";

export class BulkOperationsController {
  /**
   * POST /api/v1/bulk/delete
   * Bulk delete media items
   */
  async deleteMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mediaIds, deleteFiles } = req.body;

      if (!Array.isArray(mediaIds)) {
        throw new BadRequestError("mediaIds must be an array");
      }

      const result = await bulkOperationsService.deleteMedia({
        mediaIds,
        deleteFiles: deleteFiles === true,
      });

      res.jsonOk({
        message: `Bulk delete completed: ${result.deleted} deleted, ${result.failed} failed`,
        result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to bulk delete media", { cause: error }));
      }
    }
  }

  /**
   * POST /api/v1/bulk/update
   * Bulk update media metadata
   */
  async updateMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mediaIds, updates } = req.body;

      if (!Array.isArray(mediaIds)) {
        throw new BadRequestError("mediaIds must be an array");
      }

      if (!updates || typeof updates !== "object") {
        throw new BadRequestError("updates object is required");
      }

      const result = await bulkOperationsService.updateMedia({
        mediaIds,
        updates,
      });

      res.jsonOk({
        message: `Bulk update completed: ${result.updated} updated, ${result.failed} failed`,
        result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to bulk update media", { cause: error }));
      }
    }
  }

  /**
   * POST /api/v1/bulk/add-to-collection
   * Bulk add media to collection
   */
  async addToCollection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mediaIds, collectionId } = req.body;

      if (!Array.isArray(mediaIds)) {
        throw new BadRequestError("mediaIds must be an array");
      }

      if (!collectionId || typeof collectionId !== "string") {
        throw new BadRequestError("collectionId is required");
      }

      const result = await bulkOperationsService.addToCollection({
        mediaIds,
        collectionId,
      });

      res.jsonOk({
        message: `Bulk add to collection completed: ${result.processed} processed, ${result.failed} failed`,
        result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(
          new AppError("Failed to bulk add to collection", { cause: error })
        );
      }
    }
  }

  /**
   * POST /api/v1/bulk/remove-from-collection
   * Bulk remove media from collection
   */
  async removeFromCollection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mediaIds, collectionId } = req.body;

      if (!Array.isArray(mediaIds)) {
        throw new BadRequestError("mediaIds must be an array");
      }

      if (!collectionId || typeof collectionId !== "string") {
        throw new BadRequestError("collectionId is required");
      }

      const result = await bulkOperationsService.removeFromCollection({
        mediaIds,
        collectionId,
      });

      res.jsonOk({
        message: `Bulk remove from collection completed: ${result.processed} processed, ${result.failed} failed`,
        result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(
          new AppError("Failed to bulk remove from collection", {
            cause: error,
          })
        );
      }
    }
  }

  /**
   * POST /api/v1/bulk/refresh-metadata
   * Bulk refresh metadata
   */
  async refreshMetadata(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mediaIds, force } = req.body;

      if (!Array.isArray(mediaIds)) {
        throw new BadRequestError("mediaIds must be an array");
      }

      const result = await bulkOperationsService.refreshMetadata({
        mediaIds,
        force: force === true,
      });

      res.jsonOk({
        message: `Bulk metadata refresh queued: ${result.queued} queued, ${result.failed} failed`,
        result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to bulk refresh metadata", { cause: error }));
      }
    }
  }

  /**
   * GET /api/v1/bulk/statistics
   * Get bulk operation statistics
   */
  async getStatistics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await bulkOperationsService.getStatistics();

      res.jsonOk({
        message: "Retrieved bulk operation statistics",
        statistics: stats,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch statistics", { cause: error }));
      }
    }
  }
}

// Export singleton instance
export const bulkOperationsController = new BulkOperationsController();
