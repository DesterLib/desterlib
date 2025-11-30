import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import { Logger } from "@dester/logger";

export class ImageProcessor {
  private logger: Logger;
  private baseStoragePath: string;

  constructor(logger: Logger, baseStoragePath: string = "metadata") {
    this.logger = logger;
    this.baseStoragePath = baseStoragePath;
    // Directories are created on-demand when processing images
  }

  /**
   * Maps MediaType enum to folder name
   */
  private getMediaTypeFolder(mediaType: string | null): string {
    if (!mediaType) return "movies"; // Default fallback

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
   * @param url Remote URL of the image
   * @param type 'poster' or 'backdrop'
   * @param providerId The provider ID (e.g., tmdb12345)
   * @param mediaType The media type (MOVIE, TV_SHOW, MUSIC, COMIC)
   * @returns The relative path to the saved image
   */
  async processImage(
    url: string | null,
    type: "poster" | "backdrop",
    providerId: string,
    mediaType: string | null = null
  ): Promise<string | null> {
    if (!url) return null;

    try {
      const fileName = `${providerId}.jpg`;

      // Use shared global structure: {mediaType}/{type}s/{filename}
      // Images are shared across all libraries since providerId is globally unique
      // Organized by media type (movies, tv, music, comics)
      // This prevents duplicate downloads and saves disk space
      const folderName = type === "poster" ? "posters" : "backdrops";
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
          // Verify file is not empty and is a valid image
          const stats = fs.statSync(fullPath);
          if (stats.size > 0) {
            // Quick validation: check if file can be read by sharp
            await sharp(fullPath).metadata();
            this.logger.debug(
              `Image already exists and is valid: ${relativePath}`
            );
            return relativePath;
          } else {
            // File exists but is empty, delete it and re-download
            this.logger.warn(`Image file is empty, removing: ${relativePath}`);
            fs.unlinkSync(fullPath);
          }
        } catch (error) {
          // File exists but is corrupted or invalid, delete it and re-download
          this.logger.warn(
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

      this.logger.debug(`Downloading image: ${url}`);

      const response = await axios({
        url,
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data, "binary");

      // Configure compression based on type
      let pipeline = sharp(buffer);

      if (type === "poster") {
        // Standard poster size ~500px width is usually sufficient for UI
        pipeline = pipeline.resize(500, null, { withoutEnlargement: true });
      } else {
        // Standard backdrop size ~1280px width
        pipeline = pipeline.resize(1280, null, { withoutEnlargement: true });
      }

      // Convert to JPEG with compression
      await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(fullPath);

      this.logger.info(`Saved and compressed ${type}: ${relativePath}`);
      return relativePath;
    } catch (error) {
      this.logger.error(
        `Failed to process image ${url} for ${providerId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }
}
