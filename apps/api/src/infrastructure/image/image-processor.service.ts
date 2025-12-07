import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import { logger } from "@dester/logger";

/**
 * Image Processor Service
 * Handles downloading and compressing images from metadata providers
 */
export class ImageProcessorService {
  private baseStoragePath: string;

  constructor(baseStoragePath: string) {
    this.baseStoragePath = baseStoragePath;
  }

  /**
   * Maps MediaType enum to folder name
   */
  private getMediaTypeFolder(mediaType: string | null): string {
    if (!mediaType) return "movies";

    const typeMap: Record<string, string> = {
      MOVIE: "movies",
      TV_SHOW: "tv",
      MUSIC: "music",
      COMIC: "comics",
    };

    return typeMap[mediaType.toUpperCase()] || "movies";
  }

  /**
   * Downloads, compresses, and saves an image locally
   * Images are stored in a shared global structure: {mediaType}/{type}s/{filename}
   */
  async processImage(
    url: string | null,
    type: "poster" | "backdrop" | "null-poster" | "null-backdrop" | "logo",
    providerId: string,
    mediaType: string | null = null
  ): Promise<string | null> {
    if (!url) return null;

    try {
      // Logos should be PNG to preserve transparency, others can be JPEG
      const fileExtension = type === "logo" ? "png" : "jpg";
      const fileName = `${providerId}.${fileExtension}`;

      const folderMap: Record<string, string> = {
        poster: "posters",
        backdrop: "backdrops",
        "null-poster": "null-posters",
        "null-backdrop": "null-backdrops",
        logo: "logos",
      };
      const folderName = folderMap[type]!; // Non-null assertion: type is constrained to valid keys
      const mediaTypeFolder = this.getMediaTypeFolder(mediaType);
      const subDir = path.join(mediaTypeFolder, folderName);

      const relativePath = path.join(subDir, fileName);
      const fullPath = path.join(this.baseStoragePath, relativePath);

      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Check if file already exists and is valid
      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > 0) {
            await sharp(fullPath).metadata();
            logger.debug(`Image already exists and is valid: ${relativePath}`);
            return relativePath;
          } else {
            logger.warn(`Image file is empty, removing: ${relativePath}`);
            fs.unlinkSync(fullPath);
          }
        } catch (error) {
          logger.warn(
            `Image file is corrupted or invalid, removing: ${relativePath}`,
            error instanceof Error ? error.message : String(error)
          );
          try {
            fs.unlinkSync(fullPath);
          } catch (unlinkError) {
            // Ignore unlink errors
          }
        }
      }

      logger.debug(`Downloading image: ${url}`);

      const response = await axios({
        url,
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data, "binary");

      // Configure compression based on type
      let pipeline = sharp(buffer);

      if (type === "poster" || type === "null-poster") {
        pipeline = pipeline.resize(500, null, { withoutEnlargement: true });
      } else if (type === "logo") {
        pipeline = pipeline.resize(300, null, { withoutEnlargement: true });
      } else {
        pipeline = pipeline.resize(1280, null, { withoutEnlargement: true });
      }

      // Save logos as PNG to preserve transparency, others as JPEG
      if (type === "logo") {
        await pipeline.png({ compressionLevel: 9 }).toFile(fullPath);
      } else {
        await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(fullPath);
      }

      logger.info(`Saved and compressed ${type}: ${relativePath}`);
      return relativePath;
    } catch (error) {
      logger.error(
        `Failed to process image ${url} for ${providerId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }
}
