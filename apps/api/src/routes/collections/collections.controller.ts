import type { Request, Response, NextFunction } from "express";
import { collectionsService } from "./collections.service.js";
import { BadRequestError, AppError } from "../../lib/errors.js";

export class CollectionsController {
  /**
   * GET /api/collections
   * Get all collections
   */
  async getCollections(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const collections = await collectionsService.getCollections();

      res.jsonOk({
        message: `Found ${collections.length} collections`,
        collections,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch collections", { cause: error }));
      }
    }
  }

  /**
   * GET /api/collections/:slugOrId
   * Get a single collection by slug or ID
   */
  async getCollectionBySlugOrId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { slugOrId } = req.params;

      if (!slugOrId) {
        throw new BadRequestError("Collection slug or ID is required");
      }

      const collection =
        await collectionsService.getCollectionBySlugOrId(slugOrId);

      res.jsonOk({
        message: "Retrieved collection",
        collection,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch collection", { cause: error }));
      }
    }
  }

  /**
   * GET /api/collections/statistics
   * Get collection statistics
   */
  async getStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await collectionsService.getStatistics();

      res.jsonOk({
        message: "Retrieved collection statistics",
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

  /**
   * DELETE /api/collections/:id
   * Delete a collection by ID
   */
  async deleteCollection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("Collection ID is required");
      }

      const deleted = await collectionsService.deleteCollection(id);

      res.jsonOk({
        message: `Collection "${deleted.name}" deleted successfully`,
        collection: deleted,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to delete collection", { cause: error }));
      }
    }
  }
}

// Export singleton instance
export const collectionsController = new CollectionsController();
