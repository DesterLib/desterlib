import { promises as fs } from "fs";
import { join, basename, extname } from "path";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { PrismaClient, MediaType } from "../../generated/prisma/index.js";
import {
  parseExternalIds,
  removeExternalIds,
  metadataService,
} from "../../lib/metadata/index.js";

const prisma = new PrismaClient();

export { MediaType };

export interface ScanOptions {
  path: string;
  mediaType: MediaType;
  collectionName?: string;
  updateExisting?: boolean; // If true, updates existing entries with new external IDs and metadata
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
    updated: number;
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
   * Also handles: Show Name - S01E01 - Episode Title.mkv
   * Also handles external IDs: Show Name {tmdb-12345}/Season 01/...
   */
  private parseTVShowInfo(relativePath: string): {
    showName?: string;
    season?: number;
    episode?: number;
  } {
    // Remove external IDs from path
    const cleanPath = removeExternalIds(relativePath);

    // Extract season/episode from filename (e.g., S01E01, s01e01, 1x01)
    const patterns = [
      /[Ss](\d{1,2})[Ee](\d{1,3})/, // S01E01
      /(\d{1,2})x(\d{1,3})/, // 1x01
      /[Ss]eason\s*(\d{1,2}).*[Ee]pisode\s*(\d{1,3})/i, // Season 1 Episode 1
    ];

    let season: number | undefined;
    let episode: number | undefined;

    for (const pattern of patterns) {
      const match = cleanPath.match(pattern);
      if (match) {
        season = parseInt(match[1]!, 10);
        episode = parseInt(match[2]!, 10);
        break;
      }
    }

    // Try to extract show name from filename first (common pattern: "Show Name - S01E01 - Episode Title.ext")
    let showName: string | undefined;

    // Get the filename part (last segment after /)
    const parts = cleanPath.split(/[\/\\]/);
    const filename = parts[parts.length - 1] || cleanPath;

    // Try to extract show name before the season/episode pattern in the filename
    const showNameMatch = filename.match(/^(.+?)\s*-\s*[Ss]\d{1,2}[Ee]\d{1,3}/);
    if (showNameMatch) {
      showName = showNameMatch[1]!.trim();
    } else {
      // Fallback: extract show name from directory structure
      showName = parts.length > 1 ? parts[0]!.trim() : undefined;
    }

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
   * Extract external IDs from file path and optionally fetch metadata
   */
  private async extractMetadata(
    filePath: string,
    fileName: string,
    mediaType: MediaType,
    options?: {
      fetchMetadata?: boolean; // Whether to fetch full metadata from providers
    }
  ): Promise<{
    externalIds: Array<{ source: any; externalId: string }>;
    metadata?: any;
  }> {
    // Parse external IDs from the full path (directory + filename)
    const fullPath = `${filePath}/${fileName}`;
    const parsedIds = parseExternalIds(fullPath);

    const result: {
      externalIds: Array<{ source: any; externalId: string }>;
      metadata?: any;
    } = {
      externalIds: parsedIds.map((id) => ({
        source: id.source,
        externalId: id.id,
      })),
    };

    // If we found IDs and metadata fetching is enabled, get metadata from the first ID
    if (options?.fetchMetadata && parsedIds.length > 0 && parsedIds[0]) {
      try {
        const firstId = parsedIds[0];
        const metadata = await metadataService.getMetadata(
          firstId.id,
          firstId.source,
          mediaType
        );

        if (metadata) {
          result.metadata = metadata;
        }
      } catch (error) {
        console.warn("Failed to fetch metadata:", error);
      }
    }

    return result;
  }

  /**
   * Saves TV show episodes to the database
   * Can add new files or update existing ones based on options
   */
  private async saveTVShowsToDatabase(
    files: ScannedFile[],
    collectionName: string,
    options?: { updateExisting?: boolean }
  ): Promise<{ added: number; skipped: number; updated: number }> {
    let added = 0;
    let skipped = 0;
    let updated = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0, updated: 0 };
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
          externalIds: true,
        },
      });

      if (!media) {
        // Extract external IDs from the show directory name
        // Use the first episode's path to get the show directory
        const firstEpisode = Array.from(seasonsMap.values())[0]?.[0];
        const { externalIds, metadata } = firstEpisode
          ? await this.extractMetadata(
              firstEpisode.file.relativePath,
              "",
              MediaType.TV_SHOW,
              { fetchMetadata: true } // Fetch metadata from providers
            )
          : { externalIds: [], metadata: undefined };

        // Create new TV show
        media = await prisma.media.create({
          data: {
            title: metadata?.title || showName,
            type: MediaType.TV_SHOW,
            description: metadata?.description,
            posterUrl: metadata?.posterUrl,
            backdropUrl: metadata?.backdropUrl,
            rating: metadata?.rating,
            releaseDate: metadata?.releaseDate,
            tvShow: {
              create: {
                creator: metadata?.tvShow?.creator,
                network: metadata?.tvShow?.network,
              },
            },
            // Create external IDs if any were found
            externalIds:
              externalIds.length > 0
                ? {
                    create: externalIds.map((id) => ({
                      source: id.source,
                      externalId: id.externalId,
                    })),
                  }
                : undefined,
          },
          include: {
            tvShow: {
              include: {
                seasons: true,
              },
            },
            externalIds: true,
          },
        });
      } else if (options?.updateExisting) {
        // Update existing TV show with external IDs if enabled
        const firstEpisode = Array.from(seasonsMap.values())[0]?.[0];
        const { externalIds, metadata } = firstEpisode
          ? await this.extractMetadata(
              firstEpisode.file.relativePath,
              "",
              MediaType.TV_SHOW,
              { fetchMetadata: true }
            )
          : { externalIds: [], metadata: undefined };

        // Check if we need to add new external IDs
        const existingExternalIdSources = new Set(
          media.externalIds.map((id) => id.source)
        );
        const newExternalIds = externalIds.filter(
          (id) => !existingExternalIdSources.has(id.source)
        );

        // Update TV show metadata
        await prisma.media.update({
          where: { id: media.id },
          data: {
            title: metadata?.title || media.title,
            description: metadata?.description || media.description,
            posterUrl: metadata?.posterUrl || media.posterUrl,
            backdropUrl: metadata?.backdropUrl || media.backdropUrl,
            rating: metadata?.rating || media.rating,
            releaseDate: metadata?.releaseDate || media.releaseDate,
          },
        });

        // Update TV show specific fields
        if (media.tvShow) {
          await prisma.tVShow.update({
            where: { id: media.tvShow.id },
            data: {
              creator: metadata?.tvShow?.creator || media.tvShow.creator,
              network: metadata?.tvShow?.network || media.tvShow.network,
            },
          });
        }

        // Add new external IDs if any
        if (newExternalIds.length > 0 && media) {
          for (const id of newExternalIds) {
            try {
              await prisma.externalId.create({
                data: {
                  source: id.source,
                  externalId: id.externalId,
                  mediaId: media.id,
                },
              });
            } catch (error) {
              // Skip duplicates silently
              console.warn(
                `Duplicate external ID skipped: ${id.source}-${id.externalId}`
              );
            }
          }
        }
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
            // File already exists
            if (options?.updateExisting) {
              // Update episode metadata if needed
              const fileStats = await fs.stat(file.path);
              await prisma.episode.update({
                where: { id: existingEpisode.id },
                data: {
                  title: file.name.replace(extname(file.name), ""),
                  number: episodeNumber,
                  fileSize: BigInt(file.size),
                  fileModifiedAt: fileStats.mtime,
                },
              });
              updated++;
            } else {
              skipped++;
            }
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

    return { added, skipped, updated };
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
   * Saves movies to the database
   * Can add new files or update existing ones based on options
   */
  private async saveMoviesToDatabase(
    files: ScannedFile[],
    collectionName: string,
    options?: { updateExisting?: boolean }
  ): Promise<{ added: number; skipped: number; updated: number }> {
    let added = 0;
    let skipped = 0;
    let updated = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0, updated: 0 };
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
        include: {
          media: {
            include: {
              externalIds: true,
            },
          },
        },
      });

      if (existingMovie) {
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

        // If updateExisting is enabled, update external IDs and metadata
        if (options?.updateExisting) {
          const { title, year } = this.parseMovieInfo(
            file.relativePath,
            file.name
          );

          // Extract external IDs from file path
          const { externalIds, metadata } = await this.extractMetadata(
            file.relativePath,
            file.name,
            MediaType.MOVIE,
            { fetchMetadata: true }
          );

          // Check if we need to add new external IDs
          const existingExternalIdSources = new Set(
            existingMovie.media.externalIds.map((id) => id.source)
          );
          const newExternalIds = externalIds.filter(
            (id) => !existingExternalIdSources.has(id.source)
          );

          // Update media entry
          await prisma.media.update({
            where: { id: existingMovie.mediaId },
            data: {
              title: metadata?.title || existingMovie.media.title,
              description:
                metadata?.description || existingMovie.media.description,
              posterUrl: metadata?.posterUrl || existingMovie.media.posterUrl,
              backdropUrl:
                metadata?.backdropUrl || existingMovie.media.backdropUrl,
              rating: metadata?.rating || existingMovie.media.rating,
              releaseDate:
                metadata?.releaseDate ||
                existingMovie.media.releaseDate ||
                (year ? new Date(year, 0, 1) : undefined),
            },
          });

          // Update movie-specific fields
          await prisma.movie.update({
            where: { id: existingMovie.id },
            data: {
              duration: metadata?.movie?.duration || existingMovie.duration,
              director: metadata?.movie?.director || existingMovie.director,
              trailerUrl:
                metadata?.movie?.trailerUrl || existingMovie.trailerUrl,
            },
          });

          // Add new external IDs if any
          if (newExternalIds.length > 0) {
            for (const id of newExternalIds) {
              try {
                await prisma.externalId.create({
                  data: {
                    source: id.source,
                    externalId: id.externalId,
                    mediaId: existingMovie.mediaId,
                  },
                });
              } catch (error) {
                // Skip duplicates silently
                console.warn(
                  `Duplicate external ID skipped: ${id.source}-${id.externalId}`
                );
              }
            }
          }

          updated++;
        } else {
          // Just skip if not updating
          skipped++;
        }
      } else {
        // Add new movie
        const { title, year } = this.parseMovieInfo(
          file.relativePath,
          file.name
        );
        const fileStats = await fs.stat(file.path);

        // Extract external IDs from file path
        const { externalIds, metadata } = await this.extractMetadata(
          file.relativePath,
          file.name,
          MediaType.MOVIE,
          { fetchMetadata: true } // Fetch metadata from providers
        );

        // Use metadata if available, otherwise use parsed info
        const mediaData = {
          title: metadata?.title || title,
          type: MediaType.MOVIE,
          description: metadata?.description,
          posterUrl: metadata?.posterUrl,
          backdropUrl: metadata?.backdropUrl,
          rating: metadata?.rating,
          releaseDate:
            metadata?.releaseDate || (year ? new Date(year, 0, 1) : undefined),
          movie: {
            create: {
              filePath: file.path,
              fileSize: BigInt(file.size),
              fileModifiedAt: fileStats.mtime,
              duration: metadata?.movie?.duration,
              director: metadata?.movie?.director,
              trailerUrl: metadata?.movie?.trailerUrl,
            },
          },
          // Create external IDs if any were found
          externalIds:
            externalIds.length > 0
              ? {
                  create: externalIds.map((id) => ({
                    source: id.source,
                    externalId: id.externalId,
                  })),
                }
              : undefined,
        };

        const media = await prisma.media.create({
          data: mediaData,
          include: {
            movie: true,
            externalIds: true,
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

    return { added, skipped, updated };
  }

  /**
   * Parses music information from file path
   * Example: Artist Name/Album Name/Track 01 - Song Title.mp3
   * Also handles external IDs: Artist {spotify-123}/Album/Song.mp3
   */
  private parseMusicInfo(
    relativePath: string,
    fileName: string
  ): {
    artist?: string;
    album?: string;
    title: string;
  } {
    // Remove external IDs
    const cleanPath = removeExternalIds(relativePath);
    const cleanFileName = removeExternalIds(fileName);

    const parts = cleanPath.split(/[\/\\]/);

    // Try to extract artist and album from directory structure
    const artist = parts.length > 1 ? parts[0]!.trim() : undefined;
    const album = parts.length > 2 ? parts[1]!.trim() : undefined;

    // Remove track number and extension to get title
    const title = cleanFileName
      .replace(extname(cleanFileName), "")
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
  ): Promise<{ added: number; skipped: number; updated: number }> {
    let added = 0;
    let skipped = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0, updated: 0 };
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

    return { added, skipped, updated: 0 };
  }

  /**
   * Parses comic information from file path
   * Example: Series Name/Series Name #001.cbz or Series Name Vol 1/Issue 01.cbr
   * Also handles external IDs: Series {comicvine-12345}/Issue 01.cbr
   */
  private parseComicInfo(
    relativePath: string,
    fileName: string
  ): {
    title: string;
    issue?: number;
    volume?: string;
  } {
    // Remove external IDs
    const cleanPath = removeExternalIds(relativePath);
    const cleanFileName = removeExternalIds(fileName);

    const parts = cleanPath.split(/[\/\\]/);
    const seriesName = parts.length > 1 ? parts[0]!.trim() : undefined;

    // Try to extract issue number (e.g., #001, Issue 01, 001)
    const issueMatch = cleanFileName.match(/#?(\d+)/);
    const issue = issueMatch ? parseInt(issueMatch[1]!, 10) : undefined;

    // Try to extract volume (e.g., Vol 1, Volume 1)
    const volumeMatch =
      cleanPath.match(/Vol(?:ume)?\s*(\d+)/i) ||
      cleanFileName.match(/Vol(?:ume)?\s*(\d+)/i);
    const volume = volumeMatch ? volumeMatch[1] : undefined;

    // Use series name or clean filename as title
    const title =
      seriesName ||
      cleanFileName
        .replace(extname(cleanFileName), "")
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
  ): Promise<{ added: number; skipped: number; updated: number }> {
    let added = 0;
    let skipped = 0;

    // Early return if no files
    if (files.length === 0) {
      return { added: 0, skipped: 0, updated: 0 };
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

    return { added, skipped, updated: 0 };
  }

  /**
   * Main scan method
   * Can add new files or update existing ones based on options
   */
  async scan(options: ScanOptions): Promise<ScanResult> {
    const { path, mediaType, collectionName, updateExisting } = options;

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
          updated: 0,
        },
      };
    }

    // Initialize stats
    let stats = {
      added: 0,
      skipped: 0,
      updated: 0,
    };

    // Save to database based on media type
    if (files.length > 0) {
      let saveStats;
      switch (mediaType) {
        case MediaType.TV_SHOW:
          saveStats = await this.saveTVShowsToDatabase(
            files,
            finalCollectionName,
            { updateExisting }
          );
          break;
        case MediaType.MOVIE:
          saveStats = await this.saveMoviesToDatabase(
            files,
            finalCollectionName,
            { updateExisting }
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
