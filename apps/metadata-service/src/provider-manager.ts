import { Logger } from "@dester/logger";
import { Database, MetadataProviderConfig } from "./database";
import { MetadataProvider } from "./providers";
import { TMDBProvider } from "./providers/tmdb.provider";
import { RateLimiter } from "./rate-limiter";

/**
 * Manages metadata providers loaded from the database
 */
export class ProviderManager {
  private database: Database;
  private logger: Logger;
  private rateLimiter: RateLimiter;
  private providers: Map<string, MetadataProvider> = new Map();

  constructor(database: Database, rateLimiter: RateLimiter, logger: Logger) {
    this.database = database;
    this.rateLimiter = rateLimiter;
    this.logger = logger;
  }

  /**
   * Initialize providers from database
   */
  async initialize(): Promise<void> {
    // Ensure providers table exists
    await this.database.initializeProvidersTable();

    // Load enabled providers
    const providerConfigs = await this.database.getEnabledProviders();

    if (providerConfigs.length === 0) {
      this.logger.warn(
        "No enabled metadata providers found in database. Metadata fetching will be disabled."
      );
      return;
    }

    // Initialize each provider
    for (const config of providerConfigs) {
      try {
        const provider = this.createProvider(config);
        if (provider && provider.isAvailable()) {
          this.providers.set(config.name, provider);
          this.logger.info(
            { provider: config.name, priority: config.priority },
            "Metadata provider initialized"
          );
        } else {
          this.logger.warn(
            { provider: config.name },
            "Provider is not available (missing configuration)"
          );
        }
      } catch (error) {
        this.logger.error(
          { error, provider: config.name },
          "Failed to initialize provider"
        );
      }
    }

    if (this.providers.size === 0) {
      this.logger.warn(
        "No available metadata providers. Metadata fetching will be disabled."
      );
    } else {
      this.logger.info(
        { count: this.providers.size },
        "Metadata providers initialized"
      );
    }
  }

  /**
   * Create a provider instance from configuration
   */
  private createProvider(
    config: MetadataProviderConfig
  ): MetadataProvider | null {
    switch (config.name.toLowerCase()) {
      case "tmdb":
        return this.createTMDBProvider(config);
      // Future: Add other providers here
      // case "omdb":
      //   return this.createOMDBProvider(config);
      default:
        this.logger.warn({ provider: config.name }, "Unknown provider type");
        return null;
    }
  }

  /**
   * Create TMDB provider from configuration
   */
  private createTMDBProvider(
    config: MetadataProviderConfig
  ): TMDBProvider | null {
    const apiKey = config.config.apiKey || config.config.api_key;
    const baseUrl =
      config.config.baseUrl ||
      config.config.base_url ||
      "https://api.themoviedb.org/3";

    if (!apiKey) {
      this.logger.warn(
        { provider: config.name },
        "TMDB provider missing API key in configuration"
      );
      return null;
    }

    // Create rate limiter for this provider if needed
    // For now, we use a shared rate limiter
    return new TMDBProvider(apiKey, baseUrl, this.rateLimiter, this.logger);
  }

  /**
   * Get the primary provider (highest priority)
   */
  getPrimaryProvider(): MetadataProvider | null {
    if (this.providers.size === 0) {
      return null;
    }

    // Providers are already sorted by priority in the database query
    // Return the first one (highest priority)
    return Array.from(this.providers.values())[0];
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): MetadataProvider | null {
    return this.providers.get(name.toLowerCase()) || null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): MetadataProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if any providers are available
   */
  hasProviders(): boolean {
    return this.providers.size > 0;
  }
}
