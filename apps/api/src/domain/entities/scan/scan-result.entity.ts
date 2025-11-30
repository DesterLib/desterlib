/**
 * Scan Result Domain Entity
 * Pure domain model - no infrastructure dependencies
 */

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
  logFilePath?: string;
}
