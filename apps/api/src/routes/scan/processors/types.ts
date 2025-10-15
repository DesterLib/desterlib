import type {
  PrismaClient,
  MediaType,
} from "../../../generated/prisma/index.js";

export interface ScannedFile {
  path: string;
  name: string;
  size: number;
  extension: string;
  relativePath: string;
}

export interface ParsedMediaInfo {
  title: string;
  [key: string]: any;
}

export interface SaveStats {
  added: number;
  skipped: number;
  updated: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  libraryPath: string | null;
  libraryType: MediaType | null;
  isLibrary: boolean;
}

export interface MediaProcessor {
  /**
   * Parse media information from file path/name
   */
  parseInfo(relativePath: string, fileName: string): ParsedMediaInfo;

  /**
   * Save files to database
   */
  saveToDatabase(
    files: ScannedFile[],
    collection: Collection,
    prisma: PrismaClient,
    options?: { updateExisting?: boolean }
  ): Promise<SaveStats>;

  /**
   * Get file paths for sync checking
   */
  getFilePaths(media: any): string[];
}
