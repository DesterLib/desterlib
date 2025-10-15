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
import { removeExternalIds } from "../../../lib/metadata/index.js";

interface ComicInfo extends ParsedMediaInfo {
  issue?: number;
  volume?: string;
}

export class ComicProcessor implements MediaProcessor {
  parseInfo(relativePath: string, fileName: string): ComicInfo {
    // Remove external IDs
    const cleanPath = removeExternalIds(relativePath);
    const cleanFileName = removeExternalIds(fileName);

    const parts = cleanPath.split(/[/\\]/);
    const seriesName = parts.length > 1 ? parts[0]!.trim() : undefined;

    // Extract issue number (e.g., #001, Issue 01, 001)
    const issueMatch = cleanFileName.match(/#?(\d+)/);
    const issue = issueMatch ? parseInt(issueMatch[1]!, 10) : undefined;

    // Extract volume (e.g., Vol 1, Volume 1)
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

  async saveToDatabase(
    files: ScannedFile[],
    collection: Collection,
    prisma: PrismaClient
  ): Promise<SaveStats> {
    const stats: SaveStats = { added: 0, skipped: 0, updated: 0 };

    for (const file of files) {
      const existingComic = await prisma.comic.findUnique({
        where: { filePath: file.path },
      });

      if (existingComic) {
        // Link to collection
        await this.linkToCollection(
          existingComic.mediaId,
          collection.id,
          prisma
        );
        stats.skipped++;
      } else {
        await this.createComic(file, collection.id, prisma);
        stats.added++;
      }
    }

    return stats;
  }

  private async createComic(
    file: ScannedFile,
    collectionId: string,
    prisma: PrismaClient
  ): Promise<void> {
    const { title, issue, volume } = this.parseInfo(
      file.relativePath,
      file.name
    );
    const fileStats = await fs.stat(file.path);

    const media = await prisma.media.create({
      data: {
        title,
        type: MediaTypeEnum.COMIC,
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
    });

    // Link to collection
    await this.linkToCollection(media.id, collectionId, prisma);
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
    return media.comic?.filePath ? [media.comic.filePath] : [];
  }
}
