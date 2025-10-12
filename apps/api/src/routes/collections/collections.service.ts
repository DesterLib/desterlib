import { PrismaClient } from "../../generated/prisma/index.js";
import { NotFoundError } from "../../lib/errors.js";

const prisma = new PrismaClient();

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
              select: {
                id: true,
                title: true,
                type: true,
                posterUrl: true,
                backdropUrl: true,
                rating: true,
                releaseDate: true,
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
                movie: true,
                tvShow: {
                  include: {
                    seasons: {
                      include: {
                        episodes: true,
                      },
                    },
                  },
                },
                music: true,
                comic: true,
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
}

// Export singleton instance
export const collectionsService = new CollectionsService();
