/**
 * Path validation utilities for media scanning
 * Validates directory depth and structure based on media type
 */

import { logger } from "@/lib/utils";
import { relative } from "path";
import { getDefaultVideoExtensions } from "./file-filter.helper";

export interface PathValidationOptions {
  mediaType: "movie" | "tv";
  rootPath: string;
  currentPath: string;
  depth: number;
}

/**
 * Media type depth constraints
 */
const DEPTH_CONSTRAINTS = {
  movie: {
    max: 2,
    description: "Movies should be at most 2 levels deep (e.g., /movies/Avengers.mkv or /movies/Avengers/Avengers.mkv)",
  },
  tv: {
    max: 4,
    description: "TV shows should be at most 4 levels deep (e.g., /tvshows/ShowName/Season 1/S1E1.mkv)",
  },
} as const;

/**
 * Dangerous root paths that should never be scanned entirely
 */
const DANGEROUS_ROOT_PATHS = [
  "/",
  "/home",
  "/usr",
  "/var",
  "/etc",
  "/System",
  "/Library",
  "/Applications",
  "/Users",
  "/Windows",
  "/Program Files",
  "/Program Files (x86)",
  "C:\\",
  "D:\\",
  "E:\\",
  "F:\\",
] as const;

/**
 * Check if a path is a dangerous root path
 */
export function isDangerousRootPath(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/").toLowerCase();
  
  return DANGEROUS_ROOT_PATHS.some((dangerousPath) => {
    const normalizedDangerous = dangerousPath.toLowerCase();
    
    // Exact match or root drive match
    return (
      normalizedPath === normalizedDangerous ||
      normalizedPath === normalizedDangerous + "/" ||
      // Drive root (e.g., "C:", "D:")
      (normalizedPath.length === 2 && normalizedPath.endsWith(":"))
    );
  });
}

/**
 * Check if a directory contains media files (videos)
 * Scans up to 2 levels deep to detect media content
 * 
 * @param dirPath - Directory path to check
 * @param currentDepth - Current recursion depth
 * @param maxDepth - Maximum depth to scan (default: 2)
 * @returns True if media files found
 */
async function containsMediaFiles(
  dirPath: string,
  currentDepth: number = 0,
  maxDepth: number = 2
): Promise<boolean> {
  if (currentDepth > maxDepth) return false;

  try {
    const { readdir } = await import("fs/promises");
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    // Get video extensions from the centralized source
    const videoExtensions = getDefaultVideoExtensions();

    // Check files at current level
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        const nameLower = entry.name.toLowerCase();
        if (videoExtensions.some((ext) => nameLower.endsWith(ext.toLowerCase()))) {
          return true;
        }
      }
    }

    // If no files found at current level, check subdirectories
    if (currentDepth < maxDepth) {
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const { join } = await import("path");
          const subDirPath = join(dirPath, entry.name);
          
          // Check if this subdirectory contains media
          const hasMedia = await containsMediaFiles(subDirPath, currentDepth + 1, maxDepth);
          if (hasMedia) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    // If we can't read the directory, assume no media
    return false;
  }
}

/**
 * Check if a path contains multiple media collection folders
 * This indicates it's a media root that should not be scanned directly
 * 
 * Strategy: Only check shallow paths (≤ 4 levels deep). If the user is scanning
 * a deeply nested path, we assume they know what they're doing.
 * 
 * For shallow paths, if we find multiple subdirectories with media (3+), we suggest
 * scanning more specifically. This catches cases like:
 * - /Puff with Movies/, Shows/, Anime/ (broad media root)
 * - /Media with Movies/, TV/, Music/ (multiple collections)
 * 
 * But allows:
 * - /Users/alken/Mounts/Puff/Movies (deep path = specific intent)
 * - /Movies with Action/, Comedy/ (only 2 subdirectories)
 * 
 * @param path - Path to check
 * @returns Object with validation result and detected collections
 */
export async function isMediaRootPath(path: string): Promise<{
  isBroadMediaRoot: boolean;
  detectedCollections: string[];
  recommendation?: string;
}> {
  try {
    const { readdir } = await import("fs/promises");
    const { join } = await import("path");
    
    // Calculate path depth (number of directories from root)
    const pathDepth = path.split("/").filter(Boolean).length;
    
    // If path is deep (> 4 levels), assume user knows what they want
    // Example: /Users/alken/Mounts/Puff/Movies is 5 levels deep
    if (pathDepth > 4) {
      return {
        isBroadMediaRoot: false,
        detectedCollections: [],
      };
    }
    
    // For shallow paths, check if it has many media subdirectories
    const entries = await readdir(path, { withFileTypes: true });
    const detectedCollections: string[] = [];
    const checkPromises: Promise<{ name: string; hasMedia: boolean }>[] = [];

    // Check each immediate subdirectory for media content
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = join(path, entry.name);
        
        // Check if this directory contains media files (up to 2 levels deep)
        const checkPromise = containsMediaFiles(dirPath, 0, 2).then((hasMedia) => ({
          name: entry.name,
          hasMedia,
        }));
        
        checkPromises.push(checkPromise);
      }
    }

    // Wait for all checks to complete
    const results = await Promise.all(checkPromises);

    // Collect directories that contain media
    for (const result of results) {
      if (result.hasMedia) {
        detectedCollections.push(result.name);
      }
    }

    // Only flag as broad root if we found multiple (3+) subdirectories with media
    // This catches cases like /Puff with Movies/, Shows/, Anime/, Documentary/, etc.
    const isBroadMediaRoot = detectedCollections.length >= 3;

    if (isBroadMediaRoot) {
      return {
        isBroadMediaRoot: true,
        detectedCollections,
        recommendation: `This path contains ${detectedCollections.length} separate media folders (${detectedCollections.slice(0, 3).join(", ")}${detectedCollections.length > 3 ? ", ..." : ""}). Consider scanning specific collections individually for better organization, e.g., "${path}/${detectedCollections[0]}"`,
      };
    }

    return {
      isBroadMediaRoot: false,
      detectedCollections,
    };
  } catch (error) {
    // If we can't read the directory, don't block the scan
    // Let the regular validation handle it
    return {
      isBroadMediaRoot: false,
      detectedCollections: [],
    };
  }
}

/**
 * Get recommended max depth for media type
 */
export function getRecommendedMaxDepth(mediaType: "movie" | "tv"): number {
  return DEPTH_CONSTRAINTS[mediaType].max;
}

/**
 * Validate if current depth is acceptable for media type
 */
export function isDepthValid(
  depth: number,
  mediaType: "movie" | "tv",
  maxDepth?: number
): boolean {
  const effectiveMaxDepth = maxDepth ?? DEPTH_CONSTRAINTS[mediaType].max;
  return depth <= effectiveMaxDepth;
}

/**
 * Validate movie path structure
 * Valid patterns:
 * - /movies/Avengers.mkv (depth 1)
 * - /movies/Avengers/Avengers.mkv (depth 2)
 * 
 * Invalid:
 * - /movies/some/deep/nested/path/movie.mkv (depth > 2)
 */
export function validateMoviePath(
  rootPath: string,
  filePath: string
): { valid: boolean; reason?: string; relativeDepth: number } {
  const relativePath = relative(rootPath, filePath);
  const pathParts = relativePath.split("/").filter(Boolean);
  const relativeDepth = pathParts.length - 1; // Subtract 1 because the file itself doesn't count as depth
  
  const maxDepth = DEPTH_CONSTRAINTS.movie.max;
  
  if (relativeDepth > maxDepth) {
    return {
      valid: false,
      reason: `Movie file is too deeply nested (depth: ${relativeDepth}, max: ${maxDepth}). ${DEPTH_CONSTRAINTS.movie.description}`,
      relativeDepth,
    };
  }
  
  return { valid: true, relativeDepth };
}

/**
 * Validate TV show path structure
 * Valid patterns:
 * - /tvshows/Gravity Falls/S1E1.mkv (depth 2)
 * - /tvshows/Gravity Falls/Season 1/S1E1.mkv (depth 3)
 * 
 * Invalid:
 * - /tvshows/some/deep/nested/path/episode.mkv (depth > 3)
 * - Files without proper parent show folder
 */
export function validateTvShowPath(
  rootPath: string,
  filePath: string,
  extractedIds: {
    season?: number;
    episode?: number;
    title?: string;
  }
): {
  valid: boolean;
  reason?: string;
  relativeDepth: number;
  showFolder?: string;
} {
  const relativePath = relative(rootPath, filePath);
  const pathParts = relativePath.split("/").filter(Boolean);
  const relativeDepth = pathParts.length - 1; // Subtract 1 for the file itself
  
  const maxDepth = DEPTH_CONSTRAINTS.tv.max;
  
  // Check depth constraint
  if (relativeDepth > maxDepth) {
    return {
      valid: false,
      reason: `TV show file is too deeply nested (depth: ${relativeDepth}, max: ${maxDepth}). ${DEPTH_CONSTRAINTS.tv.description}`,
      relativeDepth,
    };
  }
  
  // For TV shows, we expect at least one parent folder (the show name)
  if (relativeDepth < 1) {
    return {
      valid: false,
      reason: "TV show files must be inside a show folder (e.g., /tvshows/ShowName/S1E1.mkv)",
      relativeDepth,
    };
  }
  
  // Check if file has episode information
  const hasEpisodeInfo = !!(extractedIds.season && extractedIds.episode);
  
  if (!hasEpisodeInfo) {
    return {
      valid: false,
      reason: "File does not contain valid season/episode information (e.g., S1E1)",
      relativeDepth,
    };
  }
  
  // The show folder is typically:
  // - Parent folder if structure is /tvshows/ShowName/S1E1.mkv (depth 2)
  // - Grandparent folder if structure is /tvshows/ShowName/Season 1/S1E1.mkv (depth 3)
  const showFolderIndex = relativeDepth >= 2 ? pathParts.length - 3 : pathParts.length - 2;
  const showFolder = pathParts[showFolderIndex] || pathParts[0];
  
  return {
    valid: true,
    relativeDepth,
    showFolder,
  };
}

/**
 * Validate path based on media type
 */
export function validateMediaPath(
  rootPath: string,
  filePath: string,
  mediaType: "movie" | "tv",
  extractedIds?: {
    season?: number;
    episode?: number;
    title?: string;
  }
): { valid: boolean; reason?: string; metadata?: any } {
  if (mediaType === "movie") {
    return validateMoviePath(rootPath, filePath);
  } else {
    return validateTvShowPath(rootPath, filePath, extractedIds || {});
  }
}

/**
 * Log validation statistics
 */
export function logValidationStats(stats: {
  total: number;
  valid: number;
  depthViolations: number;
  structureViolations: number;
}): void {
  logger.info("\n📊 Path Validation Statistics:");
  logger.info(`   Total files scanned: ${stats.total}`);
  logger.info(`   Valid files: ${stats.valid}`);
  
  if (stats.depthViolations > 0) {
    logger.warn(`   ⚠️  Depth violations (skipped): ${stats.depthViolations}`);
  }
  
  if (stats.structureViolations > 0) {
    logger.warn(`   ⚠️  Structure violations (skipped): ${stats.structureViolations}`);
  }
  
  const skipped = stats.depthViolations + stats.structureViolations;
  if (skipped > 0) {
    logger.info(
      `   Hint: Ensure your media follows the recommended structure. Enable debug logging for details.`
    );
  }
}

