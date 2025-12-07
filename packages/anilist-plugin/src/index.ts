/**
 * AniList Plugin Entry Point
 * Exports the AniListPlugin class as the default export
 *
 * Note: The plugin ONLY handles mapping AniList metadata structure to database format.
 * - No database access
 * - No image processing
 * - No queue management
 * All infrastructure concerns are handled by the API.
 */

export { AniListPlugin } from "./plugin";
export { RateLimiter } from "./rate-limiter";
export * from "./providers";

// Default export for plugin loading
export { AniListPlugin as default } from "./plugin";
