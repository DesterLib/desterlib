/**
 * Metadata Cache Utilities
 *
 * Specialized caching functions for media metadata from external APIs
 * (TMDB, IMDB, etc.) to reduce API calls and improve performance.
 */

import { cacheService } from "./cache.js";
import logger from "../config/logger.js";

/**
 * Cache TTL configurations (in seconds)
 */
export const CACHE_TTL = {
  // External API data (24 hours - data doesn't change often)
  TMDB_METADATA: 86400,
  EXTERNAL_METADATA: 86400,

  // Database queries (1 hour - may change with user actions)
  MEDIA_LIST: 3600,
  COLLECTION_LIST: 3600,
  SEARCH_RESULTS: 1800,

  // User data (5 minutes - changes frequently)
  USER_PREFERENCES: 300,

  // System data (10 minutes)
  SETTINGS: 600,
  GENRES: 3600,
};

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // TMDB metadata
  tmdbMovie: (tmdbId: string) => `tmdb:movie:${tmdbId}`,
  tmdbTvShow: (tmdbId: string) => `tmdb:tv:${tmdbId}`,
  tmdbPerson: (tmdbId: string) => `tmdb:person:${tmdbId}`,
  tmdbSearch: (query: string, type: string) => `tmdb:search:${type}:${query}`,

  // Media queries
  mediaById: (id: string) => `media:${id}`,
  mediaList: (type: string, filters: Record<string, unknown>) =>
    `media:list:${type}:${JSON.stringify(filters)}`,
  mediaSearch: (query: string) => `media:search:${query}`,

  // Collections
  collectionById: (id: string) => `collection:${id}`,
  collectionList: () => `collection:list`,
  collectionMedia: (id: string) => `collection:media:${id}`,

  // User data
  userSettings: (userId: string) => `user:settings:${userId}`,

  // System
  systemSettings: () => `system:settings`,
  genreList: () => `genre:list`,
};

/**
 * Cache invalidation patterns
 */
export const CachePatterns = {
  allMedia: () => `media:*`,
  mediaByType: (type: string) => `media:*:${type}:*`,
  allCollections: () => `collection:*`,
  allTMDB: () => `tmdb:*`,
  allSearch: () => `*:search:*`,
};

/**
 * Get or set TMDB movie metadata with caching
 */
export async function getCachedTMDBMovie<T>(
  tmdbId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = CacheKeys.tmdbMovie(tmdbId);
  return cacheService.getOrSet(key, fetchFn, CACHE_TTL.TMDB_METADATA);
}

/**
 * Get or set TMDB TV show metadata with caching
 */
export async function getCachedTMDBTvShow<T>(
  tmdbId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = CacheKeys.tmdbTvShow(tmdbId);
  return cacheService.getOrSet(key, fetchFn, CACHE_TTL.TMDB_METADATA);
}

/**
 * Get or set media list with caching
 */
export async function getCachedMediaList<T>(
  type: string,
  filters: Record<string, unknown>,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = CacheKeys.mediaList(type, filters);
  return cacheService.getOrSet(key, fetchFn, CACHE_TTL.MEDIA_LIST);
}

/**
 * Get or set search results with caching
 */
export async function getCachedSearchResults<T>(
  query: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = CacheKeys.mediaSearch(query);
  return cacheService.getOrSet(key, fetchFn, CACHE_TTL.SEARCH_RESULTS);
}

/**
 * Invalidate all media caches (after mutations)
 */
export async function invalidateMediaCache(): Promise<void> {
  logger.info("Invalidating media cache");
  await cacheService.delPattern(CachePatterns.allMedia());
  await cacheService.delPattern(CachePatterns.allSearch());
}

/**
 * Invalidate all collection caches (after mutations)
 */
export async function invalidateCollectionCache(): Promise<void> {
  logger.info("Invalidating collection cache");
  await cacheService.delPattern(CachePatterns.allCollections());
}

/**
 * Invalidate specific media item cache
 */
export async function invalidateMediaById(id: string): Promise<void> {
  await cacheService.del(CacheKeys.mediaById(id));
  // Also invalidate lists that might contain this media
  await cacheService.delPattern(CachePatterns.allMedia());
}

/**
 * Invalidate specific collection cache
 */
export async function invalidateCollectionById(id: string): Promise<void> {
  await cacheService.del(CacheKeys.collectionById(id));
  await cacheService.del(CacheKeys.collectionMedia(id));
  await cacheService.del(CacheKeys.collectionList());
}

/**
 * Warm up cache with frequently accessed data
 * Call this on server startup or scheduled intervals
 */
export async function warmupCache(): Promise<void> {
  if (!cacheService.isEnabled()) {
    logger.info("Cache is disabled, skipping warmup");
    return;
  }

  logger.info("Starting cache warmup...");

  try {
    // Import prisma dynamically to avoid circular dependencies
    const { prisma } = await import("./prisma.js");

    // Cache genre list
    const genres = await prisma.genre.findMany();
    await cacheService.set(CacheKeys.genreList(), genres, CACHE_TTL.GENRES);

    // Cache system settings
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    await cacheService.set(
      CacheKeys.systemSettings(),
      settings,
      CACHE_TTL.SETTINGS
    );

    // Cache collection list
    const collections = await prisma.collection.findMany({
      where: { isLibrary: true },
      select: { id: true, name: true, slug: true, libraryType: true },
    });
    await cacheService.set(
      CacheKeys.collectionList(),
      collections,
      CACHE_TTL.COLLECTION_LIST
    );

    logger.info("Cache warmup completed");
  } catch (error) {
    logger.error("Cache warmup failed:", error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  enabled: boolean;
  keys?: number;
  memory?: string;
  memoryUsedMB?: number;
}> {
  if (!cacheService.isEnabled()) {
    return { enabled: false };
  }

  try {
    // Get key count
    const keys = await cacheService.dbSize();

    // Get memory usage from Redis info
    const info = await cacheService.info("memory");
    let memoryUsedMB = 0;
    let memoryStr = "N/A";

    if (info) {
      // Parse used_memory_human from info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryValue = memoryMatch?.[1];
      if (memoryValue) {
        memoryStr = memoryValue.trim();
      }

      // Parse used_memory in bytes
      const memoryBytesMatch = info.match(/used_memory:(\d+)/);
      const bytesValue = memoryBytesMatch?.[1];
      if (bytesValue) {
        const bytes = parseInt(bytesValue, 10);
        memoryUsedMB = Math.round((bytes / 1024 / 1024) * 100) / 100;
      }
    }

    return {
      enabled: true,
      keys,
      memory: memoryStr,
      memoryUsedMB,
    };
  } catch (error) {
    logger.error("Failed to get cache stats:", error);
    return { enabled: true, keys: 0, memory: "Error" };
  }
}
