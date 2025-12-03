/**
 * Unified media finding utility
 * Finds media files across all media types (movies, episodes, music, comics)
 */

import { prisma } from "../prisma";
import { logger } from "@dester/logger";
import { NotFoundError } from "./errors";

export interface MediaFileInfo {
  filePath: string;
  fileSize: bigint;
  title?: string;
  type: "movie" | "episode" | "music" | "comic";
}

/**
 * Find media file by ID across all media types
 */
export async function findMediaFileById(id: string): Promise<MediaFileInfo> {
  logger.info(`🔍 Searching for media file with ID: ${id}`);

  // Query the central MediaItem table
  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
    include: {
      movie: true,
      episode: {
        include: {
          season: {
            include: {
              tvShow: true,
            },
          },
        },
      },
      music: true,
      comic: true,
    },
  });

  if (!mediaItem) {
    logger.error(`❌ Media file not found with ID: ${id}`);
    throw new NotFoundError("Media file", id);
  }

  let type: "movie" | "episode" | "music" | "comic" = "movie";
  let title: string | undefined;

  if (mediaItem.movie) {
    type = "movie";
    title = mediaItem.movie.title;
  } else if (mediaItem.episode) {
    type = "episode";
    title = `${mediaItem.episode.season?.tvShow?.title} - S${mediaItem.episode.season?.number}E${mediaItem.episode.number} - ${mediaItem.episode.title}`;
  } else if (mediaItem.music) {
    type = "music";
    title = mediaItem.music.title;
  } else if (mediaItem.comic) {
    type = "comic";
    title = mediaItem.comic.title;
  }

  logger.info(`✅ Found ${type}: ${title || id}`);

  return {
    filePath: mediaItem.filePath,
    fileSize: mediaItem.fileSize || BigInt(0),
    title,
    type,
  };
}
