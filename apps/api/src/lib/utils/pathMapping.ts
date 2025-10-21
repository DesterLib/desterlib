import logger from "./logger";
import { accessSync } from "fs";

/**
 * Centralized Docker path mapping utility
 * Handles mapping between host paths and container paths automatically
 */

/**
 * Maps host paths to container paths for file system access
 * This is used when the API needs to access files in Docker
 */
export function mapHostToContainerPath(hostPath: string): string {
  try {
    // Check if we're running in Docker by looking for the mounted path
    accessSync("/media");
    logger.info(`✅ Running in Docker container, /media is accessible`);

    // Simple mapping based on known Docker mount: /Volumes/External/Library/Media:/media:ro
    if (hostPath.startsWith("/Volumes/External/Library/Media")) {
      const relativePath = hostPath.replace(
        "/Volumes/External/Library/Media",
        ""
      );
      const containerPath = `/media${relativePath}`;
      logger.info(`Path mapping: ${hostPath} -> ${containerPath}`);
      return containerPath;
    } else {
      logger.warn(`Path does not start with expected prefix: ${hostPath}`);
      logger.info(
        `Expected paths to start with: /Volumes/External/Library/Media`
      );
    }
  } catch (error) {
    // Not in container or /media doesn't exist, return original path
    logger.warn(`Not in container or /media not accessible: ${error}`);
    logger.info(`Using original path: ${hostPath}`);
  }

  return hostPath;
}

/**
 * Maps container paths back to host paths for database storage
 * This ensures we always store user-friendly host paths in the database
 */
export function mapContainerToHostPath(
  containerPath: string,
  originalHostPath?: string
): string {
  // If we have the original host path and container path starts with /media
  if (originalHostPath && containerPath.startsWith("/media")) {
    if (originalHostPath.startsWith("/Volumes/External/Library/Media")) {
      // Extract the relative path from the container path (remove /media prefix)
      const relativePath = containerPath.replace("/media", "");
      // Replace the original host path's suffix with the relative path
      // originalHostPath might be something like /Volumes/External/Library/Media/Movies/Anime
      // We want to replace the part after /Volumes/External/Library/Media with the relative path
      const baseHostPath = "/Volumes/External/Library/Media";
      return `${baseHostPath}${relativePath}`;
    }
  }

  // If no original path or not a container path, return as-is
  return containerPath;
}

/**
 * Normalizes a path for consistent storage in database
 * Always returns the host path format that users expect to see
 */
export function normalizePathForStorage(
  path: string,
  originalHostBase?: string
): string {
  // If we have an original host base and the path looks like a container path, map it back
  if (originalHostBase && path.startsWith("/media")) {
    return mapContainerToHostPath(path, originalHostBase);
  }

  // Otherwise, return the path as-is (should be a host path already)
  return path;
}
