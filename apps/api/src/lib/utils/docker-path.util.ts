/**
 * Docker path mapping utilities
 * Handles mapping between host paths and container paths
 */

import logger from "./logger";
import { accessSync } from "fs";

// Cache Docker detection result to avoid repeated checks
let isDockerEnvironment: boolean | null = null;

/**
 * Configuration for path mapping
 * Can be customized via environment variables
 */
const PATH_CONFIG = {
  HOST_BASE: process.env.HOST_MEDIA_PATH || "/Volumes/External/Library/Media",
  CONTAINER_BASE: process.env.CONTAINER_MEDIA_PATH || "/media",
  DOCKER_CHECK_PATH: process.env.DOCKER_CHECK_PATH || "/media",
};

/**
 * Check if running in Docker container (cached)
 * @returns True if running in Docker
 */
export function isRunningInDocker(): boolean {
  if (isDockerEnvironment === null) {
    try {
      accessSync(PATH_CONFIG.DOCKER_CHECK_PATH);
      isDockerEnvironment = true;
      logger.info(
        `✅ Running in Docker container, ${PATH_CONFIG.DOCKER_CHECK_PATH} is accessible`,
      );
    } catch {
      isDockerEnvironment = false;
      logger.info(
        `ℹ️ Running locally (not in Docker), using direct file paths`,
      );
    }
  }
  return isDockerEnvironment;
}

/**
 * Maps host paths to container paths for file system access
 * This is used when the API needs to access files in Docker
 *
 * @param hostPath - Original path from the host system
 * @returns Mapped container path if in Docker, otherwise original path
 *
 * @example
 * // In Docker:
 * mapHostToContainerPath("/Volumes/External/Library/Media/Movies/file.mp4")
 * // Returns: "/media/Movies/file.mp4"
 *
 * // Outside Docker:
 * mapHostToContainerPath("/Volumes/External/Library/Media/Movies/file.mp4")
 * // Returns: "/Volumes/External/Library/Media/Movies/file.mp4"
 */
export function mapHostToContainerPath(hostPath: string): string {
  // Running locally, return original path
  if (!isRunningInDocker()) {
    return hostPath;
  }

  // Running in Docker, perform path mapping
  if (hostPath.startsWith(PATH_CONFIG.HOST_BASE)) {
    const relativePath = hostPath.replace(PATH_CONFIG.HOST_BASE, "");
    const containerPath = `${PATH_CONFIG.CONTAINER_BASE}${relativePath}`;
    logger.debug(`Path mapping: ${hostPath} -> ${containerPath}`);
    return containerPath;
  }

  logger.warn(`Path does not start with expected prefix: ${hostPath}`);
  logger.info(`Expected paths to start with: ${PATH_CONFIG.HOST_BASE}`);

  return hostPath;
}

/**
 * Maps container paths back to host paths for database storage
 * This ensures we always store user-friendly host paths in the database
 *
 * @param containerPath - Path from the container
 * @param originalHostPath - Optional original host path for reference
 * @returns Mapped host path
 *
 * @example
 * mapContainerToHostPath("/media/Movies/file.mp4")
 * // Returns: "/Volumes/External/Library/Media/Movies/file.mp4"
 */
export function mapContainerToHostPath(
  containerPath: string,
  originalHostPath?: string,
): string {
  // If we have the original host path and container path starts with container base
  if (
    originalHostPath &&
    containerPath.startsWith(PATH_CONFIG.CONTAINER_BASE)
  ) {
    if (originalHostPath.startsWith(PATH_CONFIG.HOST_BASE)) {
      // Extract the relative path from the container path
      const relativePath = containerPath.replace(
        PATH_CONFIG.CONTAINER_BASE,
        "",
      );
      return `${PATH_CONFIG.HOST_BASE}${relativePath}`;
    }
  }

  // If container path starts with container base, map it
  if (containerPath.startsWith(PATH_CONFIG.CONTAINER_BASE)) {
    const relativePath = containerPath.replace(PATH_CONFIG.CONTAINER_BASE, "");
    return `${PATH_CONFIG.HOST_BASE}${relativePath}`;
  }

  // Otherwise, return as-is
  return containerPath;
}
