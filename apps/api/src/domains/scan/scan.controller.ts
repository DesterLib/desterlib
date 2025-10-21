import { Request, Response } from "express";
import { scanServices } from "./scan.services";
import { scanPathSchema } from "./scan.schema";
import { getTmdbApiKey } from "../../core/config/settings";
import { z } from "zod";
import { logger, mapHostToContainerPath } from "@/lib/utils";
import { wsManager } from "@/lib/websocket";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

export const scanControllers = {
  post: async (req: Request, res: Response) => {
    try {
      const validatedData = req.validatedData as ScanPathRequest;

      if (!validatedData) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Request data is missing or invalid",
        });
      }

      const { path, options } = validatedData;

      // Map host path to container path if running in Docker
      const mappedPath = mapHostToContainerPath(path);

      // Get TMDB API key from database settings
      const tmdbApiKey = await getTmdbApiKey();
      if (!tmdbApiKey) {
        throw new Error("TMDB API key is required");
      }

      const finalOptions = {
        ...options,
        tmdbApiKey,
        // Pass the original path for database storage and display
        originalPath: path !== mappedPath ? path : undefined,
      };

      logger.info(`Scanning path: ${mappedPath} (original: ${path})`);

      // Call the scanning service with the mapped path for scanning but original path for storage
      const result = await scanServices.post(mappedPath, finalOptions);

      return res.status(200).json({
        success: true,
        message: "Scan completed successfully",
        libraryId: result.libraryId,
        libraryName: result.libraryName,
        totalFiles: result.totalFiles,
        totalSaved: result.totalSaved,
        cacheStats: result.cacheStats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to scan path";
      logger.error(`Scan path controller error: ${errorMessage}`);

      // Send error via WebSocket
      wsManager.sendScanError({
        error: errorMessage,
      });

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },
};
