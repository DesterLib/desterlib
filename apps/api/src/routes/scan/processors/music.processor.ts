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

interface MusicInfo extends ParsedMediaInfo {
  artist?: string;
  album?: string;
}

export class MusicProcessor implements MediaProcessor {
  parseInfo(relativePath: string, fileName: string): MusicInfo {
    // Remove external IDs
    const cleanPath = removeExternalIds(relativePath);
    const cleanFileName = removeExternalIds(fileName);

    const parts = cleanPath.split(/[/\\]/);

    // Extract artist and album from directory structure
    // Example: Artist Name/Album Name/Track 01 - Song Title.mp3
    const artist = parts.length > 1 ? parts[0]!.trim() : undefined;
    const album = parts.length > 2 ? parts[1]!.trim() : undefined;

    // Remove track number and extension to get title
    const title = cleanFileName
      .replace(extname(cleanFileName), "")
      .replace(/^\d+[-.\s]+/, "") // Remove track number prefix
      .trim();

    return { title, artist, album };
  }

  async saveToDatabase(
    files: ScannedFile[],
    collection: Collection,
    prisma: PrismaClient
  ): Promise<SaveStats> {
    const stats: SaveStats = { added: 0, skipped: 0, updated: 0 };

    for (const file of files) {
      const existingMusic = await prisma.music.findUnique({
        where: { filePath: file.path },
      });

      if (existingMusic) {
        // Link to collection
        await this.linkToCollection(
          existingMusic.mediaId,
          collection.id,
          prisma
        );
        stats.skipped++;
      } else {
        await this.createMusic(file, collection.id, prisma);
        stats.added++;
      }
    }

    return stats;
  }

  private async createMusic(
    file: ScannedFile,
    collectionId: string,
    prisma: PrismaClient
  ): Promise<void> {
    const { title, artist, album } = this.parseInfo(
      file.relativePath,
      file.name
    );
    const fileStats = await fs.stat(file.path);

    const media = await prisma.media.create({
      data: {
        title,
        type: MediaTypeEnum.MUSIC,
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
    return media.music?.filePath ? [media.music.filePath] : [];
  }
}
