import type { Request, Response, NextFunction } from "express";
import { scanService, type MediaType } from "./scan.service.js";
import { BadRequestError, AppError } from "../../lib/errors.js";

export class ScanController {
  /**
   * POST /api/scan
   * Scans a directory for media files
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

      res.jsonOk({
        message: `Successfully scanned ${result.totalFiles} ${mediaType} files`,
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
}

// Export singleton instance
export const scanController = new ScanController();
