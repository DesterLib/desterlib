import { IPlugin, PluginConfig, PluginStatus } from "@dester/types";
import { Logger } from "@dester/logger";
import { TMDBProvider } from "./providers/tmdb.provider";
import { RateLimiter } from "./rate-limiter";

/**
 * TMDB Plugin
 * ONLY handles mapping TMDB metadata structure to database format
 * No database access, no image processing, no queue management
 */
export interface TMDBMetadataResult {
  tmdbId: number;
  title: string;
  overview: string | null;
  releaseDate: string | null; // ISO date string
  rating: number | null;
  posterUrl: string | null;
  nullPosterUrl: string | null;
  backdropUrl: string | null;
  nullBackdropUrl: string | null;
  logoUrl: string | null;
  genres: string[];
}

export class TMDBPlugin implements IPlugin {
  public readonly name = "tmdb";
  public readonly version = "0.3.0";

  private logger: Logger | null = null;
  private config: PluginConfig | null = null;
  private provider: TMDBProvider | null = null;
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

    // Get provider config from config (passed by API)
    const apiKey = (config.apiKey as string) || (config.config?.apiKey as string);
    const baseUrl =
      (config.baseUrl as string) ||
      (config.config?.baseUrl as string) ||
      "https://api.themoviedb.org/3";
    const rateLimitRps = parseFloat(
      (config.rateLimitRps as string) || (config.config?.rateLimitRps as string) || "4"
    );

    if (!apiKey) {
      throw new Error("TMDB API key is required in plugin config");
    }

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(rateLimitRps, this.getLogger());

    // Initialize TMDB provider directly (no database access needed)
    this.provider = new TMDBProvider(apiKey, baseUrl, this.rateLimiter, this.getLogger());

    this.getLogger().info(
      {
        provider: this.provider.getProviderName(),
        baseUrl,
      },
      "TMDB plugin initialized"
    );
  }

  async start(): Promise<void> {
    this.getLogger().info("TMDB plugin started");
  }

  async stop(): Promise<void> {
    this.getLogger().info("TMDB plugin stopped");
  }

  getStatus(): PluginStatus {
    const hasProvider = this.provider !== null && this.provider.isAvailable();

    let status: PluginStatus["status"] = "initialized";
    if (!hasProvider) {
      status = "error";
    }

    return {
      status,
      message: hasProvider ? "TMDB plugin is operational" : "TMDB provider not configured",
      provider: hasProvider ? "configured" : "missing",
    };
  }

  /**
   * Fetch and map metadata from TMDB
   * This is the ONLY method that should be called by the API
   * Returns metadata in the format matching the database schema
   */
  async fetchMetadata(
    title: string,
    year?: number,
    mediaType: string = "MOVIE"
  ): Promise<TMDBMetadataResult | null> {
    if (!this.provider) {
      throw new Error("TMDB provider not initialized");
    }

    if (!this.provider.isAvailable()) {
      this.getLogger().warn("TMDB provider is not available");
      return null;
    }

    // Support both MOVIE and TV_SHOW
    let metadata: any = null;

    if (mediaType === "MOVIE") {
      metadata = await this.provider.searchMovie(title, year);
    } else if (mediaType === "TV_SHOW") {
      if (!this.provider.searchTVShow) {
        this.getLogger().warn({ mediaType }, "TV show search not supported by provider");
        return null;
      }
      metadata = await this.provider.searchTVShow(title, year);
    } else {
      this.getLogger().warn(
        { mediaType },
        "Media type not supported, only MOVIE and TV_SHOW are supported"
      );
      return null;
    }

    if (!metadata) {
      return null;
    }

    // Map to database format
    return {
      tmdbId: parseInt(metadata.providerId, 10),
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
    return this.provider?.getProviderName() || "tmdb";
  }

  /**
   * Get the ExternalIdSource identifier for this plugin
   * Returns the string that maps to the ExternalIdSource enum
   */
  getExternalIdSource(): string {
    return "TMDB";
  }
}
