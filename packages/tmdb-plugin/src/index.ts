/**
 * TMDB Plugin Entry Point
 * Exports the TMDBPlugin class as the default export
 *
 * Note: The plugin ONLY handles mapping TMDB metadata structure to database format.
 * - No database access
 * - No image processing
 * - No queue management
 * All infrastructure concerns are handled by the API.
 */

export { TMDBPlugin } from "./plugin";
export type { TMDBMetadataResult } from "./plugin";
export { RateLimiter } from "./rate-limiter";
export * from "./providers";

// Default export for plugin loading
export { TMDBPlugin as default } from "./plugin";
