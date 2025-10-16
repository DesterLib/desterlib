import type { Request, Response } from "express";
import { collectionsService } from "./collections.service.js";

export class CollectionsController {
  /**
   * GET /api/v1/collections
   * Get all collections
   */
  async getCollections(_req: Request, res: Response): Promise<void> {
    const collections = await collectionsService.getCollections();

    res.jsonOk({
      message: `Found ${collections.length} collections`,
      collections,
    });
  }

  /**
   * GET /api/v1/collections/:slugOrId
   * Get a single collection by slug or ID
   */
  async getCollectionBySlugOrId(req: Request, res: Response): Promise<void> {
    const { slugOrId } = req.params;

    // Validated by middleware, safe to assert as string
    const collection = await collectionsService.getCollectionBySlugOrId(
      slugOrId as string
    );

    res.jsonOk({
      message: "Retrieved collection",
      collection,
    });
  }

  /**
   * GET /api/v1/collections/statistics
   * Get collection statistics
   */
  async getStatistics(_req: Request, res: Response): Promise<void> {
    const stats = await collectionsService.getStatistics();

    res.jsonOk({
      message: "Retrieved collection statistics",
      statistics: stats,
    });
  }

  /**
   * GET /api/v1/collections/libraries
   * Get all libraries (collections with isLibrary=true)
   */
  async getLibraries(_req: Request, res: Response): Promise<void> {
    const libraries = await collectionsService.getLibraries();

    res.jsonOk({
      message: `Found ${libraries.length} libraries`,
      collections: libraries,
    });
  }

  /**
   * DELETE /api/v1/collections/:id
   * Delete a collection by ID
   */
  async deleteCollection(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Validated by middleware, safe to assert as string
    const deleted = await collectionsService.deleteCollection(id as string);

    res.jsonOk({
      message: `Collection "${deleted.name}" deleted successfully`,
      collection: deleted,
    });
  }

  /**
   * POST /api/v1/collections/cleanup-orphaned
   * Clean up orphaned media (media not associated with any collection)
   */
  async cleanupOrphanedMedia(_req: Request, res: Response): Promise<void> {
    const result = await collectionsService.cleanupOrphanedMedia();

    res.jsonOk({
      message:
        result.deleted === 0
          ? "No orphaned media found"
          : `Cleaned up ${result.deleted} orphaned media item${result.deleted === 1 ? "" : "s"}`,
      cleanup: result,
    });
  }
}

// Export singleton instance
export const collectionsController = new CollectionsController();
