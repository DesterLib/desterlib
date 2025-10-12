import { promises as fs } from "fs";
import { join, basename, extname } from "path";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";

export type MediaType = "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC";

export interface ScanOptions {
  path: string;
  mediaType: MediaType;
  collectionName?: string;
}

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  extension: string;
  relativePath: string;
}

export interface ScanResult {
  collectionName: string;
  mediaType: MediaType;
  scannedPath: string;
  totalFiles: number;
  files: ScannedFile[];
  timestamp: string;
}

// Supported file extensions by media type
const SUPPORTED_EXTENSIONS: Record<MediaType, string[]> = {
  MOVIE: [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"],
  TV_SHOW: [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"],
  MUSIC: [".mp3", ".flac", ".wav", ".aac", ".ogg", ".m4a", ".wma", ".opus"],
  COMIC: [".cbr", ".cbz", ".cb7", ".cbt", ".pdf", ".epub"],
};

export class ScanService {
  /**
   * Validates that the provided path exists and is accessible
   */
  private async validatePath(path: string): Promise<void> {
    try {
      const stats = await fs.stat(path);
      if (!stats.isDirectory()) {
        throw new BadRequestError("Provided path is not a directory");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new NotFoundError(`Path does not exist: ${path}`);
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new BadRequestError(`Permission denied for path: ${path}`);
      }
      throw error;
    }
  }

  /**
   * Checks if a file has a supported extension for the given media type
   */
  private isSupportedFile(filename: string, mediaType: MediaType): boolean {
    const ext = extname(filename).toLowerCase();
    return SUPPORTED_EXTENSIONS[mediaType].includes(ext);
  }

  /**
   * Recursively scans a directory for media files
   */
  private async scanDirectory(
    dirPath: string,
    mediaType: MediaType,
    basePath: string
  ): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        // Skip hidden files and system directories
        if (entry.name.startsWith(".") || entry.name === "node_modules") {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(
            fullPath,
            mediaType,
            basePath
          );
          files.push(...subFiles);
        } else if (
          entry.isFile() &&
          this.isSupportedFile(entry.name, mediaType)
        ) {
          const stats = await fs.stat(fullPath);
          const relativePath = fullPath
            .replace(basePath, "")
            .replace(/^[\/\\]/, "");

          files.push({
            path: fullPath,
            name: entry.name,
            size: stats.size,
            extension: extname(entry.name),
            relativePath,
          });
        }
      }
    } catch (error) {
      // Log but don't throw - continue scanning other directories
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Parses TV show information from file path
   * Example: /path/to/Show Name/Season 01/Show Name - S01E01.mkv
   */
  private parseTVShowInfo(relativePath: string): {
    showName?: string;
    season?: number;
    episode?: number;
  } {
    // Extract season/episode from filename (e.g., S01E01, s01e01, 1x01)
    const patterns = [
      /[Ss](\d{1,2})[Ee](\d{1,3})/, // S01E01
      /(\d{1,2})x(\d{1,3})/, // 1x01
      /[Ss]eason\s*(\d{1,2}).*[Ee]pisode\s*(\d{1,3})/i, // Season 1 Episode 1
    ];

    let season: number | undefined;
    let episode: number | undefined;

    for (const pattern of patterns) {
      const match = relativePath.match(pattern);
      if (match) {
        season = parseInt(match[1]!, 10);
        episode = parseInt(match[2]!, 10);
        break;
      }
    }

    // Try to extract show name from directory structure
    const parts = relativePath.split(/[\/\\]/);
    const showName = parts.length > 1 ? parts[0] : undefined;

    return { showName, season, episode };
  }

  /**
   * Main scan method - orchestrates the scanning process
   */
  async scan(options: ScanOptions): Promise<ScanResult> {
    const { path, mediaType, collectionName } = options;

    // Validate inputs
    if (!path || path.trim() === "") {
      throw new BadRequestError("Path is required");
    }

    if (!["MOVIE", "TV_SHOW", "MUSIC", "COMIC"].includes(mediaType)) {
      throw new BadRequestError(
        "Invalid media type. Must be MOVIE, TV_SHOW, MUSIC, or COMIC"
      );
    }

    // Validate that path exists and is accessible
    await this.validatePath(path);

    // Use provided collection name or default to folder name
    const finalCollectionName = collectionName || basename(path);

    // Scan the directory
    const files = await this.scanDirectory(path, mediaType, path);

    // Sort files by path for consistent ordering
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    return {
      collectionName: finalCollectionName,
      mediaType,
      scannedPath: path,
      totalFiles: files.length,
      files,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get supported file extensions for a media type
   */
  getSupportedExtensions(mediaType: MediaType): string[] {
    return SUPPORTED_EXTENSIONS[mediaType] || [];
  }

  /**
   * Get all supported media types
   */
  getSupportedMediaTypes(): MediaType[] {
    return Object.keys(SUPPORTED_EXTENSIONS) as MediaType[];
  }
}

// Export singleton instance
export const scanService = new ScanService();
