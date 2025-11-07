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
import { isDangerousRootPath, isMediaRootPath } from "./helpers/path-validator.helper";
import { existsSync, statSync } from "fs";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

export const scanControllers = {
  /**
   * Scan a path for media files
   */
  post: asyncHandler(async (req: Request, res: Response) => {
    const { path, options } = req.validatedData as ScanPathRequest;

    // Early validation: check if path is a dangerous root path
    if (isDangerousRootPath(path)) {
      throw new ValidationError(
        "Cannot scan system root directories or entire drives. Please specify a media folder (e.g., /Users/username/Movies)"
      );
    }

    // Map host path to container path if running in Docker
    const mappedPath = mapHostToContainerPath(path);
    
    // Validate that the path exists and is accessible
    try {
      if (!existsSync(mappedPath)) {
        throw new ValidationError(
          `Path does not exist or is not accessible: ${path}`
        );
      }
      
      const stats = statSync(mappedPath);
      if (!stats.isDirectory()) {
        throw new ValidationError(
          `Path must be a directory, not a file: ${path}`
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Cannot access path: ${path}. Please check permissions and path validity.`
      );
    }

    // Check if this is a broad media root path with multiple collections
    // Note: For TV shows, having multiple show folders is EXPECTED and normal
    // Only check for broad roots when mixing different media types
    const mediaType = options?.mediaType;
    
    // Only perform broad root check if media type is not TV
    // TV libraries naturally contain multiple shows in subdirectories
    if (mediaType !== 'tv') {
      const mediaRootCheck = await isMediaRootPath(mappedPath);
      if (mediaRootCheck.isBroadMediaRoot) {
        logger.warn(
          `⚠️  Detected broad media root path: ${path}`
        );
        logger.warn(
          `   Found collections: ${mediaRootCheck.detectedCollections.join(", ")}`
        );
        logger.warn(
          `   ${mediaRootCheck.recommendation}`
        );
        
        throw new ValidationError(
          mediaRootCheck.recommendation || 
          "This path contains multiple media collections. Please scan specific collections individually for better organization and performance."
        );
      }
    }

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

    // Start the scan in the background (don't await)
    // This allows us to return immediately while the scan progresses
    scanServices.post(mappedPath, finalOptions)
      .then((result) => {
        logger.info(
          `✅ Scan completed: ${result.libraryName} (${result.totalSaved}/${result.totalFiles} items)`
        );
      })
      .catch((error) => {
        // Send error via WebSocket
        const errorMessage =
          error instanceof Error ? error.message : "Failed to scan path";
        logger.error(`❌ Scan failed: ${errorMessage}`);
        wsManager.sendScanError({
          error: errorMessage,
        });
      });

    // Return immediately with 202 Accepted
    // Client will receive progress updates via WebSocket
    return res.status(202).json({
      success: true,
      message: "Scan started successfully. Progress will be sent via WebSocket.",
      data: {
        path: path,
        mediaType: options?.mediaType,
      },
    });
  }),
};
