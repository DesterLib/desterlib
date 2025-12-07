import { IPlugin, PluginConfig, PluginStatus } from "@dester/types";
import { Logger } from "@dester/logger";
import { AniListProvider } from "./providers/anilist.provider";
import { RateLimiter } from "./rate-limiter";

/**
 * AniList Plugin
 * Handles mapping AniList metadata structure to database format
 * No database access, no image processing, no queue management
 */
export class AniListPlugin implements IPlugin {
  public readonly name = "anilist";
  public readonly version = "0.1.0";

  private logger: Logger | null = null;
  private config: PluginConfig | null = null;
  private provider: AniListProvider | null = null;
  private rateLimiter: RateLimiter | null = null;

  constructor() {
    // Logger will be set during init
  }

  private getLogger(): Logger {
    if (!this.logger) {
      throw new Error("Plugin not initialized. Logger is not available.");
    }
    return this.logger;
  }

  async init(config: PluginConfig): Promise<void> {
    this.config = config;

    // Get logger from config or create a default one
    if (config.logger) {
      this.logger = config.logger as Logger;
    } else {
      const { logger } = await import("@dester/logger");
      this.logger = logger;
    }

    // AniList rate limit: ~90 requests per minute (1.5 req/s)
    // We'll be conservative and use 1 request/second
    const rateLimitRps = parseFloat(
      (config.rateLimitRps as string) ||
        (config.config?.rateLimitRps as string) ||
        "1"
    );

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(rateLimitRps, this.getLogger());

    // Initialize AniList provider (no API key needed for basic queries)
    this.provider = new AniListProvider(this.rateLimiter, this.getLogger());

    this.getLogger().info(
      {
        provider: this.provider.getProviderName(),
      },
      "AniList plugin initialized"
    );
  }

  async start(): Promise<void> {
    this.getLogger().info("AniList plugin started");
  }

  async stop(): Promise<void> {
    this.getLogger().info("AniList plugin stopped");
  }

  getStatus(): PluginStatus {
    const hasProvider = this.provider !== null && this.provider.isAvailable();

    let status: PluginStatus["status"] = "initialized";
    if (!hasProvider) {
      status = "error";
    }

    return {
      status,
      message: hasProvider
        ? "AniList plugin is operational"
        : "AniList provider not configured",
      provider: hasProvider ? "configured" : "missing",
    };
  }

  /**
   * Fetch and map metadata from AniList
   * This is the ONLY method that should be called by the API
   * Returns metadata in the format matching the database schema
   */
  async fetchMetadata(
    title: string,
    year?: number,
    mediaType: string = "MOVIE"
  ): Promise<{
    providerId: number | string;
    title: string;
    overview: string | null;
    releaseDate: string | null;
    rating: number | null;
    posterUrl: string | null;
    nullPosterUrl: string | null;
    backdropUrl: string | null;
    nullBackdropUrl: string | null;
    logoUrl: string | null;
    genres: string[];
  } | null> {
    if (!this.provider) {
      throw new Error("AniList provider not initialized");
    }

    if (!this.provider.isAvailable()) {
      this.getLogger().warn("AniList provider is not available");
      return null;
    }

    // AniList primarily supports anime, but we can map it to MOVIE type
    // For now, treat all requests as anime searches
    // In the future, we could add manga support with mediaType === "TV_SHOW" or similar

    // Fetch metadata from AniList
    const metadata = await this.provider.searchAnime(title, year);

    if (!metadata) {
      return null;
    }

    // Map to database format (matching PluginMetadataResult interface)
    return {
      providerId: metadata.providerId,
      title: metadata.title,
      overview: metadata.overview || null,
      releaseDate: metadata.releaseDate || null,
      rating: metadata.rating || null,
      posterUrl: metadata.posterUrl || null,
      nullPosterUrl: metadata.nullPosterUrl || null,
      backdropUrl: metadata.backdropUrl || null,
      nullBackdropUrl: metadata.nullBackdropUrl || null,
      logoUrl: metadata.logoUrl || null,
      genres: metadata.genres || [],
    };
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return this.provider?.getProviderName() || "anilist";
  }

  /**
   * Get the ExternalIdSource identifier for this plugin
   * Returns the string that maps to the ExternalIdSource enum
   */
  getExternalIdSource(): string {
    return "ANILIST";
  }
}
