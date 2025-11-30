/**
 * MIME type utilities for media file handling
 */

const MIME_TYPES: Record<string, string> = {
  // Video types
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/x-m4v",
  ".webm": "video/webm",
  ".flv": "video/x-flv",
  ".ogv": "video/ogg",

  // Audio types
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wma": "audio/x-ms-wma",
  ".opus": "audio/opus",

  // Image types
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",

  // Document types
  ".pdf": "application/pdf",
  ".epub": "application/epub+zip",
  ".cbz": "application/x-cbz",
  ".cbr": "application/x-cbr",
  ".mobi": "application/x-mobipocket-ebook",
};

const DEFAULT_MIME_TYPE = "application/octet-stream";

/**
 * Get MIME type for a file extension
 */
export function getMimeType(extension: string): string {
  const normalizedExt = extension.toLowerCase().startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;

  return MIME_TYPES[normalizedExt] || DEFAULT_MIME_TYPE;
}
