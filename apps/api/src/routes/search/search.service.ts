import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

const API_BASE_URL = `http://localhost:${env.PORT}`;

export class SearchService {
  /**
   * Search across all media titles
   */
  async searchMedia(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Use raw SQL for case-insensitive search
    const mediaIds = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Media" 
      WHERE LOWER(title) LIKE ${searchTerm}
      ORDER BY title ASC
      LIMIT 20
    `;

    if (mediaIds.length === 0) {
      return [];
    }

    // Fetch full media objects with relations
    const results = await prisma.media.findMany({
      where: {
        id: {
          in: mediaIds.map((m) => m.id),
        },
      },
      include: {
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
        genres: {
          include: {
            genre: true,
          },
        },
        people: {
          include: {
            person: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    return this.addStreamingUrlsToArray(results);
  }

  /**
   * Search collections
   */
  async searchCollections(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Use raw SQL for case-insensitive search
    const collectionIds = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Collection" 
      WHERE LOWER(name) LIKE ${searchTerm} 
         OR LOWER(description) LIKE ${searchTerm}
      ORDER BY name ASC
      LIMIT 10
    `;

    if (collectionIds.length === 0) {
      return [];
    }

    // Fetch full collection objects with relations
    const results = await prisma.collection.findMany({
      where: {
        id: {
          in: collectionIds.map((c) => c.id),
        },
      },
      include: {
        media: {
          include: {
            media: {
              include: {
                movie: true,
                tvShow: true,
              },
            },
          },
          take: 5,
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return results;
  }

  /**
   * Add streaming URLs to media object and convert BigInt to string
   */
  private addStreamingUrls(media: any): any {
    if (!media) return media;

    // Convert BigInt fields to strings
    this.convertBigIntToString(media);

    // Add streaming URL for movies
    if (media.movie && media.movie.filePath) {
      media.movie.streamUrl = `${API_BASE_URL}/api/media/stream/movie/${media.id}`;
    }

    // Add streaming URLs for TV show episodes
    if (media.tvShow?.seasons) {
      for (const season of media.tvShow.seasons) {
        if (season.episodes) {
          for (const episode of season.episodes) {
            if (episode.filePath) {
              episode.streamUrl = `${API_BASE_URL}/api/media/stream/episode/${media.id}/${season.number}/${episode.number}`;
            }
          }
        }
      }
    }

    return media;
  }

  /**
   * Convert BigInt fields to strings recursively
   */
  private convertBigIntToString(obj: any): void {
    if (!obj || typeof obj !== "object") return;

    for (const key in obj) {
      if (typeof obj[key] === "bigint") {
        obj[key] = obj[key].toString();
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        this.convertBigIntToString(obj[key]);
      }
    }
  }

  /**
   * Add streaming URLs to an array of media objects
   */
  private addStreamingUrlsToArray(mediaArray: any[]): any[] {
    return mediaArray.map((media) => this.addStreamingUrls(media));
  }

  /**
   * Search all content (media + collections)
   */
  async searchAll(query: string) {
    const [media, collections] = await Promise.all([
      this.searchMedia(query),
      this.searchCollections(query),
    ]);

    return {
      media,
      collections,
      total: media.length + collections.length,
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();
