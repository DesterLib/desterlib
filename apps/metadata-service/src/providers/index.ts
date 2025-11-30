/**
 * Metadata Providers
 *
 * This module exports all available metadata providers.
 * Providers implement the MetadataProvider interface to provide
 * a standardized way to fetch movie metadata from various sources.
 *
 * Currently supported providers:
 * - TMDB (The Movie Database)
 *
 * To add a new provider:
 * 1. Create a new provider class implementing MetadataProvider interface
 * 2. Export it from this file
 * 3. Add initialization logic in src/index.ts
 */

export { MetadataProvider, MovieMetadata } from "./metadata-provider.interface";
export { TMDBProvider } from "./tmdb.provider";
