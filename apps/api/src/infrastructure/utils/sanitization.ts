/**
 * Input sanitization utilities for security and data integrity
 */

export interface SanitizeOptions {
  stripHtml?: boolean;
  escapeHtml?: boolean;
  trimWhitespace?: boolean;
  maxLength?: number;
  maxDepth?: number;
}

export function sanitizeString(
  input: string,
  options: SanitizeOptions = {}
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

  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (stripHtml) {
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    sanitized = sanitized.replace(
      /<(iframe|object|embed|form|input|meta|link|style)\b[^>]*>.*?<\/\1>/gi,
      ""
    );
    sanitized = sanitized.replace(/<[^>]*>/g, "");
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

  if (escapeHtml && !stripHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  sanitized = sanitized.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    ""
  );

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

export function sanitizeObject(
  obj: unknown,
  options: SanitizeOptions = {}
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
