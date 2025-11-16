/**
 * TMDB Image URL utilities
 * Handles TMDB image path construction and normalization
 */

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

/**
 * Constructs a proper TMDB image URL from a path
 * Handles cases where the path might already be a full URL or be malformed with repeated prefixes
 *
 * @param path - TMDB image path (can be partial path, full URL, or null)
 * @returns Full TMDB image URL or null
 */
export function getTmdbImageUrl(
  path: string | null | undefined,
): string | null {
  if (!path) return null;

  // If it's already a full URL, check if it's malformed with repeated prefixes
  if (path.startsWith("http")) {
    // Check for repeated TMDB prefixes and clean them up
    if (path.includes(TMDB_IMAGE_BASE_URL)) {
      // Extract the actual path part after the last occurrence of the base URL
      const lastIndex = path.lastIndexOf(TMDB_IMAGE_BASE_URL);
      if (lastIndex >= 0) {
        const actualPath = path.substring(
          lastIndex + TMDB_IMAGE_BASE_URL.length,
        );
        return `${TMDB_IMAGE_BASE_URL}${actualPath}`;
      }
    }
    // If it's a valid URL without issues, return as-is
    return path;
  }

  // Ensure path starts with / if it doesn't
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}${cleanPath}`;
}

/**
 * Extracts just the path from a TMDB URL or returns the original path
 * Useful for storing paths in database without the full URL
 *
 * @param fullUrlOrPath - Full TMDB URL or partial path
 * @returns Extracted path or null
 */
export function extractTmdbPath(
  fullUrlOrPath: string | null | undefined,
): string | null {
  if (!fullUrlOrPath) return null;

  // If it's a full TMDB URL, extract just the path part
  if (fullUrlOrPath.includes("image.tmdb.org/t/p/original")) {
    return fullUrlOrPath.split("image.tmdb.org/t/p/original")[1] || null;
  }

  // Otherwise return as-is (should be just a path)
  return fullUrlOrPath.startsWith("/") ? fullUrlOrPath : `/${fullUrlOrPath}`;
}
