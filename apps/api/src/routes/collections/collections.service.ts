import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

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
   */
  async deleteCollection(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundError(`Collection with ID "${id}" not found`);
    }

    await prisma.collection.delete({
      where: { id },
    });

    return { id, name: collection.name };
  }
}

// Export singleton instance
export const collectionsService = new CollectionsService();
