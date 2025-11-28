/**
 * Scan Validation Service
 *
 * Handles all validation logic for scan operations
 */

import { existsSync, statSync } from "fs";
import { ValidationError } from "@/lib/utils";
import { mapHostToContainerPath } from "@/lib/utils";
import {
  isDangerousRootPath,
  isMediaRootPath,
  detectMediaTypeMismatch,
} from "../helpers";
import { logger } from "@/lib/utils";

export interface ValidateScanPathResult {
  mappedPath: string;
  effectiveMediaType: "movie" | "tv";
  warnings: string[];
}

export class ScanValidationService {
  /**
   * Validate and prepare scan path
   */
  async validateScanPath(
    path: string,
    mediaType?: "movie" | "tv"
  ): Promise<ValidateScanPathResult> {
    const warnings: string[] = [];

    // Check if path is dangerous
    if (isDangerousRootPath(path)) {
      throw new ValidationError(
        "Cannot scan system root directories or entire drives. Please specify a media folder (e.g., /Users/username/Movies)"
      );
    }

    // Map host path to container path if running in Docker
    const mappedPath = mapHostToContainerPath(path);

    // Validate path exists and is accessible
    this.validatePathAccess(path, mappedPath);

    // Check for broad media root paths (only for non-TV)
    const effectiveMediaType = mediaType || "movie";
    if (effectiveMediaType !== "tv") {
      await this.validateMediaRootPath(mappedPath, warnings);
    }

    // Detect media type mismatch
    const mismatchDetection = detectMediaTypeMismatch(
      mappedPath,
      effectiveMediaType
    );
    if (mismatchDetection.mismatch && mismatchDetection.warning) {
      warnings.push(mismatchDetection.warning);
      logger.warn(mismatchDetection.warning);
    } else {
      logger.info(
        `✓ Media type validation passed (confidence: ${mismatchDetection.confidence}%)`
      );
    }

    return {
      mappedPath,
      effectiveMediaType,
      warnings,
    };
  }

  /**
   * Validate that path exists and is accessible
   */
  private validatePathAccess(originalPath: string, mappedPath: string): void {
    try {
      if (!existsSync(mappedPath)) {
        throw new ValidationError(
          `Path does not exist or is not accessible: ${originalPath}`
        );
      }

      const stats = statSync(mappedPath);
      if (!stats.isDirectory()) {
        throw new ValidationError(
          `Path must be a directory, not a file: ${originalPath}`
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Cannot access path: ${originalPath}. Please check permissions and path validity.`
      );
    }
  }

  /**
   * Validate media root path (check for multiple collections)
   */
  private async validateMediaRootPath(
    mappedPath: string,
    warnings: string[]
  ): Promise<void> {
    const mediaRootCheck = await isMediaRootPath(mappedPath);
    if (mediaRootCheck.isBroadMediaRoot) {
      logger.warn(`⚠️  Detected broad media root path`);
      logger.warn(
        `   Found collections: ${mediaRootCheck.detectedCollections.join(", ")}`
      );
      logger.warn(`   ${mediaRootCheck.recommendation}`);

      throw new ValidationError(
        mediaRootCheck.recommendation ||
          "This path contains multiple media collections. Please scan specific collections individually for better organization and performance."
      );
    }
  }
}

export const scanValidationService = new ScanValidationService();
