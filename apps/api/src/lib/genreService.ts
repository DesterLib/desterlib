import { prisma } from "./prisma.js";
import {
  normalizeGenreName,
  createGenreSlug,
} from "../config/genre-mapping.js";
import logger from "../config/logger.js";

/**
 * Genre Service
 *
 * Handles genre operations including:
 * - Finding or creating genres with normalization
 * - Linking genres to media
 * - Updating genres for existing media
 */
export class GenreService {
  private static instance: GenreService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): GenreService {
    if (!GenreService.instance) {
      GenreService.instance = new GenreService();
    }
    return GenreService.instance;
  }

  /**
   * Find or create a genre by name
   * Normalizes the genre name and creates a slug automatically
   *
   * @param genreName - The genre name (will be normalized)
   * @param prismaClient - Optional Prisma client for transactions
   * @returns The genre record
   */
  async findOrCreateGenre(
    genreName: string,
    prismaClient: typeof prisma = prisma
  ) {
    // Normalize the genre name
    const normalizedName = normalizeGenreName(genreName);
    const slug = createGenreSlug(normalizedName);

    try {
      // Try to find existing genre by name
      let genre = await prismaClient.genre.findUnique({
        where: { name: normalizedName },
      });

      if (!genre) {
        // Try to find by slug as fallback
        genre = await prismaClient.genre.findUnique({
          where: { slug },
        });
      }

      if (!genre) {
        // Create new genre
        logger.debug(`Creating new genre: ${normalizedName}`, {
          name: normalizedName,
          slug,
        });

        genre = await prismaClient.genre.create({
          data: {
            name: normalizedName,
            slug,
          },
        });
      }

      return genre;
    } catch (error) {
      logger.error(`Error finding or creating genre: ${genreName}`, {
        error,
        genreName,
        normalizedName,
        slug,
      });
      throw error;
    }
  }

  /**
   * Link multiple genres to a media item
   *
   * @param mediaId - The media ID
   * @param genreNames - Array of genre names from metadata provider
   * @param prismaClient - Optional Prisma client for transactions
   */
  async linkGenresToMedia(
    mediaId: string,
    genreNames: string[],
    prismaClient: typeof prisma = prisma
  ): Promise<void> {
    if (!genreNames || genreNames.length === 0) {
      return;
    }

    try {
      // Find or create all genres
      const genres = await Promise.all(
        genreNames.map((name) => this.findOrCreateGenre(name, prismaClient))
      );

      // Link genres to media (upsert to avoid duplicates)
      await Promise.all(
        genres.map((genre) =>
          prismaClient.mediaGenre.upsert({
            where: {
              mediaId_genreId: {
                mediaId,
                genreId: genre.id,
              },
            },
            create: {
              mediaId,
              genreId: genre.id,
            },
            update: {}, // No updates needed, just ensure it exists
          })
        )
      );

      logger.debug(`Linked ${genres.length} genres to media ${mediaId}`, {
        mediaId,
        genres: genres.map((g) => g.name),
      });
    } catch (error) {
      logger.error(`Error linking genres to media ${mediaId}`, {
        error,
        mediaId,
        genreNames,
      });
      // Don't throw - genres are not critical, we can continue without them
    }
  }

  /**
   * Update genres for a media item
   * Removes old genre links and adds new ones
   *
   * @param mediaId - The media ID
   * @param genreNames - Array of genre names from metadata provider
   * @param prismaClient - Optional Prisma client for transactions
   */
  async updateGenresForMedia(
    mediaId: string,
    genreNames: string[],
    prismaClient: typeof prisma = prisma
  ): Promise<void> {
    if (!genreNames || genreNames.length === 0) {
      return;
    }

    try {
      // Get current genre IDs for this media
      const currentGenreLinks = await prismaClient.mediaGenre.findMany({
        where: { mediaId },
        select: { genreId: true },
      });
      const currentGenreIds = new Set(
        currentGenreLinks.map((link) => link.genreId)
      );

      // Find or create new genres
      const newGenres = await Promise.all(
        genreNames.map((name) => this.findOrCreateGenre(name, prismaClient))
      );
      const newGenreIds = new Set(newGenres.map((genre) => genre.id));

      // Determine which genres to add and remove
      const genresToAdd = newGenres.filter(
        (genre) => !currentGenreIds.has(genre.id)
      );
      const genreIdsToRemove = Array.from(currentGenreIds).filter(
        (id) => !newGenreIds.has(id)
      );

      // Remove old genre links
      if (genreIdsToRemove.length > 0) {
        await prismaClient.mediaGenre.deleteMany({
          where: {
            mediaId,
            genreId: { in: genreIdsToRemove },
          },
        });
        logger.debug(
          `Removed ${genreIdsToRemove.length} old genres from media ${mediaId}`
        );
      }

      // Add new genre links
      if (genresToAdd.length > 0) {
        await Promise.all(
          genresToAdd.map((genre) =>
            prismaClient.mediaGenre.create({
              data: {
                mediaId,
                genreId: genre.id,
              },
            })
          )
        );
        logger.debug(
          `Added ${genresToAdd.length} new genres to media ${mediaId}`,
          {
            genres: genresToAdd.map((g) => g.name),
          }
        );
      }
    } catch (error) {
      logger.error(`Error updating genres for media ${mediaId}`, {
        error,
        mediaId,
        genreNames,
      });
      // Don't throw - genres are not critical
    }
  }

  /**
   * Get all genres
   */
  async getAllGenres(prismaClient: typeof prisma = prisma) {
    return prismaClient.genre.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get genres for a specific media item
   */
  async getGenresForMedia(
    mediaId: string,
    prismaClient: typeof prisma = prisma
  ) {
    const mediaGenres = await prismaClient.mediaGenre.findMany({
      where: { mediaId },
      include: { genre: true },
    });

    return mediaGenres.map((mg) => mg.genre);
  }
}

// Export singleton instance
export const genreService = GenreService.getInstance();
