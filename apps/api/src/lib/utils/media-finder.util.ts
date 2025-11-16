/**
 * Unified media finding utility
 * Finds media files across all media types (movies, episodes, music, comics)
 */

import prisma from "@/lib/database/prisma";
import { logger, NotFoundError } from "@/lib/utils";

export interface MediaFileInfo {
  filePath: string;
  fileSize: bigint;
  title?: string;
  type: "movie" | "episode" | "music" | "comic";
}

// Types for Prisma query results
type MovieWithMedia = {
  filePath: string | null;
  fileSize: bigint | null;
  media: { title: string };
} | null;

type EpisodeWithMedia = {
  filePath: string | null;
  fileSize: bigint | null;
  season: {
    tvShow: {
      media: { title: string };
    };
  };
} | null;

type MusicWithMedia = {
  filePath: string | null;
  fileSize: bigint | null;
  media: { title: string };
} | null;

type ComicWithMedia = {
  filePath: string | null;
  fileSize: bigint | null;
  media: { title: string };
} | null;

/**
 * Configuration for media type queries
 */
const MEDIA_QUERIES = [
  {
    type: "movie" as const,
    finder: (id: string) =>
      prisma.movie.findUnique({
        where: { id },
        include: { media: true },
      }),
    mapper: (result: MovieWithMedia): MediaFileInfo | null =>
      result?.filePath
        ? {
            filePath: result.filePath,
            fileSize: result.fileSize || BigInt(0),
            title: result.media?.title,
            type: "movie",
          }
        : null,
  },
  {
    type: "episode" as const,
    finder: (id: string) =>
      prisma.episode.findUnique({
        where: { id },
        include: {
          season: {
            include: {
              tvShow: {
                include: { media: true },
              },
            },
          },
        },
      }),
    mapper: (result: EpisodeWithMedia): MediaFileInfo | null =>
      result?.filePath
        ? {
            filePath: result.filePath,
            fileSize: result.fileSize || BigInt(0),
            title: result.season?.tvShow?.media?.title,
            type: "episode",
          }
        : null,
  },
  {
    type: "music" as const,
    finder: (id: string) =>
      prisma.music.findUnique({
        where: { id },
        include: { media: true },
      }),
    mapper: (result: MusicWithMedia): MediaFileInfo | null =>
      result?.filePath
        ? {
            filePath: result.filePath,
            fileSize: result.fileSize || BigInt(0),
            title: result.media?.title,
            type: "music",
          }
        : null,
  },
  {
    type: "comic" as const,
    finder: (id: string) =>
      prisma.comic.findUnique({
        where: { id },
        include: { media: true },
      }),
    mapper: (result: ComicWithMedia): MediaFileInfo | null =>
      result?.filePath
        ? {
            filePath: result.filePath,
            fileSize: result.fileSize || BigInt(0),
            title: result.media?.title,
            type: "comic",
          }
        : null,
  },
];

/**
 * Find media file by ID across all media types
 *
 * @param id - Media file ID
 * @returns Media file information
 * @throws NotFoundError if media file is not found
 */
export async function findMediaFileById(id: string): Promise<MediaFileInfo> {
  logger.info(`🔍 Searching for media file with ID: ${id}`);

  // Try each media type in sequence
  for (const query of MEDIA_QUERIES) {
    const result = await query.finder(id);

    // Type assertion needed because each mapper expects a specific Prisma result type
    // but TypeScript sees a union of all possible types from the array
    let mediaInfo: MediaFileInfo | null = null;

    if (query.type === "movie") {
      mediaInfo = query.mapper(result as MovieWithMedia);
    } else if (query.type === "episode") {
      mediaInfo = query.mapper(result as EpisodeWithMedia);
    } else if (query.type === "music") {
      mediaInfo = query.mapper(result as MusicWithMedia);
    } else if (query.type === "comic") {
      mediaInfo = query.mapper(result as ComicWithMedia);
    }

    if (mediaInfo) {
      logger.info(`✅ Found ${query.type}: ${mediaInfo.title || id}`);
      return mediaInfo;
    }
  }

  // If not found in any table
  logger.error(`❌ Media file not found with ID: ${id}`);
  throw new NotFoundError("Media file", id);
}
