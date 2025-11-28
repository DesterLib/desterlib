/**
 * Metadata Provider Plugin System
 *
 * Exports all providers and initializes the registry
 */

export * from "./metadata-provider.types";
export * from "./metadata-provider.registry";

// Export TMDB provider
export { TmdbMetadataProvider } from "./tmdb/tmdb.provider";
export * from "./tmdb/tmdb.services";
export * from "./tmdb/tmdb.types";

// Initialize and register providers
import { metadataProviderRegistry } from "./metadata-provider.registry";
import { TmdbMetadataProvider } from "./tmdb/tmdb.provider";
import { getTmdbApiKey } from "@/core/config/settings";

/**
 * Initialize all metadata providers
 * This should be called during application startup
 */
export async function initializeMetadataProviders(): Promise<void> {
  // Register TMDB provider
  const tmdbProvider = new TmdbMetadataProvider();

  // Try to initialize with API key from settings
  try {
    const apiKey = await getTmdbApiKey();
    if (apiKey) {
      tmdbProvider.initialize({ apiKey });
      metadataProviderRegistry.register(tmdbProvider);
      metadataProviderRegistry.setDefault("tmdb");
    } else {
      // Register anyway, but it won't be configured
      metadataProviderRegistry.register(tmdbProvider);
      metadataProviderRegistry.setDefault("tmdb");
    }
  } catch (error) {
    // Register anyway, configuration can happen later
    metadataProviderRegistry.register(tmdbProvider);
    metadataProviderRegistry.setDefault("tmdb");
  }
}
