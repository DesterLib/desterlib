/**
 * Docker path mapping utilities
 * Handles mapping between host paths and container paths
 */

import { logger } from "@dester/logger";
import { accessSync, promises as fs } from "fs";

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
 * Internal function - only used within this module
 */
function isRunningInDocker(): boolean {
  if (isDockerEnvironment === null) {
    try {
      accessSync(PATH_CONFIG.DOCKER_CHECK_PATH);
      isDockerEnvironment = true;
      logger.info(
        `✅ Running in Docker container, ${PATH_CONFIG.DOCKER_CHECK_PATH} is accessible`
      );
    } catch {
      isDockerEnvironment = false;
      logger.info(
        `ℹ️ Running locally (not in Docker), using direct file paths`
      );
    }
  }
  return isDockerEnvironment;
}

/**
 * Maps host paths to container paths for file system access
 */
export function mapHostToContainerPath(hostPath: string): string {
  if (!isRunningInDocker()) {
    return hostPath;
  }

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
 * Check if Docker mount point is accessible
 * Useful for debugging Docker volume mount issues
 */
export async function checkMountPointAccessibility(
  mountPath: string = PATH_CONFIG.CONTAINER_BASE
): Promise<{ accessible: boolean; error?: Error }> {
  try {
    await fs.access(mountPath);
    logger.info(`✅ ${mountPath} mount point exists`);
    return { accessible: true };
  } catch (error) {
    logger.error(`❌ ${mountPath} mount point not accessible`, error);
    return {
      accessible: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
