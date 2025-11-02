import { Request, Response } from "express";
import { scanServices } from "./scan.services";
import { scanPathSchema } from "./scan.schema";
import { getTmdbApiKey } from "../../core/config/settings";
import { z } from "zod";
import {
  logger,
  mapHostToContainerPath,
  sendSuccess,
  asyncHandler,
  ValidationError,
} from "@/lib/utils";
import { wsManager } from "@/lib/websocket";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

export const scanControllers = {
  /**
   * Scan a path for media files
   */
  post: asyncHandler(async (req: Request, res: Response) => {
    const { path, options } = req.validatedData as ScanPathRequest;

    // Map host path to container path if running in Docker
    const mappedPath = mapHostToContainerPath(path);

    // Get TMDB API key from database settings
    const tmdbApiKey = await getTmdbApiKey();
    if (!tmdbApiKey) {
      throw new ValidationError("TMDB API key is required. Please configure it in settings.");
    }

    const finalOptions = {
      ...options,
      tmdbApiKey,
      // Pass the original path for database storage and display
      originalPath: path !== mappedPath ? path : undefined,
    };

    logger.info(`Scanning path: ${mappedPath} (original: ${path})`);

    try {
      // Call the scanning service with the mapped path for scanning but original path for storage
      const result = await scanServices.post(mappedPath, finalOptions);

      return sendSuccess(
        res,
        {
          libraryId: result.libraryId,
          libraryName: result.libraryName,
          totalFiles: result.totalFiles,
          totalSaved: result.totalSaved,
          cacheStats: result.cacheStats,
        },
        200,
        "Scan completed successfully"
      );
    } catch (error) {
      // Send error via WebSocket
      const errorMessage =
        error instanceof Error ? error.message : "Failed to scan path";
      wsManager.sendScanError({
        error: errorMessage,
      });
      throw error; // Re-throw to be handled by global error handler
    }
  }),
};
