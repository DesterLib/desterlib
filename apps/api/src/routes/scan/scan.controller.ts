import type { Request, Response, NextFunction } from "express";
import { scanService, type MediaType } from "./scan.service.js";
import { BadRequestError, AppError } from "../../lib/errors.js";

export class ScanController {
  /**
   * POST /api/scan
   * Scans a directory for media files (only adds new files)
   *
   * Body:
   * - path: string (required) - Directory path to scan
   * - mediaType: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'COMIC' (required)
   * - collectionName?: string (optional) - Name for the collection, defaults to folder name
   */
  async scanDirectory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { path, mediaType, collectionName } = req.body;

      // Validate required fields
      if (!path) {
        throw new BadRequestError("Path is required in request body");
      }

      if (!mediaType) {
        throw new BadRequestError("MediaType is required in request body");
      }

      // Perform the scan
      const result = await scanService.scan({
        path,
        mediaType: mediaType as MediaType,
        collectionName,
      });

      // Generate appropriate message based on results
      let message: string;
      if (result.totalFiles === 0) {
        message = `No ${mediaType} files found in the specified directory`;
      } else if (result.stats.added === 0) {
        message = `All ${result.totalFiles} ${mediaType} files already exist in the collection`;
      } else if (result.stats.skipped === 0) {
        message = `Successfully added ${result.stats.added} new ${mediaType} files`;
      } else {
        message = `Scanned ${result.totalFiles} ${mediaType} files (${result.stats.added} added, ${result.stats.skipped} already exist)`;
      }

      res.jsonOk({
        message,
        scan: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to scan directory", { cause: error }));
      }
    }
  }

  /**
   * POST /api/scan/sync
   * Syncs a collection - checks for file modifications and removals
   *
   * Body:
   * - collectionName: string (required) - Name of the collection to sync
   * - mediaType: 'MOVIE' | 'TV_SHOW' | 'MUSIC' | 'COMIC' (required)
   */
  async syncCollection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { collectionName, mediaType } = req.body;

      // Validate required fields
      if (!collectionName) {
        throw new BadRequestError(
          "Collection name is required in request body"
        );
      }

      if (!mediaType) {
        throw new BadRequestError("MediaType is required in request body");
      }

      // Perform the sync
      const result = await scanService.syncCollection(
        collectionName,
        mediaType as MediaType
      );

      res.jsonOk({
        message: `Sync complete: ${result.stats.checked} files checked, ${result.stats.updated} updated, ${result.stats.removed} removed`,
        sync: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to sync collection", { cause: error }));
      }
    }
  }

  /**
   * POST /api/scan/sync-all
   * Syncs all collections in the database
   * This endpoint should be called by a cron job
   */
  async syncAllCollections(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Perform sync on all collections
      const results = await scanService.syncAllCollections();

      const totalChecked = results.reduce((sum, r) => sum + r.stats.checked, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.stats.updated, 0);
      const totalRemoved = results.reduce((sum, r) => sum + r.stats.removed, 0);

      res.jsonOk({
        message: `Synced ${results.length} collection(s): ${totalChecked} files checked, ${totalUpdated} updated, ${totalRemoved} removed`,
        syncs: results,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to sync all collections", { cause: error }));
      }
    }
  }
}

// Export singleton instance
export const scanController = new ScanController();
