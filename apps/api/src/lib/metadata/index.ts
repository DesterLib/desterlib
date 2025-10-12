/**
 * Metadata collection and external API integration
 *
 * This module provides a unified interface for fetching metadata from external sources
 * like TMDB, IMDB, etc. It also handles parsing of external IDs from file paths.
 *
 * Usage:
 * ```typescript
 * import { metadataService, parseExternalIds } from './lib/metadata';
 *
 * // Parse external IDs from filename
 * const ids = parseExternalIds("Movie Name {tmdb-12345} (2023).mkv");
 *
 * // Fetch metadata from TMDB
 * const metadata = await metadataService.getMetadata(
 *   ids[0].id,
 *   ids[0].source,
 *   MediaType.MOVIE
 * );
 * ```
 */

export * from "./types.js";
export * from "./provider.js";
export * from "./metadataService.js";
export * from "./externalIdParser.js";

// Re-export specific providers
export { tmdbProvider } from "./providers/tmdb.js";
