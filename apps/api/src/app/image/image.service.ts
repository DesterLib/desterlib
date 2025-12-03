import { config } from "../../config/env";
import { promises as fs } from "fs";
import path from "path";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../infrastructure/utils/errors";

export interface ImageFileInfo {
  filePath: string;
  exists: boolean;
}

export const imageService = {
  /**
   * Get image file path from a metadata path
   * The path is relative to the metadata directory (e.g., movies/posters/tmdb12345.jpg)
   */
  getImagePath: (imagePath: string): string => {
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.slice(1)
      : imagePath;

    // Security: prevent directory traversal
    if (cleanPath.includes("..")) {
      throw new NotFoundError("Image", imagePath);
    }

    // Build full path using metadataPath from config
    // The path is already relative to metadata directory
    const fullPath = path.join(config.metadataPath, cleanPath);

    // Additional security: ensure the resolved path is within metadata directory
    const resolvedMetadataPath = path.resolve(config.metadataPath);
    const resolvedFullPath = path.resolve(fullPath);

    if (!resolvedFullPath.startsWith(resolvedMetadataPath)) {
      throw new NotFoundError("Image", imagePath);
    }

    return fullPath;
  },

  /**
   * Check if image file exists
   */
  checkImageExists: async (imagePath: string): Promise<ImageFileInfo> => {
    const fullPath = imageService.getImagePath(imagePath);

    try {
      await fs.access(fullPath);
      return {
        filePath: fullPath,
        exists: true,
      };
    } catch {
      return {
        filePath: fullPath,
        exists: false,
      };
    }
  },
};
