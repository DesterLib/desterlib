import prisma from "@/lib/database/prisma";
import { logger } from "@/lib/utils";
import {
  LibraryDeleteResult,
  LibraryUpdateResult,
  LibraryWithMetadata,
} from "./library.types";
import { Prisma, MediaType } from "../../../generated/prisma";

export const libraryServices = {
  delete: async (libraryId: string): Promise<LibraryDeleteResult> => {
    logger.info(`🗑️  Starting deletion of library: ${libraryId}`);

    // Find the library first
    const library = await prisma.library.findUnique({
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
    });

    if (!library) {
      throw new Error(`Library with ID ${libraryId} not found`);
    }

    logger.info(`📚 Found library: ${library.name}`);

    // Find media that ONLY belongs to this library
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediaToDelete = library.media
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((ml: any) => ml.media.libraries.length === 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((ml: any) => ml.mediaId);

    logger.info(
      `📊 Analysis:
  - Total media in library: ${library.media.length}
  - Media only in this library (will be deleted): ${mediaToDelete.length}
  - Media in other libraries (will be kept): ${library.media.length - mediaToDelete.length}`
    );

    // Use a transaction to ensure atomicity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
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
        success: true,
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
        media: true,
      },
      orderBy: [{ isLibrary: "desc" }, { name: "asc" }],
    });

    const librariesWithMetadata: LibraryWithMetadata[] = libraries.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (library: any) => ({
        ...library,
        createdAt: library.createdAt.toISOString(),
        updatedAt: library.updatedAt.toISOString(),
        mediaCount: library.media.length,
      })
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

    // First, check if library exists
    const existingLibrary = await prisma.library.findUnique({
      where: { id: libraryId },
    });

    if (!existingLibrary) {
      throw new Error(`Library with ID ${libraryId} not found`);
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
      success: true,
      library: updatedLibrary,
      message: `Successfully updated library "${updatedLibrary.name}"`,
    };
  },
};
