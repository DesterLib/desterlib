import prisma from "@/lib/database/prisma";
import { logger } from "@/lib/utils";

/**
 * Media file info for streaming
 */
export interface MediaFileInfo {
  filePath: string;
  fileSize: bigint;
  title?: string;
  type: "movie" | "episode" | "music" | "comic";
}

/**
 * Service to find media file by ID across all media types
 */
export const streamServices = {
  /**
   * Find media file info by ID across movies, episodes, music, and comics
   */
  getMediaFileById: async (id: string): Promise<MediaFileInfo> => {
    logger.info(`🔍 Searching for media file with ID: ${id}`);

    // Try to find in movies first
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: { media: true },
    });

    if (movie && movie.filePath) {
      logger.info(`✅ Found movie: ${movie.media.title}`);
      return {
        filePath: movie.filePath,
        fileSize: movie.fileSize || BigInt(0),
        title: movie.media.title,
        type: "movie",
      };
    }

    // Try to find in episodes
    const episode = await prisma.episode.findUnique({
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
    });

    if (episode && episode.filePath) {
      logger.info(`✅ Found episode: ${episode.season.tvShow.media.title}`);
      return {
        filePath: episode.filePath,
        fileSize: episode.fileSize || BigInt(0),
        title: episode.season.tvShow.media.title,
        type: "episode",
      };
    }

    // Try to find in music
    const music = await prisma.music.findUnique({
      where: { id },
      include: { media: true },
    });

    if (music && music.filePath) {
      logger.info(`✅ Found music: ${music.media.title}`);
      return {
        filePath: music.filePath,
        fileSize: music.fileSize || BigInt(0),
        title: music.media.title,
        type: "music",
      };
    }

    // Try to find in comics
    const comic = await prisma.comic.findUnique({
      where: { id },
      include: { media: true },
    });

    if (comic && comic.filePath) {
      logger.info(`✅ Found comic: ${comic.media.title}`);
      return {
        filePath: comic.filePath,
        fileSize: comic.fileSize || BigInt(0),
        title: comic.media.title,
        type: "comic",
      };
    }

    logger.error(`❌ Media file not found with ID: ${id}`);
    throw new Error(`Media file with ID ${id} not found`);
  },
};
