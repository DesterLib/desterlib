/**
 * Scan Configuration Service
 *
 * Handles scan configuration normalization and validation
 */

import { getDefaultVideoExtensions } from "../helpers";
import type { ScanOptions } from "../scan.types";
import { logger } from "@/lib/utils";

export interface NormalizedScanConfig {
  mediaType: "movie" | "tv";
  maxDepth: number;
  fileExtensions: string[];
  filenamePattern?: RegExp;
  directoryPattern?: RegExp;
  followSymlinks: boolean;
}

export class ScanConfigService {
  /**
   * Normalize and validate scan options
   * Uses DB settings as defaults, overridden by request options
   */
  normalizeConfig(options?: ScanOptions): NormalizedScanConfig {
    const mediaType = options?.mediaType || "movie";

    // Determine max depth from mediaTypeDepth
    // Priority: request options > DB settings > default
    let maxDepth: number;
    if (options?.mediaTypeDepth?.[mediaType] !== undefined) {
      maxDepth = options.mediaTypeDepth[mediaType]!;
    } else {
      // Default depths based on media type (fallback if not in DB settings)
      maxDepth = mediaType === "tv" ? 4 : 2;
    }

    // File extensions - always use defaults (not configurable in Flutter)
    const fileExtensions = getDefaultVideoExtensions();

    // Compile regex patterns
    let filenamePattern: RegExp | undefined;
    let directoryPattern: RegExp | undefined;

    try {
      if (options?.filenamePattern) {
        filenamePattern = new RegExp(options.filenamePattern);
      }
      if (options?.directoryPattern) {
        directoryPattern = new RegExp(options.directoryPattern, "i"); // Case-insensitive
      }
    } catch (error) {
      logger.warn(
        `Invalid regex pattern in scan options: ${error instanceof Error ? error.message : error}`
      );
    }

    // Symlink following - default to true if not specified
    const followSymlinks = options?.followSymlinks ?? true;

    logger.debug(
      `Scan config normalized: mediaType=${mediaType}, maxDepth=${maxDepth}, patterns=${!!filenamePattern || !!directoryPattern}`
    );

    return {
      mediaType,
      maxDepth,
      fileExtensions,
      filenamePattern,
      directoryPattern,
      followSymlinks,
    };
  }

  /**
   * Check if a filename matches the configured patterns
   */
  shouldIncludeFile(filename: string, config: NormalizedScanConfig): boolean {
    // Check filename pattern
    if (config.filenamePattern) {
      if (!config.filenamePattern.test(filename)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a directory should be included
   */
  shouldIncludeDirectory(
    dirName: string,
    config: NormalizedScanConfig
  ): boolean {
    // Check directory pattern
    if (config.directoryPattern) {
      if (!config.directoryPattern.test(dirName)) {
        return false;
      }
    }

    return true;
  }
}

export const scanConfigService = new ScanConfigService();
