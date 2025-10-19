/**
 * Input sanitization utilities for security and data integrity
 */

/**
 * Sanitizes a string by removing or escaping potentially dangerous characters
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    stripHtml?: boolean;
    escapeHtml?: boolean;
    trimWhitespace?: boolean;
    maxLength?: number;
  } = {}
): string {
  const {
    stripHtml = true,
    escapeHtml = false,
    trimWhitespace = true,
    maxLength = 1000,
  } = options;

  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Strip HTML tags and script content
  if (stripHtml) {
    // Remove script tags and their content
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );

    // Remove other potentially dangerous HTML tags
    sanitized = sanitized.replace(
      /<(iframe|object|embed|form|input|meta|link|style)\b[^>]*>.*?<\/\1>/gi,
      ""
    );

    // Remove remaining HTML tags but keep content
    sanitized = sanitized.replace(/<[^>]*>/g, "");

    // Decode HTML entities
    sanitized = sanitized
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#x60;/g, "`")
      .replace(/&#x3D;/g, "=");
  }

  // Escape HTML characters if requested instead of stripping
  if (escapeHtml && !stripHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  // Remove null bytes and control characters (except newlines and tabs)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    ""
  );

  // Limit length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Recursively sanitizes an object's string properties
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject(
  obj: unknown,
  options: {
    stripHtml?: boolean;
    escapeHtml?: boolean;
    trimWhitespace?: boolean;
    maxLength?: number;
    maxDepth?: number;
  } = {}
): unknown {
  const { maxDepth = 10 } = options;

  if (maxDepth <= 0) {
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      sanitizeObject(item, { ...options, maxDepth: maxDepth - 1 })
    );
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys too (basic protection against prototype pollution)
      const sanitizedKey = sanitizeString(key, {
        stripHtml: true,
        trimWhitespace: true,
        maxLength: 100,
      });

      if (sanitizedKey && !sanitizedKey.startsWith("__")) {
        sanitized[sanitizedKey] = sanitizeObject(value, {
          ...options,
          maxDepth: maxDepth - 1,
        });
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validates and sanitizes file paths to prevent directory traversal
 * @param path - File path to sanitize
 * @returns Sanitized path or null if invalid
 */
export function sanitizeFilePath(path: string): string | null {
  if (typeof path !== "string") {
    return null;
  }

  const sanitized = sanitizeString(path, {
    stripHtml: true,
    trimWhitespace: true,
    maxLength: 5000,
  });

  if (!sanitized) {
    return null;
  }

  // Remove directory traversal attempts
  const cleanedPath = sanitized
    .replace(/\.\./g, "") // Remove ..
    .replace(/\/+/g, "/") // Replace multiple slashes with single
    .replace(/^\/+/, "") // Remove leading slashes
    .trim();

  // Check for dangerous patterns
  if (
    cleanedPath.includes("..") ||
    cleanedPath.includes("<") ||
    cleanedPath.includes(">") ||
    cleanedPath.includes('"') ||
    cleanedPath.includes("'") ||
    cleanedPath.includes("\\") ||
    cleanedPath.includes("\0")
  ) {
    return null;
  }

  return cleanedPath;
}
