/**
 * Scan types and interfaces
 */

import { ExtractedIds } from "@/lib/utils/external-id.util";

export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

// TMDB API response structure (simplified) - kept for backward compatibility
export interface TmdbMetadata {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  [key: string]: unknown;
}

export interface MediaEntry extends FileEntry {
  extractedIds: ExtractedIds;
  metadata?: TmdbMetadata;
  plainPosterUrl?: string | null;
  logoUrl?: string | null;
}

export interface ScanOptions {
  // Media type configuration
  mediaType?: "movie" | "tv";

  // Depth configuration (per media type)
  mediaTypeDepth?: {
    movie?: number;
    tv?: number;
  };

  // File filtering
  filenamePattern?: string; // Regex pattern

  // Directory filtering
  directoryPattern?: string; // Regex pattern

  // Scan behavior
  rescan?: boolean;

  // Scanning mode
  batchScan?: boolean;

  // Advanced options
  followSymlinks?: boolean;
}

export interface ScanResult {
  libraryId: string;
  libraryName: string;
  totalFiles: number;
  totalSaved: number;
  cacheStats: {
    metadataFromCache: number;
    metadataFromProvider: number;
    totalMetadataFetched: number;
  };
}
