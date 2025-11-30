/**
 * Cleans TMDB image URLs that might have repeated prefixes
 */
function cleanTmdbImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const tmdbBaseUrl = "https://image.tmdb.org/t/p/original";
  if (url.includes(tmdbBaseUrl)) {
    const lastIndex = url.lastIndexOf(tmdbBaseUrl);
    if (lastIndex >= 0) {
      const actualPath = url.substring(lastIndex + tmdbBaseUrl.length);
      return `${tmdbBaseUrl}${actualPath}`;
    }
  }

  return url;
}

/**
 * Serialize BigInt values to strings for JSON responses
 * BigInt cannot be serialized to JSON natively
 * Also cleans TMDB image URLs
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString() as unknown as T;
  }

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
      } else if (typeof value === "bigint") {
        serialized[key] = value.toString();
      } else if (typeof value === "object") {
        serialized[key] = serializeBigInt(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized as T;
  }

  return obj;
}
