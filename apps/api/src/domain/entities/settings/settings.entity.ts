/**
 * Settings Domain Entity
 */

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

  // Advanced options
  followSymlinks?: boolean;
}

export interface UserSettings {
  tmdbApiKey?: string;
  port: number;
  jwtSecret: string;
  enableRouteGuards: boolean;
  firstRun: boolean;
  scanSettings?: ScanOptions;
}

export interface PublicSettings {
  tmdbApiKey?: string;
  port: number;
  enableRouteGuards: boolean;
  firstRun: boolean;
  scanSettings?: ScanOptions;
}
