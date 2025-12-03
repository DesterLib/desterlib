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

  // Pattern configuration (per media type)
  // Movies and TV shows have different naming conventions
  mediaTypePatterns?: {
    movie?: {
      filenamePattern?: string; // e.g., ".*\.(mkv|mp4)$"
      directoryPattern?: string; // e.g., "^[^\\/]+(?:\\s*\\(\\d{4}\\))?$"
    };
    tv?: {
      filenamePattern?: string; // e.g., ".*[Ss]\\d{2}[Ee]\\d{2}.*\\.(mkv|mp4)$"
      directoryPattern?: string; // e.g., "^[^\\/]+(?:/Season \\d+)?$"
    };
  };

  // Legacy global patterns (deprecated, kept for backwards compatibility)
  filenamePattern?: string;
  directoryPattern?: string;

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
