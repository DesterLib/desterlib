/**
 * Metadata Updater Service
 * Handles updating media metadata in the database
 */

import { prisma } from "../../infrastructure/prisma";
import {
  MetadataError,
  METADATA_ERROR_CODES,
} from "../../infrastructure/utils/errors";

export interface MetadataUpdateInput {
  providerId: string;
  externalIdSource: string; // Plugin-defined source identifier
  title: string;
  overview: string | null;
  posterUrl: string | null;
  nullPosterUrl: string | null;
  backdropUrl: string | null;
  nullBackdropUrl: string | null;
  logoUrl: string | null;
  releaseDate: Date | null;
  rating: number | null;
  genres: string[];
}

export class MetadataUpdaterService {
  /**
   * Update media metadata in the database
   */
  async updateMediaMetadata(
    mediaId: string,
    mediaType: string,
    metadata: MetadataUpdateInput
  ): Promise<void> {
    const isTvShow = mediaType === "TV_SHOW";
    const mediaTypeName = isTvShow ? "TV show" : "Movie";

    await prisma.$transaction(async (tx) => {
      if (isTvShow) {
        const tvShow = await tx.tVShow.findUnique({
          where: { id: mediaId },
          select: { id: true },
        });

        if (!tvShow) {
          throw new MetadataError(
            `${mediaTypeName} record not found: ${mediaId}`,
            METADATA_ERROR_CODES.MEDIA_NOT_FOUND
          );
        }

        await tx.tVShow.update({
          where: { id: mediaId },
          data: {
            title: metadata.title,
            overview: metadata.overview,
            posterUrl: metadata.posterUrl,
            nullPosterUrl: metadata.nullPosterUrl,
            backdropUrl: metadata.backdropUrl,
            nullBackdropUrl: metadata.nullBackdropUrl,
            logoUrl: metadata.logoUrl,
            firstAirDate: metadata.releaseDate,
            rating: metadata.rating,
            updatedAt: new Date(),
          },
        });

        await tx.externalId.upsert({
          where: {
            source_externalId: {
              source: metadata.externalIdSource,
              externalId: metadata.providerId,
            },
          },
          create: {
            source: metadata.externalIdSource,
            externalId: metadata.providerId,
            tvShowId: mediaId,
          },
          update: {
            updatedAt: new Date(),
          },
        });
      } else {
        const movie = await tx.movie.findUnique({
          where: { id: mediaId },
          select: { id: true },
        });

        if (!movie) {
          throw new MetadataError(
            `${mediaTypeName} record not found: ${mediaId}`,
            METADATA_ERROR_CODES.MEDIA_NOT_FOUND
          );
        }

        await tx.movie.update({
          where: { id: mediaId },
          data: {
            title: metadata.title,
            overview: metadata.overview,
            posterUrl: metadata.posterUrl,
            nullPosterUrl: metadata.nullPosterUrl,
            backdropUrl: metadata.backdropUrl,
            nullBackdropUrl: metadata.nullBackdropUrl,
            logoUrl: metadata.logoUrl,
            releaseDate: metadata.releaseDate,
            rating: metadata.rating,
            updatedAt: new Date(),
          },
        });

        await tx.externalId.upsert({
          where: {
            source_externalId: {
              source: metadata.externalIdSource,
              externalId: metadata.providerId,
            },
          },
          create: {
            source: metadata.externalIdSource,
            externalId: metadata.providerId,
            movieId: mediaId,
          },
          update: {
            updatedAt: new Date(),
          },
        });
      }

      await this.connectGenres(tx, mediaId, metadata.genres, isTvShow);
    });
  }

  /**
   * Connect genres to media item
   */
  private async connectGenres(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    mediaId: string,
    genres: string[],
    isTvShow: boolean
  ): Promise<void> {
    if (genres.length === 0) return;

    const genreConnections = await Promise.all(
      genres.map(async (genreName) => {
        const slug = genreName.toLowerCase().replace(/\s+/g, "-");
        const genre = await tx.genre.upsert({
          where: { slug },
          create: {
            name: genreName,
            slug,
          },
          update: {},
        });
        return { id: genre.id };
      })
    );

    if (isTvShow) {
      await tx.tVShow.update({
        where: { id: mediaId },
        data: {
          genres: {
            set: genreConnections,
          },
        },
      });
    } else {
      await tx.movie.update({
        where: { id: mediaId },
        data: {
          genres: {
            set: genreConnections,
          },
        },
      });
    }
  }
}
