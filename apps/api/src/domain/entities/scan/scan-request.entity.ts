/**
 * Scan Request Entity
 * Domain entity representing a scan request to be sent to the Go scanner service
 */

export interface ScanRequest {
  rootPath: string;
  maxDepth?: number;
  filenamePattern?: string;
  directoryPattern?: string;
  rescan?: boolean;
  followSymlinks?: boolean;
  mediaType?: "movie" | "tv";
}

export interface ScanRequestOptions {
  maxDepth?: number;
  mediaType?: "movie" | "tv";
  mediaTypeDepth?: {
    movie?: number;
    tv?: number;
  };
  filenamePattern?: string;
  directoryPattern?: string;
  rescan?: boolean;
  followSymlinks?: boolean;
  scanJobId?: string; // Database scan job ID for tracking progress
}
