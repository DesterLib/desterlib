import { MediaType, ExternalIdSource } from "../../generated/prisma/index.js";
import type { MetadataProvider } from "./provider.js";
import type {
  MediaMetadata,
  MediaSearchResult,
  SeasonMetadata,
  EpisodeMetadata,
} from "./types.js";
import { tmdbProvider } from "./providers/tmdb.js";
import logger from "../../config/logger.js";

/**
 * Metadata service that orchestrates multiple metadata providers
 *
 * Usage:
 *   const service = MetadataService.getInstance();
 *   const results = await service.search("Inception", MediaType.MOVIE);
 *   const metadata = await service.getMetadata("12345", ExternalIdSource.TMDB, MediaType.MOVIE);
 */
export class MetadataService {
  private static instance: MetadataService;
  private providers: Map<ExternalIdSource, MetadataProvider> = new Map();

  private constructor() {
    // Register default providers
    this.registerProvider(tmdbProvider);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService();
    }
    return MetadataService.instance;
  }

  /**
   * Register a metadata provider
   */
  registerProvider(provider: MetadataProvider): void {
    this.providers.set(provider.source, provider);
  }

  /**
   * Get a provider by source
   */
  getProvider(source: ExternalIdSource): MetadataProvider | null {
    return this.providers.get(source) ?? null;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): MetadataProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all available providers (that are properly configured)
   */
  async getAvailableProviders(): Promise<MetadataProvider[]> {
    const providers = this.getAllProviders();
    const availability = await Promise.all(
      providers.map(async (p) => ({
        provider: p,
        available: await p.isAvailable(),
      }))
    );

    return availability.filter((a) => a.available).map((a) => a.provider);
  }

  /**
   * Search for media across all available providers
   * Returns aggregated results from all providers that support the media type
   */
  async searchAll(
    query: string,
    mediaType: MediaType,
    options?: {
      year?: number;
      language?: string;
      includeAdult?: boolean;
    }
  ): Promise<MediaSearchResult[]> {
    const providers = await this.getAvailableProviders();
    const supportedProviders = providers.filter((p) =>
      p.supportedMediaTypes.includes(mediaType)
    );

    const results = await Promise.all(
      supportedProviders.map((provider) =>
        provider.search(query, mediaType, options).catch((error) => {
          logger.error(`Error searching with provider ${provider.name}:`, {
            error,
            provider: provider.name,
          });
          return [] as MediaSearchResult[];
        })
      )
    );

    // Flatten and deduplicate results
    const allResults = results.flat();

    // Sort by relevance if available, otherwise by release date
    allResults.sort((a, b) => {
      if (a.relevanceScore !== undefined && b.relevanceScore !== undefined) {
        return b.relevanceScore - a.relevanceScore;
      }
      if (a.releaseDate && b.releaseDate) {
        return b.releaseDate.getTime() - a.releaseDate.getTime();
      }
      return 0;
    });

    return allResults;
  }

  /**
   * Search for media using a specific provider
   */
  async search(
    query: string,
    source: ExternalIdSource,
    mediaType: MediaType,
    options?: {
      year?: number;
      language?: string;
      includeAdult?: boolean;
    }
  ): Promise<MediaSearchResult[]> {
    const provider = this.getProvider(source);
    if (!provider) {
      throw new Error(`Provider for source ${source} not found`);
    }

    const available = await provider.isAvailable();
    if (!available) {
      throw new Error(`Provider ${provider.name} is not available`);
    }

    return provider.search(query, mediaType, options);
  }

  /**
   * Get full metadata from a specific provider
   */
  async getMetadata(
    externalId: string,
    source: ExternalIdSource,
    mediaType: MediaType,
    options?: {
      language?: string;
    }
  ): Promise<MediaMetadata | null> {
    const provider = this.getProvider(source);
    if (!provider) {
      logger.warn(`Provider for source ${source} not found`, { source });
      return null;
    }

    const available = await provider.isAvailable();
    if (!available) {
      logger.warn(`Provider ${provider.name} is not available`, {
        provider: provider.name,
      });
      return null;
    }

    return provider.getMetadata(externalId, mediaType, options);
  }

  /**
   * Get season metadata from a provider
   */
  async getSeasonMetadata(
    showExternalId: string,
    source: ExternalIdSource,
    seasonNumber: number,
    options?: {
      language?: string;
    }
  ): Promise<SeasonMetadata | null> {
    const provider = this.getProvider(source);
    if (!provider?.getSeasonMetadata) {
      logger.warn(
        `Provider for source ${source} does not support season metadata`,
        { source }
      );
      return null;
    }

    const available = await provider.isAvailable();
    if (!available) {
      logger.warn(`Provider ${provider.name} is not available`, {
        provider: provider.name,
      });
      return null;
    }

    return provider.getSeasonMetadata(showExternalId, seasonNumber, options);
  }

  /**
   * Get episode metadata from a provider
   */
  async getEpisodeMetadata(
    showExternalId: string,
    source: ExternalIdSource,
    seasonNumber: number,
    episodeNumber: number,
    options?: {
      language?: string;
    }
  ): Promise<EpisodeMetadata | null> {
    const provider = this.getProvider(source);
    if (!provider?.getEpisodeMetadata) {
      logger.warn(
        `Provider for source ${source} does not support episode metadata`,
        { source }
      );
      return null;
    }

    const available = await provider.isAvailable();
    if (!available) {
      logger.warn(`Provider ${provider.name} is not available`, {
        provider: provider.name,
      });
      return null;
    }

    return provider.getEpisodeMetadata(
      showExternalId,
      seasonNumber,
      episodeNumber,
      options
    );
  }

  /**
   * Check if a specific provider is available
   */
  async isProviderAvailable(source: ExternalIdSource): Promise<boolean> {
    const provider = this.getProvider(source);
    if (!provider) return false;
    return provider.isAvailable();
  }
}

// Export singleton instance
export const metadataService = MetadataService.getInstance();
