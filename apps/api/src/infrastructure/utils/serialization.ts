/**
 * Convert local image paths to full URLs using the image API route
 * Converts paths starting with '/metadata/' to /api/v1/image/{path} URLs
 */
function convertImagePathToUrl(
  url: string | null | undefined,
  baseUrl: string
): string | null {
  if (!url) return null;

  // If it's already a full URL, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it's a local metadata path starting with '/metadata/', convert to image API route
  if (url.startsWith("/metadata/")) {
    const cleanBaseUrl = baseUrl.endsWith("/")
      ? baseUrl.substring(0, baseUrl.length - 1)
      : baseUrl;
    // Remove leading /metadata/ and use image API route
    const imagePath = url.replace("/metadata/", "");
    return `${cleanBaseUrl}/api/v1/image/${imagePath}`;
  }

  // If it starts with 'metadata/' (no leading slash), add it
  if (url.startsWith("metadata/")) {
    const cleanBaseUrl = baseUrl.endsWith("/")
      ? baseUrl.substring(0, baseUrl.length - 1)
      : baseUrl;
    return `${cleanBaseUrl}/api/v1/image/${url}`;
  }

  // If it doesn't match either pattern, return as-is
  return url;
}

/**
 * Serialize BigInt values to strings for JSON responses
 * BigInt cannot be serialized to JSON natively
 * Also converts local image paths to full URLs
 */
export function serializeBigInt<T>(obj: T, baseUrl?: string): T {
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
    return obj.map((item) => serializeBigInt(item, baseUrl)) as T;
  }

  if (typeof obj === "object") {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert local image paths to full URLs for image fields
      if (
        (key === "posterUrl" ||
          key === "backdropUrl" ||
          key === "nullPosterUrl" ||
          key === "logoUrl" ||
          key === "stillPath") &&
        typeof value === "string" &&
        baseUrl
      ) {
        serialized[key] = convertImagePathToUrl(value, baseUrl);
      } else if (typeof value === "bigint") {
        serialized[key] = value.toString();
      } else if (typeof value === "object") {
        serialized[key] = serializeBigInt(value, baseUrl);
      } else {
        serialized[key] = value;
      }
    }
    return serialized as T;
  }

  return obj;
}
