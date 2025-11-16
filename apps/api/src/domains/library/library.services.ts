import prisma from "@/lib/database/prisma";
import { logger, NotFoundError } from "@/lib/utils";
import {
  LibraryDeleteResult,
  LibraryUpdateResult,
  LibraryWithMetadata,
  LibraryWithMediaRelations,
  MediaLibraryWithRelations,
  PrismaTransactionClient,
} from "./library.types";
import { Prisma, MediaType } from "@prisma/client";

export const libraryServices = {
  delete: async (libraryId: string): Promise<LibraryDeleteResult> => {
    logger.info(`🗑️  Starting deletion of library: ${libraryId}`);

    // Find the library first
    const library = (await prisma.library.findUnique({
      where: { id: libraryId },
      include: {
        media: {
          include: {
            media: {
              include: {
                libraries: true, // Get all library associations for each media
              },
            },
          },
        },
      },
    })) as LibraryWithMediaRelations | null;

    if (!library) {
      throw new NotFoundError("Library", libraryId);
    }

    logger.info(`📚 Found library: ${library.name}`);

    // Find media that ONLY belongs to this library
    const mediaToDelete = library.media
      .filter(
        (ml: MediaLibraryWithRelations) => ml.media.libraries.length === 1,
      )
      .map((ml: MediaLibraryWithRelations) => ml.mediaId);

    logger.info(
      `📊 Analysis:
  - Total media in library: ${library.media.length}
  - Media only in this library (will be deleted): ${mediaToDelete.length}
  - Media in other libraries (will be kept): ${library.media.length - mediaToDelete.length}`,
    );

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        let deletedCount = 0;

        // Delete media that only belongs to this library
        // The cascade rules will automatically delete:
        // - Movie/TVShow/Music/Comic records
        // - MediaPerson associations
        // - MediaGenre associations
        // - ExternalId records
        // - MediaLibrary associations
        if (mediaToDelete.length > 0) {
          const deleteResult = await tx.media.deleteMany({
            where: {
              id: {
                in: mediaToDelete,
              },
            },
          });
          deletedCount = deleteResult.count;
          logger.info(`✓ Deleted ${deletedCount} media entries`);
        }

        // Delete the library itself
        // This will also cascade delete:
        // - MediaLibrary associations (for media in other libraries)
        // - Child libraries
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
      },
    );

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
        media: true,
      },
      orderBy: [{ isLibrary: "desc" }, { name: "asc" }],
    });

    const librariesWithMetadata: LibraryWithMetadata[] = libraries.map(
      (library) => {
        // Destructure to exclude the media array from the response
        const { media, ...libraryWithoutMedia } = library;
        return {
          ...libraryWithoutMedia,
          createdAt: library.createdAt.toISOString(),
          updatedAt: library.updatedAt.toISOString(),
          mediaCount: media.length,
        };
      },
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
    },
  ): Promise<LibraryUpdateResult> => {
    logger.info(`✏️  Updating library: ${libraryId}`, updateData);

    // First, check if library exists
    const existingLibrary = await prisma.library.findUnique({
      where: { id: libraryId },
    });

    if (!existingLibrary) {
      throw new NotFoundError("Library", libraryId);
    }

    // Update the library, handling empty strings for URLs
    const cleanUpdateData: Prisma.LibraryUpdateInput = {};

    // Copy properties with proper type handling
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
