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
import {
  parseExternalIds,
  removeExternalIds,
} from "../../../lib/metadata/index.js";
import logger from "../../../config/logger.js";
import { metadataService } from "../../../lib/metadata/index.js";

interface TVShowInfo extends ParsedMediaInfo {
  showName: string;
  season?: number;
  episode?: number;
}

export class TVShowProcessor implements MediaProcessor {
  parseInfo(relativePath: string, _fileName: string): TVShowInfo {
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

    // Extract show name from filename or directory structure
    const parts = cleanPath.split(/[/\\]/);
    const filename = parts[parts.length - 1] || cleanPath;

    // Try to extract show name before the season/episode pattern
    const showNameMatch = filename.match(/^(.+?)\s*-\s*[Ss]\d{1,2}[Ee]\d{1,3}/);
    const showName = showNameMatch
      ? showNameMatch[1]!.trim()
      : parts.length > 1
        ? parts[0]!.trim()
        : filename.replace(extname(filename), "").trim();

    return {
      title: showName,
      showName,
      season,
      episode,
    };
  }

  async saveToDatabase(
    files: ScannedFile[],
    collection: Collection,
    prisma: PrismaClient,
    options?: { updateExisting?: boolean }
  ): Promise<SaveStats> {
    const stats: SaveStats = { added: 0, skipped: 0, updated: 0 };

    // Group files by show name
    const showsMap = this.groupFilesByShow(files);

    // Process each show
    for (const [showName, seasonsMap] of showsMap) {
      const showStats = await this.processShow(
        showName,
        seasonsMap,
        collection,
        prisma,
        options
      );
      stats.added += showStats.added;
      stats.skipped += showStats.skipped;
      stats.updated += showStats.updated;
    }

    return stats;
  }

  private groupFilesByShow(
    files: ScannedFile[]
  ): Map<string, Map<number, { episode: number; file: ScannedFile }[]>> {
    const showsMap = new Map<
      string,
      Map<number, { episode: number; file: ScannedFile }[]>
    >();

    for (const file of files) {
      const { showName, season, episode } = this.parseInfo(
        file.relativePath,
        file.name
      );

      if (!showName || season === undefined || episode === undefined) {
        logger.warn(`Could not parse TV show info from: ${file.relativePath}`, {
          relativePath: file.relativePath,
        });
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

    return showsMap;
  }

  private async processShow(
    showName: string,
    seasonsMap: Map<number, { episode: number; file: ScannedFile }[]>,
    collection: Collection,
    prisma: PrismaClient,
    options?: { updateExisting?: boolean }
  ): Promise<SaveStats> {
    const stats: SaveStats = { added: 0, skipped: 0, updated: 0 };

    // Find or create TV show
    let media = await prisma.media.findFirst({
      where: {
        title: showName,
        type: MediaTypeEnum.TV_SHOW,
      },
      include: {
        tvShow: {
          include: { seasons: true },
        },
        externalIds: true,
      },
    });

    if (!media) {
      media = await this.createShow(showName, seasonsMap, prisma);
    } else if (options?.updateExisting) {
      await this.updateShow(media, seasonsMap, prisma);
    }

    // TypeScript guard: media is guaranteed to exist here
    if (!media) {
      throw new Error(`Failed to find or create show: ${showName}`);
    }

    // Link to collection
    await this.linkToCollection(media.id, collection.id, prisma);

    // Process seasons and episodes
    for (const [seasonNumber, episodes] of seasonsMap) {
      const seasonStats = await this.processSeason(
        media,
        seasonNumber,
        episodes,
        prisma,
        options
      );
      stats.added += seasonStats.added;
      stats.skipped += seasonStats.skipped;
      stats.updated += seasonStats.updated;
    }

    return stats;
  }

  private async createShow(
    showName: string,
    seasonsMap: Map<number, { episode: number; file: ScannedFile }[]>,
    prisma: PrismaClient
  ): Promise<any> {
    // Get first episode to extract external IDs
    const firstEpisode = Array.from(seasonsMap.values())[0]?.[0];
    const parsedIds = firstEpisode
      ? parseExternalIds(firstEpisode.file.relativePath)
      : [];

    // Fetch metadata
    let metadata = null;
    if (parsedIds.length > 0 && parsedIds[0]) {
      try {
        metadata = await metadataService.getMetadata(
          parsedIds[0].id,
          parsedIds[0].source,
          MediaTypeEnum.TV_SHOW
        );
      } catch (error) {
        logger.warn("Failed to fetch metadata:", { error });
      }
    }

    const externalIds = parsedIds.map((id) => ({
      source: id.source,
      externalId: id.id,
    }));

    return await prisma.media.create({
      data: {
        title: metadata?.title || showName,
        type: MediaTypeEnum.TV_SHOW,
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
        externalIds:
          externalIds.length > 0 ? { create: externalIds } : undefined,
      },
      include: {
        tvShow: {
          include: { seasons: true },
        },
        externalIds: true,
      },
    });
  }

  private async updateShow(
    media: any,
    seasonsMap: Map<number, { episode: number; file: ScannedFile }[]>,
    prisma: PrismaClient
  ): Promise<void> {
    const firstEpisode = Array.from(seasonsMap.values())[0]?.[0];
    if (!firstEpisode) return;

    const parsedIds = parseExternalIds(firstEpisode.file.relativePath);

    // Fetch metadata
    let metadata = null;
    if (parsedIds.length > 0 && parsedIds[0]) {
      try {
        metadata = await metadataService.getMetadata(
          parsedIds[0].id,
          parsedIds[0].source,
          MediaTypeEnum.TV_SHOW
        );
      } catch (error) {
        logger.warn("Failed to fetch metadata:", { error });
      }
    }

    // Update media
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

    // Update TV show fields
    if (media.tvShow) {
      await prisma.tVShow.update({
        where: { id: media.tvShow.id },
        data: {
          creator: metadata?.tvShow?.creator || media.tvShow.creator,
          network: metadata?.tvShow?.network || media.tvShow.network,
        },
      });
    }

    // Add new external IDs
    const existingExternalIdSources = new Set(
      media.externalIds.map((id: any) => id.source)
    );

    for (const parsed of parsedIds) {
      if (!existingExternalIdSources.has(parsed.source)) {
        try {
          await prisma.externalId.create({
            data: {
              source: parsed.source,
              externalId: parsed.id,
              mediaId: media.id,
            },
          });
        } catch {
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

  private async processSeason(
    media: any,
    seasonNumber: number,
    episodes: { episode: number; file: ScannedFile }[],
    prisma: PrismaClient,
    options?: { updateExisting?: boolean }
  ): Promise<SaveStats> {
    const stats: SaveStats = { added: 0, skipped: 0, updated: 0 };

    // Find or create season
    let season = media.tvShow.seasons.find(
      (s: any) => s.number === seasonNumber
    );

    if (!season) {
      season = await prisma.season.create({
        data: {
          number: seasonNumber,
          tvShowId: media.tvShow.id,
        },
      });
      media.tvShow.seasons.push(season);
    }

    // Process episodes
    for (const { episode: episodeNumber, file } of episodes) {
      const existingEpisode = await prisma.episode.findUnique({
        where: { filePath: file.path },
      });

      if (existingEpisode) {
        if (options?.updateExisting) {
          await this.updateEpisode(existingEpisode.id, file, prisma);
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } else {
        await this.createEpisode(file, episodeNumber, season.id, prisma);
        stats.added++;
      }
    }

    return stats;
  }

  private async createEpisode(
    file: ScannedFile,
    episodeNumber: number,
    seasonId: string,
    prisma: PrismaClient
  ): Promise<void> {
    const fileStats = await fs.stat(file.path);

    await prisma.episode.create({
      data: {
        title: file.name.replace(extname(file.name), ""),
        number: episodeNumber,
        filePath: file.path,
        fileSize: BigInt(file.size),
        fileModifiedAt: fileStats.mtime,
        seasonId,
      },
    });
  }

  private async updateEpisode(
    episodeId: string,
    file: ScannedFile,
    prisma: PrismaClient
  ): Promise<void> {
    const fileStats = await fs.stat(file.path);

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        title: file.name.replace(extname(file.name), ""),
        fileSize: BigInt(file.size),
        fileModifiedAt: fileStats.mtime,
      },
    });
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
    if (!media.tvShow) return [];

    const paths: string[] = [];
    for (const season of media.tvShow.seasons || []) {
      for (const episode of season.episodes || []) {
        if (episode.filePath) {
          paths.push(episode.filePath);
        }
      }
    }
    return paths;
  }
}
