import type { IPlugin } from "@dester/types";

/**
 * Extended plugin interface for plugins that support reloading providers
 */
export interface IPluginWithReloadProviders extends IPlugin {
  reloadProviders(): Promise<void>;
}

/**
 * Generic metadata result structure
 * This is the standard format that all metadata plugins should return
 * Plugins are responsible for mapping their provider-specific format to this structure
 */
export interface PluginMetadataResult {
  providerId: number | string; // Provider-specific ID (e.g., tmdbId, imdbId)
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

/**
 * Extended plugin interface for plugins that support fetching metadata
 */
export interface IPluginWithFetchMetadata extends IPlugin {
  fetchMetadata(
    title: string,
    year?: number,
    mediaType?: string
  ): Promise<PluginMetadataResult | null>;

  /**
   * Get the ExternalIdSource identifier for this plugin
   * Returns a string that maps to the ExternalIdSource enum (e.g., "TMDB", "MYANIMELIST")
   * This allows plugins to declare their own source type without the API needing to know all providers
   */
  getExternalIdSource?(): string;
}

/**
 * Type guard to check if a plugin supports reloadProviders
 */
export function hasReloadProviders(
  plugin: IPlugin | null
): plugin is IPluginWithReloadProviders {
  return (
    plugin !== null &&
    typeof (plugin as IPluginWithReloadProviders).reloadProviders === "function"
  );
}

/**
 * Type guard to check if a plugin supports fetchMetadata
 */
export function hasFetchMetadata(
  plugin: IPlugin | null
): plugin is IPluginWithFetchMetadata {
  return (
    plugin !== null &&
    typeof (plugin as IPluginWithFetchMetadata).fetchMetadata === "function"
  );
}
