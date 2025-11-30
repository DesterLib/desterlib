/**
 * Path Utilities
 * Utility functions for normalizing and standardizing file paths
 */

/**
 * Normalize a file system path
 * - Removes trailing slashes
 * - Normalizes path separators (forward slashes)
 * - Resolves relative paths
 * - Handles both Unix and Windows paths
 */
export function normalizePath(path: string): string {
  if (!path) {
    return path;
  }

  // Normalize path separators to forward slashes (works on both Unix and Windows)
  let normalized = path.replace(/\\/g, "/");

  // Remove trailing slashes (but keep root paths like "/" or "C:/")
  normalized = normalized.replace(/\/+$/, "");

  // Handle Windows drive letters (C:/ should remain C:/)
  if (/^[A-Za-z]:\/$/.test(normalized)) {
    return normalized;
  }

  // Handle root path
  if (normalized === "/") {
    return normalized;
  }

  return normalized;
}

/**
 * Join path segments, normalizing the result
 */
export function joinPaths(...segments: string[]): string {
  const filtered = segments.filter((seg) => seg && seg.trim() !== "");
  if (filtered.length === 0) {
    return "";
  }

  // Normalize each segment
  const normalized = filtered.map(normalizePath);

  // Join with forward slashes and normalize
  return normalizePath(normalized.join("/"));
}
