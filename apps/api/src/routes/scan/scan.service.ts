import { promises as fs } from "fs";
import { join, basename, extname } from "path";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import {
  PrismaClient,
  MediaType,
  type Media,
  type Movie,
  type TVShow,
  type Season,
  type Episode,
  type Music,
  type Comic,
  type Collection,
} from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export { MediaType };

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
  stats: {
    added: number;
    skipped: number;
  };
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
   * Helper to slugify strings
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Saves TV show episodes to the database (simple version - only adds new files)
   */
  private async saveTVShowsToDatabase(
    files: ScannedFile[],
    collectionName: string
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0 };
    }

    // Group files by show name
    const showsMap = new Map<
      string,
      Map<number, { episode: number; file: ScannedFile }[]>
    >();

    for (const file of files) {
      const { showName, season, episode } = this.parseTVShowInfo(
        file.relativePath
      );

      if (!showName || season === undefined || episode === undefined) {
        console.warn(`Could not parse TV show info from: ${file.relativePath}`);
        continue;
      }

      if (!showsMap.has(showName)) {
        showsMap.set(showName, new Map());
      }

      const seasonsMap = showsMap.get(showName)!;
      if (!seasonsMap.has(season)) {
        seasonsMap.set(season, []);
      }

      seasonsMap.get(season)!.push({ episode, file });
    }

    // Create or find collection
    const collection = await prisma.collection.upsert({
      where: { slug: this.slugify(collectionName) },
      create: {
        name: collectionName,
        slug: this.slugify(collectionName),
      },
      update: {},
    });

    // Process shows, seasons, and episodes
    for (const [showName, seasonsMap] of showsMap) {
      // Find or create TV show by title
      let media = await prisma.media.findFirst({
        where: {
          title: showName,
          type: MediaType.TV_SHOW,
        },
        include: {
          tvShow: {
            include: {
              seasons: true,
            },
          },
        },
      });

      if (!media) {
        // Create new TV show
        media = await prisma.media.create({
          data: {
            title: showName,
            type: MediaType.TV_SHOW,
            tvShow: {
              create: {},
            },
          },
          include: {
            tvShow: {
              include: {
                seasons: true,
              },
            },
          },
        });
      }

      // Link to collection
      await prisma.mediaCollection.upsert({
        where: {
          mediaId_collectionId: {
            mediaId: media.id,
            collectionId: collection.id,
          },
        },
        create: {
          mediaId: media.id,
          collectionId: collection.id,
        },
        update: {},
      });

      // Process seasons and episodes
      for (const [seasonNumber, episodes] of seasonsMap) {
        // Find or create season
        let season = media.tvShow!.seasons.find(
          (s) => s.number === seasonNumber
        );

        if (!season) {
          season = await prisma.season.create({
            data: {
              number: seasonNumber,
              tvShowId: media.tvShow!.id,
            },
          });
          media.tvShow!.seasons.push(season);
        }

        // Process episodes
        for (const { episode: episodeNumber, file } of episodes) {
          // Check if episode exists by filePath
          const existingEpisode = await prisma.episode.findUnique({
            where: { filePath: file.path },
          });

          if (existingEpisode) {
            // File already exists - skip
            skipped++;
          } else {
            // Add new episode
            const fileStats = await fs.stat(file.path);

            await prisma.episode.create({
              data: {
                title: file.name.replace(extname(file.name), ""),
                number: episodeNumber,
                filePath: file.path,
                fileSize: BigInt(file.size),
                fileModifiedAt: fileStats.mtime,
                seasonId: season.id,
              },
            });
            added++;
          }
        }
      }
    }

    return { added, skipped };
  }

  /**
   * Parses movie information from file path
   * Example: Movie Name (2023).mkv or Movie Name/Movie Name (2023).mkv
   */
  private parseMovieInfo(
    relativePath: string,
    fileName: string
  ): {
    title: string;
    year?: number;
  } {
    // Try to extract year from filename (e.g., Movie Name (2023).mkv)
    const yearMatch = fileName.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1]!, 10) : undefined;

    // Remove year, extension, and quality tags to get clean title
    let title = fileName
      .replace(extname(fileName), "")
      .replace(/\(\d{4}\)/, "")
      .replace(/\b(1080p|720p|480p|4K|HDTV|BluRay|WEB-DL|WEBRip)\b/gi, "")
      .replace(/[._-]+/g, " ")
      .trim();

    return { title, year };
  }

  /**
   * Saves movies to the database (simple version - only adds new files)
   */
  private async saveMoviesToDatabase(
    files: ScannedFile[],
    collectionName: string
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0 };
    }

    // Create or find collection (only if we have files)
    const collection = await prisma.collection.upsert({
      where: { slug: this.slugify(collectionName) },
      create: {
        name: collectionName,
        slug: this.slugify(collectionName),
      },
      update: {},
    });

    // Process movie records
    for (const file of files) {
      // Check if movie already exists by filePath
      const existingMovie = await prisma.movie.findUnique({
        where: { filePath: file.path },
      });

      if (existingMovie) {
        // File already exists - skip
        skipped++;

        // Ensure it's linked to the collection
        await prisma.mediaCollection.upsert({
          where: {
            mediaId_collectionId: {
              mediaId: existingMovie.mediaId,
              collectionId: collection.id,
            },
          },
          create: {
            mediaId: existingMovie.mediaId,
            collectionId: collection.id,
          },
          update: {},
        });
      } else {
        // Add new movie
        const { title, year } = this.parseMovieInfo(
          file.relativePath,
          file.name
        );
        const fileStats = await fs.stat(file.path);

        const media = await prisma.media.create({
          data: {
            title,
            type: MediaType.MOVIE,
            releaseDate: year ? new Date(year, 0, 1) : undefined,
            movie: {
              create: {
                filePath: file.path,
                fileSize: BigInt(file.size),
                fileModifiedAt: fileStats.mtime,
              },
            },
          },
          include: {
            movie: true,
          },
        });

        // Link to collection
        await prisma.mediaCollection.create({
          data: {
            mediaId: media.id,
            collectionId: collection.id,
          },
        });

        added++;
      }
    }

    return { added, skipped };
  }

  /**
   * Parses music information from file path
   * Example: Artist Name/Album Name/Track 01 - Song Title.mp3
   */
  private parseMusicInfo(
    relativePath: string,
    fileName: string
  ): {
    artist?: string;
    album?: string;
    title: string;
  } {
    const parts = relativePath.split(/[\/\\]/);

    // Try to extract artist and album from directory structure
    const artist = parts.length > 1 ? parts[0] : undefined;
    const album = parts.length > 2 ? parts[1] : undefined;

    // Remove track number and extension to get title
    const title = fileName
      .replace(extname(fileName), "")
      .replace(/^\d+[-.\s]+/, "") // Remove track number prefix
      .trim();

    return { artist, album, title };
  }

  /**
   * Saves music to the database (simple version - only adds new files)
   */
  private async saveMusicToDatabase(
    files: ScannedFile[],
    collectionName: string
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0 };
    }

    // Create or find collection (only if we have files)
    const collection = await prisma.collection.upsert({
      where: { slug: this.slugify(collectionName) },
      create: {
        name: collectionName,
        slug: this.slugify(collectionName),
      },
      update: {},
    });

    // Process music records
    for (const file of files) {
      // Check if music already exists by filePath
      const existingMusic = await prisma.music.findUnique({
        where: { filePath: file.path },
      });

      if (existingMusic) {
        // File already exists - skip
        skipped++;

        // Ensure it's linked to the collection
        await prisma.mediaCollection.upsert({
          where: {
            mediaId_collectionId: {
              mediaId: existingMusic.mediaId,
              collectionId: collection.id,
            },
          },
          create: {
            mediaId: existingMusic.mediaId,
            collectionId: collection.id,
          },
          update: {},
        });
      } else {
        // Add new music
        const { artist, album, title } = this.parseMusicInfo(
          file.relativePath,
          file.name
        );
        const fileStats = await fs.stat(file.path);

        const media = await prisma.media.create({
          data: {
            title,
            type: MediaType.MUSIC,
            music: {
              create: {
                artist: artist || "Unknown Artist",
                album,
                filePath: file.path,
                fileSize: BigInt(file.size),
                fileModifiedAt: fileStats.mtime,
              },
            },
          },
          include: {
            music: true,
          },
        });

        // Link to collection
        await prisma.mediaCollection.create({
          data: {
            mediaId: media.id,
            collectionId: collection.id,
          },
        });

        added++;
      }
    }

    return { added, skipped };
  }

  /**
   * Parses comic information from file path
   * Example: Series Name/Series Name #001.cbz or Series Name Vol 1/Issue 01.cbr
   */
  private parseComicInfo(
    relativePath: string,
    fileName: string
  ): {
    title: string;
    issue?: number;
    volume?: string;
  } {
    const parts = relativePath.split(/[\/\\]/);
    const seriesName = parts.length > 1 ? parts[0] : undefined;

    // Try to extract issue number (e.g., #001, Issue 01, 001)
    const issueMatch = fileName.match(/#?(\d+)/);
    const issue = issueMatch ? parseInt(issueMatch[1]!, 10) : undefined;

    // Try to extract volume (e.g., Vol 1, Volume 1)
    const volumeMatch =
      relativePath.match(/Vol(?:ume)?\s*(\d+)/i) ||
      fileName.match(/Vol(?:ume)?\s*(\d+)/i);
    const volume = volumeMatch ? volumeMatch[1] : undefined;

    // Use series name or clean filename as title
    const title =
      seriesName ||
      fileName
        .replace(extname(fileName), "")
        .replace(/#?\d+/, "")
        .replace(/Vol(?:ume)?\s*\d+/i, "")
        .trim();

    return { title, issue, volume };
  }

  /**
   * Saves comics to the database (simple version - only adds new files)
   */
  private async saveComicsToDatabase(
    files: ScannedFile[],
    collectionName: string
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0 };
    }

    // Create or find collection (only if we have files)
    const collection = await prisma.collection.upsert({
      where: { slug: this.slugify(collectionName) },
      create: {
        name: collectionName,
        slug: this.slugify(collectionName),
      },
      update: {},
    });

    // Process comic records
    for (const file of files) {
      // Check if comic already exists by filePath
      const existingComic = await prisma.comic.findUnique({
        where: { filePath: file.path },
      });

      if (existingComic) {
        // File already exists - skip
        skipped++;

        // Ensure it's linked to the collection
        await prisma.mediaCollection.upsert({
          where: {
            mediaId_collectionId: {
              mediaId: existingComic.mediaId,
              collectionId: collection.id,
            },
          },
          create: {
            mediaId: existingComic.mediaId,
            collectionId: collection.id,
          },
          update: {},
        });
      } else {
        // Add new comic
        const { title, issue, volume } = this.parseComicInfo(
          file.relativePath,
          file.name
        );
        const fileStats = await fs.stat(file.path);

        const media = await prisma.media.create({
          data: {
            title,
            type: MediaType.COMIC,
            comic: {
              create: {
                issue,
                volume,
                filePath: file.path,
                fileSize: BigInt(file.size),
                fileModifiedAt: fileStats.mtime,
              },
            },
          },
          include: {
            comic: true,
          },
        });

        // Link to collection
        await prisma.mediaCollection.create({
          data: {
            mediaId: media.id,
            collectionId: collection.id,
          },
        });

        added++;
      }
    }

    return { added, skipped };
  }

  /**
   * Main scan method - only adds new files (simple and fast)
   */
  async scan(options: ScanOptions): Promise<ScanResult> {
    const { path, mediaType, collectionName } = options;

    // Validate inputs
    if (!path || path.trim() === "") {
      throw new BadRequestError("Path is required");
    }

    if (!Object.values(MediaType).includes(mediaType)) {
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

    // If no files found, return early (don't create empty collection)
    if (files.length === 0) {
      return {
        collectionName: finalCollectionName,
        mediaType,
        scannedPath: path,
        totalFiles: 0,
        files: [],
        timestamp: new Date().toISOString(),
        stats: {
          added: 0,
          skipped: 0,
        },
      };
    }

    // Initialize stats
    let stats = {
      added: 0,
      skipped: 0,
    };

    // Save to database based on media type
    if (files.length > 0) {
      let saveStats;
      switch (mediaType) {
        case MediaType.TV_SHOW:
          saveStats = await this.saveTVShowsToDatabase(
            files,
            finalCollectionName
          );
          break;
        case MediaType.MOVIE:
          saveStats = await this.saveMoviesToDatabase(
            files,
            finalCollectionName
          );
          break;
        case MediaType.MUSIC:
          saveStats = await this.saveMusicToDatabase(
            files,
            finalCollectionName
          );
          break;
        case MediaType.COMIC:
          saveStats = await this.saveComicsToDatabase(
            files,
            finalCollectionName
          );
          break;
      }

      if (saveStats) {
        stats = saveStats;
      }
    }

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
   * Syncs a collection - checks for file modifications and removals
   * This should be run periodically by a cron job
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

    // Check each media item
    for (const mediaCollection of collection.media) {
      const media = mediaCollection.media;

      if (media.type !== mediaType) {
        continue;
      }

      switch (mediaType) {
        case MediaType.MOVIE:
          if (media.movie?.filePath) {
            stats.checked++;
            const updated = await this.checkAndUpdateFile(
              media.movie.filePath,
              media.movie.fileModifiedAt,
              async (newStats) => {
                await prisma.movie.update({
                  where: { id: media.movie!.id },
                  data: {
                    fileSize: newStats.size,
                    fileModifiedAt: newStats.mtime,
                  },
                });
              }
            );

            if (updated === "deleted") {
              await prisma.media.delete({ where: { id: media.id } });
              stats.removed++;
            } else if (updated === "modified") {
              stats.updated++;
            }
          }
          break;

        case MediaType.TV_SHOW:
          if (media.tvShow) {
            let hasAnyEpisode = false;
            for (const season of media.tvShow.seasons) {
              for (const episode of season.episodes) {
                if (episode.filePath) {
                  stats.checked++;
                  const updated = await this.checkAndUpdateFile(
                    episode.filePath,
                    episode.fileModifiedAt,
                    async (newStats) => {
                      await prisma.episode.update({
                        where: { id: episode.id },
                        data: {
                          fileSize: newStats.size,
                          fileModifiedAt: newStats.mtime,
                        },
                      });
                    }
                  );

                  if (updated === "deleted") {
                    await prisma.episode.delete({ where: { id: episode.id } });
                    stats.removed++;
                  } else if (updated === "modified") {
                    stats.updated++;
                    hasAnyEpisode = true;
                  } else {
                    hasAnyEpisode = true;
                  }
                }
              }
            }

            // If show has no episodes left, delete it
            if (!hasAnyEpisode) {
              await prisma.media.delete({ where: { id: media.id } });
            }
          }
          break;

        case MediaType.MUSIC:
          if (media.music?.filePath) {
            stats.checked++;
            const updated = await this.checkAndUpdateFile(
              media.music.filePath,
              media.music.fileModifiedAt,
              async (newStats) => {
                await prisma.music.update({
                  where: { id: media.music!.id },
                  data: {
                    fileSize: newStats.size,
                    fileModifiedAt: newStats.mtime,
                  },
                });
              }
            );

            if (updated === "deleted") {
              await prisma.media.delete({ where: { id: media.id } });
              stats.removed++;
            } else if (updated === "modified") {
              stats.updated++;
            }
          }
          break;

        case MediaType.COMIC:
          if (media.comic?.filePath) {
            stats.checked++;
            const updated = await this.checkAndUpdateFile(
              media.comic.filePath,
              media.comic.fileModifiedAt,
              async (newStats) => {
                await prisma.comic.update({
                  where: { id: media.comic!.id },
                  data: {
                    fileSize: newStats.size,
                    fileModifiedAt: newStats.mtime,
                  },
                });
              }
            );

            if (updated === "deleted") {
              await prisma.media.delete({ where: { id: media.id } });
              stats.removed++;
            } else if (updated === "modified") {
              stats.updated++;
            }
          }
          break;
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
   * Helper to check if a file was modified or deleted
   */
  private async checkAndUpdateFile(
    filePath: string,
    lastModified: Date | null,
    updateCallback: (stats: { size: bigint; mtime: Date }) => Promise<void>
  ): Promise<"unchanged" | "modified" | "deleted"> {
    try {
      const stats = await fs.stat(filePath);

      // Check if file was modified
      if (lastModified) {
        const lastModTime = lastModified.getTime();
        const currentModTime = stats.mtime.getTime();

        if (Math.abs(lastModTime - currentModTime) > 1000) {
          // File modified - update metadata
          await updateCallback({
            size: BigInt(stats.size),
            mtime: stats.mtime,
          });
          return "modified";
        }
      }

      return "unchanged";
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // File deleted
        return "deleted";
      }
      throw error;
    }
  }

  /**
   * Syncs all collections - runs sync for every collection in the database
   * This is the method to call from a cron job
   */
  async syncAllCollections(): Promise<SyncResult[]> {
    const collections = await prisma.collection.findMany({
      include: {
        media: {
          include: {
            media: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

    const results: SyncResult[] = [];

    for (const collection of collections) {
      // Determine media types in this collection
      const mediaTypes = new Set(collection.media.map((m) => m.media.type));

      // Sync each media type
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
}

// Export singleton instance
export const scanService = new ScanService();
