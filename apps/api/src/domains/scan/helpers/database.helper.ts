/**
 * Database operations for media scanning
 * Handles saving media, movies, TV shows, and related data
 */

import prisma from "@/lib/database/prisma";
import { logger, mapContainerToHostPath } from "@/lib/utils";
import { MediaType } from "@/lib/database";
import { assignGenresToMedia } from "../../../core/services/genre.service";
import { getTmdbImageUrl } from "./tmdb-image.helper";
import type {
  TmdbEpisodeMetadata,
  TmdbSeasonMetadata,
} from "@/lib/providers/tmdb/tmdb.types";
import type { MediaEntry, TmdbMetadata } from "../scan.types";

// Extended metadata type with additional fields
type ExtendedMetadata = TmdbMetadata & {
  original_title?: string;
  original_name?: string;
  vote_count?: number;
  popularity?: number;
  status?: string;
  runtime?: number;
  episode_run_time?: number[];
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    crew?: Array<{ id: number; name: string; job: string }>;
  };
};

/**
 * Create or update media record in database
 */
export async function upsertMedia(
  metadata: TmdbMetadata,
  tmdbId: string,
  mediaType: "movie" | "tv",
  additionalImages?: {
    plainPosterUrl?: string | null;
    logoUrl?: string | null;
  }
) {
  // Check if media already exists
  const existingExternalId = await prisma.externalId.findUnique({
    where: {
      source_externalId: {
        source: "TMDB",
        externalId: tmdbId,
      },
    },
    include: {
      media: true,
    },
  });

  // Debug logging for poster URL
  const posterUrl = getTmdbImageUrl(metadata.poster_path);
  const backdropUrl = getTmdbImageUrl(metadata.backdrop_path);
  const plainPosterUrl = additionalImages?.plainPosterUrl || null;
  const logoUrl = additionalImages?.logoUrl || null;

  logger.debug(
    `[${metadata.title || metadata.name}] poster_path: ${metadata.poster_path} → posterUrl: ${posterUrl}`
  );
  logger.debug(
    `[${metadata.title || metadata.name}] backdrop_path: ${metadata.backdrop_path} → backdropUrl: ${backdropUrl}`
  );
  logger.debug(
    `[${metadata.title || metadata.name}] plainPosterUrl: ${plainPosterUrl}, logoUrl: ${logoUrl}`
  );

  let media;

  if (existingExternalId) {
    // Update existing media
    media = await prisma.media.update({
      where: { id: existingExternalId.mediaId },
      data: {
        title: metadata.title || metadata.name || "Unknown",
        description: metadata.overview,
        posterUrl,
        plainPosterUrl,
        backdropUrl,
        logoUrl,
        releaseDate: metadata.release_date
          ? new Date(metadata.release_date)
          : metadata.first_air_date
            ? new Date(metadata.first_air_date)
            : null,
        rating: metadata.vote_average,
      },
    });
  } else {
    // Create new media
    media = await prisma.media.create({
      data: {
        title: metadata.title || metadata.name || "Unknown",
        type: mediaType === "tv" ? MediaType.TV_SHOW : MediaType.MOVIE,
        description: metadata.overview,
        posterUrl,
        plainPosterUrl,
        backdropUrl,
        logoUrl,
        releaseDate: metadata.release_date
          ? new Date(metadata.release_date)
          : metadata.first_air_date
            ? new Date(metadata.first_air_date)
            : null,
        rating: metadata.vote_average,
      },
    });

    // Create external ID for TMDB
    await prisma.externalId.create({
      data: {
        source: "TMDB",
        externalId: tmdbId,
        mediaId: media.id,
      },
    });
  }

  return media;
}

/**
 * Save external IDs (IMDB, TVDB) for media
 */
export async function saveExternalIds(
  mediaId: string,
  extractedIds: {
    imdbId?: string;
    tvdbId?: string;
  }
) {
  // Create/update IMDB external ID if exists
  if (extractedIds.imdbId) {
    await prisma.externalId.upsert({
      where: {
        source_externalId: {
          source: "IMDB",
          externalId: extractedIds.imdbId,
        },
      },
      update: {
        mediaId: mediaId,
      },
      create: {
        source: "IMDB",
        externalId: extractedIds.imdbId,
        mediaId: mediaId,
      },
    });
  }

  // Create/update TVDB external ID if exists
  if (extractedIds.tvdbId) {
    await prisma.externalId.upsert({
      where: {
        source_externalId: {
          source: "TVDB",
          externalId: extractedIds.tvdbId.toString(),
        },
      },
      update: {
        mediaId: mediaId,
      },
      create: {
        source: "TVDB",
        externalId: extractedIds.tvdbId.toString(),
        mediaId: mediaId,
      },
    });
  }
}

/**
 * Save genres for media
 */
export async function saveGenres(
  mediaId: string,
  genres: Array<{ id: number; name: string }> | undefined,
  mediaTitle: string
) {
  // Debug logging for genres
  if (!genres || genres.length === 0) {
    logger.warn(`[${mediaTitle}] No genres received from TMDB metadata`);
    return;
  }

  logger.debug(
    `[${mediaTitle}] Received ${genres.length} genres from TMDB: ${genres.map((g) => g.name).join(", ")}`
  );

  const result = await assignGenresToMedia(mediaId, genres);
  logger.info(
    `✓ Genres for ${mediaTitle}: ${result.linked} linked${result.duplicatesAvoided > 0 ? `, ${result.duplicatesAvoided} duplicates avoided` : ""}`
  );
}

/**
 * Save movie record to database
 */
export async function saveMovie(
  mediaId: string,
  mediaEntry: MediaEntry,
  extendedMetadata: ExtendedMetadata,
  filePathForStorage: string
) {
  await prisma.movie.upsert({
    where: { mediaId: mediaId },
    update: {
      duration: extendedMetadata.runtime,
      filePath: filePathForStorage,
      fileSize: BigInt(mediaEntry.size),
      fileModifiedAt: mediaEntry.modified,
    },
    create: {
      mediaId: mediaId,
      duration: extendedMetadata.runtime,
      filePath: filePathForStorage,
      fileSize: BigInt(mediaEntry.size),
      fileModifiedAt: mediaEntry.modified,
    },
  });

  // Handle director if exists in metadata
  const director = extendedMetadata.credits?.crew?.find(
    (c: { id: number; name: string; job: string }) => c.job === "Director"
  );
  if (director) {
    // Create or get person
    const person = await prisma.person.upsert({
      where: { id: director.id.toString() },
      update: { name: director.name },
      create: {
        id: director.id.toString(),
        name: director.name,
      },
    });

    // Link director to media
    await prisma.mediaPerson.upsert({
      where: {
        mediaId_personId_role: {
          mediaId: mediaId,
          personId: person.id,
          role: "DIRECTOR",
        },
      },
      update: {},
      create: {
        mediaId: mediaId,
        personId: person.id,
        role: "DIRECTOR",
      },
    });
  }
}

/**
 * Save TV show and episode data to database
 */
export async function saveTVShow(
  mediaId: string,
  mediaEntry: MediaEntry,
  episodeCache: Map<string, TmdbSeasonMetadata>,
  filePathForStorage: string
) {
  // Create TV show record
  const tvShow = await prisma.tVShow.upsert({
    where: { mediaId: mediaId },
    update: {},
    create: {
      mediaId: mediaId,
    },
  });

  // Handle seasons and episodes if we have that info
  if (!mediaEntry.extractedIds.season) {
    return;
  }

  const seasonNumber = mediaEntry.extractedIds.season;

  // Create or get the season
  const season = await prisma.season.upsert({
    where: {
      tvShowId_number: {
        tvShowId: tvShow.id,
        number: seasonNumber,
      },
    },
    update: {},
    create: {
      tvShowId: tvShow.id,
      number: seasonNumber,
    },
  });

  // If we have episode info, create the episode
  if (!mediaEntry.extractedIds.episode) {
    return;
  }

  const episodeNumber = mediaEntry.extractedIds.episode;
  const fileTitleExtracted = mediaEntry.extractedIds.title;

  // Extract episode-specific metadata from cached season data
  let episodeTitle = `Episode ${episodeNumber}`;
  let episodeDuration: number | null = null;
  let episodeAirDate: Date | null = null;
  let episodeStillPath: string | null = null;

  if (mediaEntry.extractedIds.tmdbId) {
    const seasonCacheKey = `${mediaEntry.extractedIds.tmdbId}-S${seasonNumber}`;

    // Check season cache for episode data
    if (episodeCache.has(seasonCacheKey)) {
      const cachedSeason = episodeCache.get(seasonCacheKey);
      if (cachedSeason?.episodes) {
        const episode = cachedSeason.episodes.find(
          (ep: TmdbEpisodeMetadata) => ep.episode_number === episodeNumber
        );
        if (episode) {
          episodeTitle = episode.name || episodeTitle;
          episodeDuration = episode.runtime || null;
          episodeAirDate = episode.air_date ? new Date(episode.air_date) : null;
          episodeStillPath = getTmdbImageUrl(episode.still_path);
          logger.debug(
            `✓ Using cached episode metadata for S${seasonNumber}E${episodeNumber}`
          );
        }
      }
    }
  }

  await prisma.episode.upsert({
    where: {
      seasonId_number: {
        seasonId: season.id,
        number: episodeNumber,
      },
    },
    update: {
      title: episodeTitle,
      fileTitle: fileTitleExtracted || null,
      duration: episodeDuration,
      airDate: episodeAirDate,
      stillPath: episodeStillPath,
      filePath: filePathForStorage,
      fileSize: BigInt(mediaEntry.size),
      fileModifiedAt: mediaEntry.modified,
    },
    create: {
      seasonId: season.id,
      number: episodeNumber,
      title: episodeTitle,
      fileTitle: fileTitleExtracted || null,
      duration: episodeDuration,
      airDate: episodeAirDate,
      stillPath: episodeStillPath,
      filePath: filePathForStorage,
      fileSize: BigInt(mediaEntry.size),
      fileModifiedAt: mediaEntry.modified,
    },
  });

  return { seasonNumber, episodeNumber, episodeTitle, fileTitleExtracted };
}

/**
 * Link media to library
 */
export async function linkMediaToLibrary(mediaId: string, libraryId: string) {
  // Verify library exists before linking
  const library = await prisma.library.findUnique({
    where: { id: libraryId },
    select: { id: true },
  });

  if (!library) {
    throw new Error(
      `Cannot link media to library: Library with ID ${libraryId} does not exist`
    );
  }

  await prisma.mediaLibrary.upsert({
    where: {
      mediaId_libraryId: {
        mediaId: mediaId,
        libraryId: libraryId,
      },
    },
    update: {},
    create: {
      mediaId: mediaId,
      libraryId: libraryId,
    },
  });
}

/**
 * Main function to save media and file data to database
 * Orchestrates all database operations for a single media entry
 */
export async function saveMediaToDatabase(
  mediaEntry: MediaEntry,
  mediaType: "movie" | "tv",
  episodeCache: Map<string, TmdbSeasonMetadata>,
  libraryId: string,
  originalPath?: string
): Promise<void> {
  try {
    // Only process if we have metadata and a TMDB ID
    if (!mediaEntry.metadata || !mediaEntry.extractedIds.tmdbId) {
      logger.debug(`Skipping ${mediaEntry.path} - no metadata or TMDB ID`);
      return;
    }

    const metadata = mediaEntry.metadata;
    const tmdbId = mediaEntry.extractedIds.tmdbId.toString();

    // Map container path back to host path for database storage
    const filePathForStorage = mapContainerToHostPath(
      mediaEntry.path,
      originalPath
    );

    const extendedMetadata = metadata as ExtendedMetadata;

    // 1. Create or update media record
    const media = await upsertMedia(metadata, tmdbId, mediaType, {
      plainPosterUrl: mediaEntry.plainPosterUrl,
      logoUrl: mediaEntry.logoUrl,
    });

    // 2. Save external IDs (IMDB, TVDB)
    await saveExternalIds(media.id, {
      imdbId: mediaEntry.extractedIds.imdbId,
      tvdbId: mediaEntry.extractedIds.tvdbId,
    });

    // 3. Handle genres
    await saveGenres(media.id, extendedMetadata.genres, media.title);

    // 4. Save type-specific records
    if (mediaType === "movie") {
      await saveMovie(
        media.id,
        mediaEntry,
        extendedMetadata,
        filePathForStorage
      );
      logger.info(`✓ Saved ${media.title}`);
    } else {
      const result = await saveTVShow(
        media.id,
        mediaEntry,
        episodeCache,
        filePathForStorage
      );
      if (result) {
        const {
          seasonNumber,
          episodeNumber,
          episodeTitle,
          fileTitleExtracted,
        } = result;
        logger.info(
          `✓ Saved ${media.title} - S${seasonNumber}E${episodeNumber}: ${episodeTitle}${fileTitleExtracted ? ` (file: ${fileTitleExtracted})` : ""}`
        );
      } else if (mediaEntry.extractedIds.season) {
        logger.info(
          `✓ Saved ${media.title} - Season ${mediaEntry.extractedIds.season}`
        );
      } else {
        logger.info(
          `✓ Saved ${media.title} (TV Show - no season/episode info)`
        );
      }
    }

    // 5. Link media to library
    await linkMediaToLibrary(media.id, libraryId);
  } catch (error) {
    logger.error(
      `Error saving media to database for ${mediaEntry.path}: ${error instanceof Error ? error.message : error}`
    );
    throw error;
  }
}
