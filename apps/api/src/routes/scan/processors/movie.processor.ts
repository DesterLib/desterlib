import { promises as fs } from "fs";
import { extname } from "path";
import type { PrismaClient } from "../../../generated/prisma/index.js";
import { MediaType as MediaTypeEnum } from "../../../generated/prisma/index.js";
import type {
  MediaProcessor,
  ScannedFile,
  ParsedMediaInfo,
  SaveStats,
  Collection,
} from "./types.js";
import { parseExternalIds } from "../../../lib/metadata/index.js";
import { metadataService } from "../../../lib/metadata/index.js";
import logger from "../../../config/logger.js";

export class MovieProcessor implements MediaProcessor {
  parseInfo(_relativePath: string, fileName: string): ParsedMediaInfo {
    // Extract year from filename (e.g., Movie Name (2023).mkv)
    const yearMatch = fileName.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1]!, 10) : undefined;

    // Remove year, extension, and quality tags to get clean title
    const title = fileName
      .replace(extname(fileName), "")
      .replace(/\(\d{4}\)/, "")
      .replace(/\b(1080p|720p|480p|4K|HDTV|BluRay|WEB-DL|WEBRip)\b/gi, "")
      .replace(/[._-]+/g, " ")
      .trim();

    return { title, year };
  }

  async saveToDatabase(
    files: ScannedFile[],
    collection: Collection,
    prisma: PrismaClient,
    options?: { updateExisting?: boolean }
  ): Promise<SaveStats> {
    const stats: SaveStats = { added: 0, skipped: 0, updated: 0 };

    for (const file of files) {
      // Check if movie already exists
      const existingMovie = await prisma.movie.findUnique({
        where: { filePath: file.path },
        include: {
          media: {
            include: { externalIds: true },
          },
        },
      });

      if (existingMovie) {
        // Link to collection
        await this.linkToCollection(
          existingMovie.mediaId,
          collection.id,
          prisma
        );

        if (options?.updateExisting) {
          await this.updateMovie(file, existingMovie, prisma);
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } else {
        await this.createMovie(file, collection.id, prisma);
        stats.added++;
      }
    }

    return stats;
  }

  private async createMovie(
    file: ScannedFile,
    collectionId: string,
    prisma: PrismaClient
  ): Promise<void> {
    const { title, year } = this.parseInfo(file.relativePath, file.name);
    const fileStats = await fs.stat(file.path);

    // Extract external IDs from path
    const fullPath = `${file.relativePath}/${file.name}`;
    const parsedIds = parseExternalIds(fullPath);
    const externalIds = parsedIds.map((id) => ({
      source: id.source,
      externalId: id.id,
    }));

    // Fetch metadata if we have an external ID
    let metadata = null;
    if (parsedIds.length > 0 && parsedIds[0]) {
      try {
        metadata = await metadataService.getMetadata(
          parsedIds[0].id,
          parsedIds[0].source,
          MediaTypeEnum.MOVIE
        );
      } catch (error) {
        logger.warn("Failed to fetch metadata:", { error });
      }
    }

    // Create movie with metadata
    const media = await prisma.media.create({
      data: {
        title: metadata?.title || title,
        type: MediaTypeEnum.MOVIE,
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
        externalIds:
          externalIds.length > 0 ? { create: externalIds } : undefined,
      },
    });

    // Link to collection
    await this.linkToCollection(media.id, collectionId, prisma);
  }

  private async updateMovie(
    file: ScannedFile,
    existingMovie: any,
    prisma: PrismaClient
  ): Promise<void> {
    // Extract external IDs
    const fullPath = `${file.relativePath}/${file.name}`;
    const parsedIds = parseExternalIds(fullPath);

    // Fetch metadata if available
    let metadata = null;
    if (parsedIds.length > 0 && parsedIds[0]) {
      try {
        metadata = await metadataService.getMetadata(
          parsedIds[0].id,
          parsedIds[0].source,
          MediaTypeEnum.MOVIE
        );
      } catch (error) {
        logger.warn("Failed to fetch metadata:", { error });
      }
    }

    // Update media
    await prisma.media.update({
      where: { id: existingMovie.mediaId },
      data: {
        title: metadata?.title || existingMovie.media.title,
        description: metadata?.description || existingMovie.media.description,
        posterUrl: metadata?.posterUrl || existingMovie.media.posterUrl,
        backdropUrl: metadata?.backdropUrl || existingMovie.media.backdropUrl,
        rating: metadata?.rating || existingMovie.media.rating,
        releaseDate: metadata?.releaseDate || existingMovie.media.releaseDate,
      },
    });

    // Update movie-specific fields
    await prisma.movie.update({
      where: { id: existingMovie.id },
      data: {
        duration: metadata?.movie?.duration || existingMovie.duration,
        director: metadata?.movie?.director || existingMovie.director,
        trailerUrl: metadata?.movie?.trailerUrl || existingMovie.trailerUrl,
      },
    });

    // Add new external IDs
    const existingExternalIdSources = new Set(
      existingMovie.media.externalIds.map((id: any) => id.source)
    );

    for (const parsed of parsedIds) {
      if (!existingExternalIdSources.has(parsed.source)) {
        try {
          await prisma.externalId.create({
            data: {
              source: parsed.source,
              externalId: parsed.id,
              mediaId: existingMovie.mediaId,
            },
          });
        } catch {
          // Skip duplicates
          logger.debug(
            `Duplicate external ID skipped: ${parsed.source}-${parsed.id}`,
            {
              source: parsed.source,
              externalId: parsed.id,
            }
          );
        }
      }
    }
  }

  private async linkToCollection(
    mediaId: string,
    collectionId: string,
    prisma: PrismaClient
  ): Promise<void> {
    await prisma.mediaCollection.upsert({
      where: {
        mediaId_collectionId: {
          mediaId,
          collectionId,
        },
      },
      create: { mediaId, collectionId },
      update: {},
    });
  }

  getFilePaths(media: any): string[] {
    return media.movie?.filePath ? [media.movie.filePath] : [];
  }
}
