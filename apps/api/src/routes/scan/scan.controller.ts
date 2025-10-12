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
  async scanDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  /**
   * GET /api/scan/supported-extensions
   * Returns supported file extensions for each media type
   */
  async getSupportedExtensions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mediaType } = req.query;

      if (mediaType) {
        const extensions = scanService.getSupportedExtensions(
          mediaType as MediaType
        );
        res.jsonOk({
          mediaType,
          extensions,
        });
      } else {
        const allExtensions: Record<string, string[]> = {};
        for (const type of scanService.getSupportedMediaTypes()) {
          allExtensions[type] = scanService.getSupportedExtensions(type);
        }
        res.jsonOk({
          supportedExtensions: allExtensions,
        });
      }
    } catch (error) {
      next(new AppError("Failed to fetch supported extensions", { cause: error }));
    }
  }

  /**
   * GET /api/scan/media-types
   * Returns all supported media types
   */
  async getMediaTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mediaTypes = scanService.getSupportedMediaTypes();
      res.jsonOk({
        mediaTypes,
      });
    } catch (error) {
      next(new AppError("Failed to fetch media types", { cause: error }));
    }
  }
}

// Export singleton instance
export const scanController = new ScanController();

