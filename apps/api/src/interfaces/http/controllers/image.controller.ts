import type { Request, Response } from "express";
import { imageService } from "../../../app/image";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../../infrastructure/utils/errors";
import { getMimeType } from "../../../infrastructure/utils/mime-types";
import { z } from "zod";
import { getImageSchema } from "../schemas/image.schema";
import { promises as fs } from "fs";
import { createReadStream } from "fs";
import path from "path";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";

type GetImageRequest = z.infer<typeof getImageSchema>;

export const imageControllers = {
  /**
   * Get image file by path
   */
  getImage: asyncHandler(async (req: Request, res: Response) => {
    // Get path from path parameter (wildcard route captures everything)
    // Express with :path(*) stores it in req.params.path
    // Also check req.params[0] as fallback for different route patterns
    let imagePath = req.params.path || req.params[0];

    // If path is still not found, try to extract from the URL
    if (!imagePath && req.url) {
      // Remove the /api/v1/image prefix to get the actual path
      const urlPath = req.url.replace(/^\/api\/v1\/image\/?/, "").split("?")[0]; // Remove query params
      if (urlPath) {
        imagePath = decodeURIComponent(urlPath);
      }
    }

    if (!imagePath) {
      logger.error(
        `Image path not found in request. URL: ${req.url}, Params: ${JSON.stringify(req.params)}`
      );
      throw new NotFoundError("Image", "path not provided");
    }

    // Decode URL encoding if present
    imagePath = decodeURIComponent(imagePath);

    logger.info(`Getting image: ${imagePath} (from URL: ${req.url})`);

    // Check if image exists
    const imageInfo = await imageService.checkImageExists(imagePath);

    if (!imageInfo.exists) {
      logger.error(`Image not found: ${imageInfo.filePath}`);
      throw new NotFoundError("Image", imagePath);
    }

    const filePath = imageInfo.filePath;

    // Get file stats
    let fileStats;
    try {
      fileStats = await fs.stat(filePath);
      logger.debug(`Image found: ${filePath} (${fileStats.size} bytes)`);
    } catch (statError) {
      logger.error(`Image stat error: ${filePath}`, statError);
      throw new NotFoundError("Image", imagePath);
    }

    const fileSize = fileStats.size;

    // Get content type from file extension
    const ext = path.extname(filePath);
    const contentType = getMimeType(ext) || "image/jpeg";

    // Set headers for image caching
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", fileSize);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Accept-Ranges", "bytes");

    // Create read stream
    const fileStream = createReadStream(filePath, {
      highWaterMark: 64 * 1024, // 64KB chunks for images
    });

    fileStream.on("error", (error) => {
      logger.error(`Stream error for ${filePath}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "Failed to stream image",
        });
      }
    });

    res.on("close", () => {
      fileStream.destroy();
    });

    res.status(200);
    return fileStream.pipe(res);
  }),
};
