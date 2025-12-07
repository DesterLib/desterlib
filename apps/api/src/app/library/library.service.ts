import { prisma } from "../../infrastructure/prisma";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../infrastructure/utils/errors";
import type {
  LibraryDeleteResult,
  LibraryUpdateResult,
  LibraryWithMetadata,
} from "../../domain/entities/library/library.entity";
import { Prisma, MediaType } from "@prisma/client";

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple dashes with single dash
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
}

/**
 * Generate a unique slug by appending a number if needed
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.library.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const libraryService = {
  /**
   * Create or update a library based on the path
   * If a library with the same path exists, update it; otherwise create a new one
   */
  createOrUpdateByPath: async (data: {
    path: string;
    name?: string;
    description?: string | null;
    libraryType?: MediaType | null;
  }) => {
    const { path, name, description, libraryType } = data;

    const existingLibrary = await prisma.library.findFirst({
      where: { libraryPath: path, isLibrary: true },
    });

    if (existingLibrary) {
      logger.info(
        `Updating existing library: ${existingLibrary.name} (${path})`
      );

      const updateData: Prisma.LibraryUpdateInput = {
        libraryPath: path,
        isLibrary: true,
      };

      if (name !== undefined && name !== existingLibrary.name) {
        updateData.name = name;
        // Regenerate slug if name changed
        const baseSlug = generateSlug(name);
        updateData.slug = await generateUniqueSlug(baseSlug);
      }

      if (description !== undefined) {
        updateData.description = description || null;
      }
      if (libraryType !== undefined) {
        updateData.libraryType = libraryType || null;
      }

      const updated = await prisma.library.update({
        where: { id: existingLibrary.id },
        data: updateData,
      });

      logger.info(`✓ Updated library: ${updated.name}`);
      return updated;
    } else {
      // Generate name from path if not provided
      const libraryName =
        name ||
        path
          .split("/")
          .filter((p) => p)
          .pop() ||
        "Untitled Library";

      // Generate slug from name
      const baseSlug = generateSlug(libraryName);
      const slug = await generateUniqueSlug(baseSlug);

      logger.info(`Creating new library: ${libraryName} (${path})`);

      const created = await prisma.library.create({
        data: {
          name: libraryName,
          slug,
          description: description || null,
          libraryPath: path,
          libraryType: libraryType || null,
          isLibrary: true,
        },
      });

      logger.info(`✓ Created library: ${created.name}`);
      return created;
    }
  },

  delete: async (libraryId: string): Promise<LibraryDeleteResult> => {
    logger.info(`🗑️  Starting deletion of library: ${libraryId}`);

    const library = await prisma.library.findUnique({
      where: { id: libraryId },
      include: {
        movies: {
          include: {
            libraries: { select: { id: true } },
          },
        },
        tvShows: {
          include: {
            libraries: { select: { id: true } },
          },
        },
      },
    });

    if (!library) {
      throw new NotFoundError("Library", libraryId);
    }

    logger.info(`📚 Found library: ${library.name}`);

    // Identify items that ONLY belong to this library
    const moviesToDelete = library.movies
      .filter(
        (m) => m.libraries.length === 1 && m.libraries[0]?.id === libraryId
      )
      .map((m) => m.id);

    const tvShowsToDelete = library.tvShows
      .filter(
        (t) => t.libraries.length === 1 && t.libraries[0]?.id === libraryId
      )
      .map((t) => t.id);

    const totalMedia = library.movies.length + library.tvShows.length;
    const totalToDelete = moviesToDelete.length + tvShowsToDelete.length;

    logger.info(
      `📊 Analysis:
  - Total media in library: ${totalMedia}
  - Movies only in this library (will be deleted): ${moviesToDelete.length}
  - TV Shows only in this library (will be deleted): ${tvShowsToDelete.length}
  - Media in other libraries (will be kept): ${totalMedia - totalToDelete}`
    );

    const result = await prisma.$transaction(async (tx) => {
      let deletedCount = 0;

      if (moviesToDelete.length > 0) {
        const deleteMovies = await tx.movie.deleteMany({
          where: {
            id: {
              in: moviesToDelete,
            },
          },
        });
        deletedCount += deleteMovies.count;
      }

      if (tvShowsToDelete.length > 0) {
        const deleteTV = await tx.tVShow.deleteMany({
          where: {
            id: {
              in: tvShowsToDelete,
            },
          },
        });
        deletedCount += deleteTV.count;
      }

      await tx.library.delete({
        where: { id: libraryId },
      });
      logger.info(`✓ Deleted library: ${library.name}`);

      return {
        libraryId: library.id,
        libraryName: library.name,
        mediaDeleted: deletedCount,
        message: `Successfully deleted library "${library.name}" and ${deletedCount} associated media entries`,
      };
    });

    logger.info(`✅ Library deletion complete: ${library.name}\n`);
    return result;
  },

  getLibraries: async (filters?: {
    isLibrary?: boolean;
    libraryType?: string;
  }): Promise<LibraryWithMetadata[]> => {
    logger.info(`📚 Fetching libraries with filters:`, filters);

    const where: Prisma.LibraryWhereInput = {};

    if (filters?.isLibrary !== undefined) {
      where.isLibrary = filters.isLibrary;
    }

    if (filters?.libraryType) {
      where.libraryType = filters.libraryType as MediaType;
    }

    const libraries = await prisma.library.findMany({
      where,
      include: {
        _count: {
          select: {
            movies: true,
            tvShows: true,
          },
        },
      },
      orderBy: [{ isLibrary: "desc" }, { name: "asc" }],
    });

    const librariesWithMetadata: LibraryWithMetadata[] = libraries.map(
      (library) => {
        const { _count, ...libraryData } = library;
        return {
          ...libraryData,
          createdAt: library.createdAt,
          updatedAt: library.updatedAt,
          mediaCount: (_count.movies || 0) + (_count.tvShows || 0),
        };
      }
    );

    logger.info(`✓ Found ${librariesWithMetadata.length} libraries`);
    return librariesWithMetadata;
  },

  update: async (
    libraryId: string,
    updateData: {
      name?: string;
      description?: string;
      posterUrl?: string;
      backdropUrl?: string;
      libraryPath?: string;
      libraryType?: string;
    }
  ): Promise<LibraryUpdateResult> => {
    logger.info(`✏️  Updating library: ${libraryId}`, updateData);

    const existingLibrary = await prisma.library.findUnique({
      where: { id: libraryId },
    });

    if (!existingLibrary) {
      throw new NotFoundError("Library", libraryId);
    }

    const cleanUpdateData: Prisma.LibraryUpdateInput = {};

    if (updateData.name !== undefined) cleanUpdateData.name = updateData.name;
    if (updateData.description !== undefined) {
      cleanUpdateData.description =
        updateData.description === "" ? null : updateData.description;
    }
    if (updateData.posterUrl !== undefined) {
      cleanUpdateData.posterUrl =
        updateData.posterUrl === "" ? null : updateData.posterUrl;
    }
    if (updateData.backdropUrl !== undefined) {
      cleanUpdateData.backdropUrl =
        updateData.backdropUrl === "" ? null : updateData.backdropUrl;
    }
    if (updateData.libraryPath !== undefined)
      cleanUpdateData.libraryPath = updateData.libraryPath;
    if (updateData.libraryType !== undefined) {
      cleanUpdateData.libraryType =
        (updateData.libraryType as MediaType) || null;
    }

    const updatedLibrary = await prisma.library.update({
      where: { id: libraryId },
      data: cleanUpdateData,
    });

    logger.info(`✓ Updated library: ${updatedLibrary.name}`);

    return {
      library: updatedLibrary,
      message: `Successfully updated library "${updatedLibrary.name}"`,
    };
  },
};
