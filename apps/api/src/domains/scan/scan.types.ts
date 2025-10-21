/**
 * Scan types and interfaces
 */

import { ExtractedIds } from "@/lib/utils/extractExternalId";

export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

// TMDB API response structure (simplified)
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
}
