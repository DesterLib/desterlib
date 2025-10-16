import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { invalidateCache } from "../../lib/cacheMiddleware.js";

export class CollectionsService {
  /**
   * Get all collections with media count
   */
  async getCollections() {
    const collections = await prisma.collection.findMany({
      include: {
        media: {
          include: {
            media: {
              include: {
                tvShow: {
                  include: {
                    seasons: {
                      include: {
                        episodes: {
                          select: {
                            id: true,
                            title: true,
                            number: true,
                            duration: true,
                            airDate: true,
                            filePath: true,
                            seasonId: true,
                          },
                        },
                      },
                      orderBy: { number: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            media: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      posterUrl: collection.posterUrl,
      backdropUrl: collection.backdropUrl,
      mediaCount: collection._count.media,
      recentMedia: collection.media.slice(0, 4).map((mc) => mc.media),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));
  }

  /**
   * Get a single collection by slug or ID
   */
  async getCollectionBySlugOrId(slugOrId: string) {
    const collection = await prisma.collection.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        media: {
          include: {
            media: {
              include: {
                genres: {
                  include: {
                    genre: true,
                  },
                },
                externalIds: true,
                movie: {
                  select: {
                    id: true,
                    duration: true,
                    director: true,
                    trailerUrl: true,
                    filePath: true,
                    mediaId: true,
                  },
                },
                tvShow: {
                  include: {
                    seasons: {
                      include: {
                        episodes: {
                          select: {
                            id: true,
                            title: true,
                            number: true,
                            duration: true,
                            airDate: true,
                            filePath: true,
                            seasonId: true,
                          },
                        },
                      },
                      orderBy: { number: "asc" },
                    },
                  },
                },
                music: {
                  select: {
                    id: true,
                    artist: true,
                    album: true,
                    genre: true,
                    duration: true,
                    filePath: true,
                    mediaId: true,
                  },
                },
                comic: {
                  select: {
                    id: true,
                    issue: true,
                    volume: true,
                    publisher: true,
                    pages: true,
                    filePath: true,
                    mediaId: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            media: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError(`Collection "${slugOrId}" not found`);
    }

    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      posterUrl: collection.posterUrl,
      backdropUrl: collection.backdropUrl,
      mediaCount: collection._count.media,
      media: collection.media.map((mc) => mc.media),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  /**
   * Get all libraries (collections with isLibrary=true)
   */
  async getLibraries() {
    const libraries = await prisma.collection.findMany({
      where: {
        isLibrary: true,
      },
      include: {
        _count: {
          select: {
            media: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return libraries.map((library) => ({
      ...library,
      mediaCount: library._count.media,
    }));
  }

  /**
   * Get collection statistics
   */
  async getStatistics() {
    const [totalCollections, collectionsWithMedia] = await Promise.all([
      prisma.collection.count(),
      prisma.collection.count({
        where: {
          media: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total: totalCollections,
      withMedia: collectionsWithMedia,
      empty: totalCollections - collectionsWithMedia,
    };
  }

  /**
   * Delete a collection by ID
   * If it's a library, also deletes all associated media content
   */
  async deleteCollection(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        media: {
          include: {
            media: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID "${id}" not found`);
    }

    // If this is a library, delete all associated media
    // Libraries are the source of truth for media content
    if (collection.isLibrary) {
      const mediaIds = collection.media.map((mc) => mc.mediaId);

      if (mediaIds.length > 0) {
        // Delete all media items that were in this library
        // This will cascade to delete movies, TV shows, episodes, etc.
        await prisma.media.deleteMany({
          where: {
            id: { in: mediaIds },
          },
        });
      }
    }

    // Delete the collection itself
    // (MediaCollection join table entries will cascade delete)
    await prisma.collection.delete({
      where: { id },
    });

    // Invalidate relevant caches to ensure UI updates
    await invalidateCache("cache:GET:/api/v1/collections*");
    await invalidateCache("cache:GET:/api/v1/media*");
    await invalidateCache("cache:GET:/api/v1/movies*");
    await invalidateCache("cache:GET:/api/v1/tv-shows*");

    return { id, name: collection.name };
  }

  /**
   * Clean up orphaned media
   * Finds and deletes media items that are not associated with any collection
   */
  async cleanupOrphanedMedia() {
    // Find all media that has no collection associations
    const orphanedMedia = await prisma.media.findMany({
      where: {
        collections: {
          none: {},
        },
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
    });

    if (orphanedMedia.length === 0) {
      return {
        deleted: 0,
        media: [],
      };
    }

    const mediaIds = orphanedMedia.map((m) => m.id);

    // Delete all orphaned media
    // This will cascade to delete movies, TV shows, episodes, etc.
    await prisma.media.deleteMany({
      where: {
        id: { in: mediaIds },
      },
    });

    // Invalidate caches
    await invalidateCache("cache:GET:/api/v1/media*");
    await invalidateCache("cache:GET:/api/v1/movies*");
    await invalidateCache("cache:GET:/api/v1/tv-shows*");

    return {
      deleted: orphanedMedia.length,
      media: orphanedMedia,
    };
  }
}

// Export singleton instance
export const collectionsService = new CollectionsService();
