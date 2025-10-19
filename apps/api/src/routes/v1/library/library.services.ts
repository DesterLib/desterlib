import prisma from "@/lib/database/prisma";
import { logger } from "@/lib/utils";
import { LibraryDeleteResult } from "./library.types";

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
    const mediaToDelete = library.media
      .filter((ml) => ml.media.libraries.length === 1)
      .map((ml) => ml.mediaId);

    logger.info(
      `📊 Analysis:
  - Total media in library: ${library.media.length}
  - Media only in this library (will be deleted): ${mediaToDelete.length}
  - Media in other libraries (will be kept): ${library.media.length - mediaToDelete.length}`
    );

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
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
};
