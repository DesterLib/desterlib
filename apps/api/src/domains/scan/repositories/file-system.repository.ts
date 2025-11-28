/**
 * File System Repository
 *
 * Handles file system scanning operations
 */

import type { MediaEntry } from "../scan.types";
import { collectMediaEntries } from "../helpers/file-scanner.helper";
import type { NormalizedScanConfig } from "../services/scan-config.service";

export interface ScanFileSystemOptions {
  config: NormalizedScanConfig;
}

class FileSystemRepository {
  async scan(
    path: string,
    options: ScanFileSystemOptions
  ): Promise<MediaEntry[]> {
    return collectMediaEntries(path, {
      maxDepth: options.config.maxDepth,
      mediaType: options.config.mediaType,
      fileExtensions: options.config.fileExtensions,
      filenamePattern: options.config.filenamePattern,
      directoryPattern: options.config.directoryPattern,
      followSymlinks: options.config.followSymlinks,
    });
  }
}

export const scanFileSystem = new FileSystemRepository();
