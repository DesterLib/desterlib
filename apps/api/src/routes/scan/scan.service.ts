import { promises as fs } from "fs";
import { join, basename, extname } from "path";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { MediaType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { notificationService } from "../../lib/notifications/notification.service.js";
import { getProcessor } from "./processors/index.js";
import type { ScannedFile, SaveStats } from "./processors/types.js";
import logger from "../../config/logger.js";
import { validatePath, quickValidate } from "../../lib/fileValidation.js";

export { MediaType };

export interface ScanOptions {
  path: string;
  mediaType: MediaType;
  collectionName?: string;
  updateExisting?: boolean;
}

export interface ScanResult {
  collectionName: string;
  mediaType: MediaType;
  scannedPath: string;
  totalFiles: number;
  files: ScannedFile[];
  timestamp: string;
  stats: SaveStats;
}

export interface SyncResult {
  collectionName: string;
  mediaType: MediaType;
  timestamp: string;
  stats: {
    updated: number;
    removed: number;
    checked: number;
  };
}

// Supported file extensions by media type
const SUPPORTED_EXTENSIONS: Record<MediaType, string[]> = {
  [MediaType.MOVIE]: [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
  ],
  [MediaType.TV_SHOW]: [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
  ],
  [MediaType.MUSIC]: [
    ".mp3",
    ".flac",
    ".wav",
    ".aac",
    ".ogg",
    ".m4a",
    ".wma",
    ".opus",
  ],
  [MediaType.COMIC]: [".cbr", ".cbz", ".cb7", ".cbt", ".pdf", ".epub"],
};

export class ScanService {
  /**
   * Main scan method - scans a directory and adds media to database
   */
  async scan(options: ScanOptions): Promise<ScanResult> {
    const { path, mediaType, collectionName, updateExisting } = options;

    // Validate inputs
    this.validateScanOptions(path, mediaType);
    await this.validatePath(path);

    const finalCollectionName = collectionName || basename(path);

    // Notify scan started
    notificationService.started(
      "scan",
      `Scanning ${mediaType.toLowerCase()} files in: ${path}`,
      { path, mediaType, collectionName: finalCollectionName }
    );

    // Scan directory for files
    const files = await this.scanDirectory(path, mediaType, path);

    // Notify files found
    notificationService.progress(
      "scan",
      `Found ${files.length} ${mediaType.toLowerCase()} files`,
      { totalFiles: files.length, path }
    );

    // Sort files for consistent ordering
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    // Early return if no files found
    if (files.length === 0) {
      return this.createEmptyResult(finalCollectionName, mediaType, path);
    }

    // Save to database using appropriate processor
    notificationService.progress(
      "scan",
      `Saving ${files.length} files to database...`,
      { totalFiles: files.length }
    );

    const collection = await this.findOrCreateLibraryCollection(
      path,
      mediaType,
      finalCollectionName
    );

    const processor = getProcessor(mediaType);
    const stats = await processor.saveToDatabase(files, collection, prisma, {
      updateExisting,
    });

    // Notify completion
    notificationService.completed(
      "scan",
      `Scan completed: ${stats.added} added, ${stats.updated} updated, ${stats.skipped} skipped`,
      { collectionName: finalCollectionName, stats, totalFiles: files.length }
    );

    return {
      collectionName: finalCollectionName,
      mediaType,
      scannedPath: path,
      totalFiles: files.length,
      files,
      timestamp: new Date().toISOString(),
      stats,
    };
  }

  /**
   * Sync collection - checks for file modifications and removals
   */
  async syncCollection(
    collectionName: string,
    mediaType: MediaType
  ): Promise<SyncResult> {
    const stats = {
      updated: 0,
      removed: 0,
      checked: 0,
    };

    // Get collection with all media
    const collection = await prisma.collection.findUnique({
      where: { slug: this.slugify(collectionName) },
      include: {
        media: {
          include: {
            media: {
              include: {
                movie: true,
                tvShow: {
                  include: {
                    seasons: {
                      include: {
                        episodes: true,
                      },
                    },
                  },
                },
                music: true,
                comic: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError(`Collection "${collectionName}" not found`);
    }

    const processor = getProcessor(mediaType);

    // Check each media item
    for (const mediaCollection of collection.media) {
      const media = mediaCollection.media;

      if (media.type !== mediaType) {
        continue;
      }

      const filePaths = processor.getFilePaths(media);

      for (const filePath of filePaths) {
        stats.checked++;
        const result = await this.checkFile(filePath);

        if (result === "deleted") {
          // Delete media if file is gone
          if (mediaType === MediaType.TV_SHOW) {
            // For TV shows, delete individual episode
            await prisma.episode.deleteMany({
              where: { filePath },
            });
          } else {
            // For other types, delete the entire media entry
            await prisma.media.delete({ where: { id: media.id } });
          }
          stats.removed++;
        } else if (result === "modified") {
          stats.updated++;
        }
      }
    }

    return {
      collectionName,
      mediaType,
      timestamp: new Date().toISOString(),
      stats,
    };
  }

  /**
   * Sync all collections in the database
   */
  async syncAllCollections(): Promise<SyncResult[]> {
    const collections = await prisma.collection.findMany({
      include: {
        media: {
          include: {
            media: {
              select: { type: true },
            },
          },
        },
      },
    });

    const results: SyncResult[] = [];

    for (const collection of collections) {
      const mediaTypes = new Set(collection.media.map((m) => m.media.type));

      for (const mediaType of mediaTypes) {
        const result = await this.syncCollection(collection.name, mediaType);
        results.push(result);
      }
    }

    return results;
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

  // ──────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ──────────────────────────────────────────────────────────────

  private validateScanOptions(path: string, mediaType: MediaType): void {
    if (!path || path.trim() === "") {
      throw new BadRequestError("Path is required");
    }

    // Validate path for security issues
    try {
      validatePath(path);
    } catch (error) {
      throw new BadRequestError(`Invalid path: ${(error as Error).message}`);
    }

    if (!Object.values(MediaType).includes(mediaType)) {
      throw new BadRequestError(
        "Invalid media type. Must be MOVIE, TV_SHOW, MUSIC, or COMIC"
      );
    }
  }

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

  private isSupportedFile(filename: string, mediaType: MediaType): boolean {
    const ext = extname(filename).toLowerCase();
    return SUPPORTED_EXTENSIONS[mediaType].includes(ext);
  }

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
        } else if (entry.isFile()) {
          // Quick validation for security and file type
          const isValid = await quickValidate(fullPath, [
            ...SUPPORTED_EXTENSIONS[mediaType],
          ]);

          if (isValid && this.isSupportedFile(entry.name, mediaType)) {
            const stats = await fs.stat(fullPath);
            const relativePath = fullPath
              .replace(basePath, "")
              .replace(/^[/\\]/, "");

            files.push({
              path: fullPath,
              name: entry.name,
              size: stats.size,
              extension: extname(entry.name),
              relativePath,
            });
          } else if (!isValid) {
            logger.warn(`Skipping invalid/unsafe file: ${fullPath}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error scanning directory ${dirPath}:`, { error, dirPath });
    }

    return files;
  }

  private async findOrCreateLibraryCollection(
    path: string,
    mediaType: MediaType,
    collectionName: string
  ) {
    // Try to find existing library by path and type
    let collection = await prisma.collection.findFirst({
      where: {
        isLibrary: true,
        libraryPath: path,
        libraryType: mediaType,
      },
    });

    // If not found by exact path, check if path is within an existing library
    if (!collection) {
      const allLibraries = await prisma.collection.findMany({
        where: {
          isLibrary: true,
          libraryType: mediaType,
        },
      });

      collection =
        allLibraries.find(
          (lib) => lib.libraryPath && path.startsWith(lib.libraryPath)
        ) || null;
    }

    // If not found, check by slug/name
    if (!collection) {
      collection = await prisma.collection.findFirst({
        where: { slug: this.slugify(collectionName) },
      });

      // Update to be a library if it exists but isn't marked as one
      if (collection && !collection.isLibrary) {
        collection = await prisma.collection.update({
          where: { id: collection.id },
          data: {
            isLibrary: true,
            libraryPath: path,
            libraryType: mediaType,
          },
        });
      }
    }

    // Create new library collection if still not found
    if (!collection) {
      collection = await prisma.collection.create({
        data: {
          name: collectionName,
          slug: this.slugify(collectionName),
          isLibrary: true,
          libraryPath: path,
          libraryType: mediaType,
        },
      });
    }

    return collection;
  }

  private async checkFile(
    filePath: string
  ): Promise<"unchanged" | "modified" | "deleted"> {
    try {
      await fs.stat(filePath);
      return "unchanged";
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return "deleted";
      }
      throw error;
    }
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private createEmptyResult(
    collectionName: string,
    mediaType: MediaType,
    path: string
  ): ScanResult {
    return {
      collectionName,
      mediaType,
      scannedPath: path,
      totalFiles: 0,
      files: [],
      timestamp: new Date().toISOString(),
      stats: {
        added: 0,
        skipped: 0,
        updated: 0,
      },
    };
  }
}

// Export singleton instance
export const scanService = new ScanService();
