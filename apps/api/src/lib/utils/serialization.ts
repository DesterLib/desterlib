/**
 * Serialization utilities for handling special types like BigInt and cleaning URLs
 */

/**
 * Cleans TMDB image URLs that might have repeated prefixes
 */
export function cleanTmdbImageUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  // Check for repeated TMDB prefixes and clean them up
  const tmdbBaseUrl = "https://image.tmdb.org/t/p/original";
  if (url.includes(tmdbBaseUrl)) {
    // Extract the actual path part after the last occurrence of the base URL
    const lastIndex = url.lastIndexOf(tmdbBaseUrl);
    if (lastIndex >= 0) {
      const actualPath = url.substring(lastIndex + tmdbBaseUrl.length);
      return `${tmdbBaseUrl}${actualPath}`;
    }
  }

  return url;
}

/**
 * Recursively converts BigInt values to strings in an object
 * This is necessary because BigInt cannot be directly serialized to JSON
 * @param obj - Object to convert
 * @returns Object with BigInt values converted to strings
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return String(obj) as T;
  }

  // Handle Date objects - keep them as-is (JSON.stringify handles them)
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item)) as T;
  }

  if (typeof obj === "object") {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Clean TMDB image URLs for posterUrl and backdropUrl fields
      if (
        (key === "posterUrl" || key === "backdropUrl" || key === "stillPath") &&
        typeof value === "string"
      ) {
        serialized[key] = cleanTmdbImageUrl(value);
      } else {
        // Recursively process nested objects and arrays (this will also clean URLs in nested objects)
        serialized[key] = serializeBigInt(value);
      }
    }
    return serialized as T;
  }

  return obj;
}
