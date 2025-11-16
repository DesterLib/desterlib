/**
 * MIME type utilities for media file handling
 */

/**
 * Map of file extensions to MIME types
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

/**
 * Default MIME type for unknown extensions
 */
const DEFAULT_MIME_TYPE = "application/octet-stream";

/**
 * Get MIME type for a file extension
 * @param extension - File extension (with or without leading dot)
 * @returns MIME type string
 */
export function getMimeType(extension: string): string {
  // Normalize extension to lowercase with leading dot
  const normalizedExt = extension.toLowerCase().startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;

  return MIME_TYPES[normalizedExt] || DEFAULT_MIME_TYPE;
}

/**
 * Get MIME type from filename
 * @param filename - Full filename including extension
 * @returns MIME type string
 */
export function getMimeTypeFromFilename(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) {
    return DEFAULT_MIME_TYPE;
  }

  const lastPart = parts[parts.length - 1];
  if (!lastPart) {
    return DEFAULT_MIME_TYPE;
  }

  const extension = `.${lastPart.toLowerCase()}`;
  return MIME_TYPES[extension] || DEFAULT_MIME_TYPE;
}

/**
 * Check if extension is a video file
 * @param extension - File extension
 * @returns True if video file
 */
export function isVideoFile(extension: string): boolean {
  const mimeType = getMimeType(extension);
  return mimeType.startsWith("video/");
}

/**
 * Check if extension is an audio file
 * @param extension - File extension
 * @returns True if audio file
 */
export function isAudioFile(extension: string): boolean {
  const mimeType = getMimeType(extension);
  return mimeType.startsWith("audio/");
}

/**
 * Check if extension is an image file
 * @param extension - File extension
 * @returns True if image file
 */
export function isImageFile(extension: string): boolean {
  const mimeType = getMimeType(extension);
  return mimeType.startsWith("image/");
}

/**
 * Get category of media file
 * @param extension - File extension
 * @returns Category: 'video', 'audio', 'image', 'document', or 'unknown'
 */
export function getMediaCategory(
  extension: string,
): "video" | "audio" | "image" | "document" | "unknown" {
  const mimeType = getMimeType(extension);

  if (!mimeType) return "unknown";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("application/")) return "document";

  return "unknown";
}

/**
 * Get all supported extensions for a media type
 * @param mediaType - Type of media ('video', 'audio', 'image', 'document')
 * @returns Array of extensions
 */
export function getSupportedExtensions(
  mediaType: "video" | "audio" | "image" | "document" | "all",
): string[] {
  const extensions = Object.keys(MIME_TYPES);

  if (mediaType === "all") {
    return extensions;
  }

  return extensions.filter((ext) => {
    const mime = MIME_TYPES[ext];
    return mime && mime.startsWith(`${mediaType}/`);
  });
}
