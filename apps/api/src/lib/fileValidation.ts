/**
 * File Validation and Sanitization Utilities
 *
 * Provides security checks for file operations including:
 * - Path traversal prevention
 * - File type validation
 * - File size limits
 * - Magic number/MIME type verification
 * - Malicious file detection
 */

import { promises as fs } from "fs";
import path from "path";
import { fileTypeFromFile } from "file-type";
import mime from "mime-types";
import { BadRequestError } from "./errors.js";
import logger from "../config/logger.js";

const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB for video files
const MAX_PATH_LENGTH = 4096;

// Dangerous file extensions that should never be allowed
const BLOCKED_EXTENSIONS = [
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".sh",
  ".bash",
  ".zsh",
  ".app",
  ".deb",
  ".rpm",
  ".dmg",
  ".pkg",
];

// Media file extensions allowed by media type
export const ALLOWED_EXTENSIONS = {
  video: [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
    ".mpg",
    ".mpeg",
    ".m2ts",
    ".ts",
  ],
  audio: [".mp3", ".flac", ".wav", ".aac", ".ogg", ".m4a", ".wma", ".opus"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico"],
  document: [".pdf", ".epub", ".mobi", ".cbr", ".cbz", ".cb7", ".cbt"],
} as const;

export type MediaCategory = keyof typeof ALLOWED_EXTENSIONS;

export interface FileValidationOptions {
  /**
   * Media category to validate against
   */
  category?: MediaCategory;

  /**
   * Maximum file size in bytes
   */
  maxSize?: number;

  /**
   * Whether to verify actual file type using magic numbers
   */
  verifyMimeType?: boolean;

  /**
   * Whether to check if file is a symlink
   */
  rejectSymlinks?: boolean;

  /**
   * Custom allowed extensions (overrides category-based extensions)
   */
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  path: string;
  extension: string;
  size: number;
  mimeType?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Sanitize and normalize a file path
 * Prevents path traversal attacks
 */
export function sanitizePath(filePath: string): string {
  // Remove null bytes
  let cleaned = filePath.replace(/\0/g, "");

  // Normalize path (resolves .., ., //)
  cleaned = path.normalize(cleaned);

  // Remove leading path separators to prevent absolute paths
  cleaned = cleaned.replace(/^[/\\]+/, "");

  return cleaned;
}

/**
 * Check if a path is attempting path traversal
 */
export function isPathTraversal(filePath: string, basePath: string): boolean {
  const normalized = path.resolve(basePath, filePath);
  const baseResolved = path.resolve(basePath);

  // Check if the resolved path is within the base path
  return !normalized.startsWith(baseResolved);
}

/**
 * Validate a file path is safe
 */
export function validatePath(filePath: string): void {
  if (!filePath || typeof filePath !== "string") {
    throw new BadRequestError("Invalid file path");
  }

  // Check path length
  if (filePath.length > MAX_PATH_LENGTH) {
    throw new BadRequestError(
      `Path too long (max ${MAX_PATH_LENGTH} characters)`
    );
  }

  // Check for null bytes
  if (filePath.includes("\0")) {
    throw new BadRequestError("Path contains null bytes");
  }

  // Check for path traversal attempts
  const suspicious = ["../", "..\\", "%2e%2e", "..%2f", "..%5c"];
  for (const pattern of suspicious) {
    if (filePath.toLowerCase().includes(pattern)) {
      throw new BadRequestError("Path traversal attempt detected");
    }
  }
}

/**
 * Validate file extension
 */
export function validateExtension(
  filePath: string,
  allowedExtensions?: readonly string[]
): { valid: boolean; extension: string; error?: string } {
  const ext = path.extname(filePath).toLowerCase();

  // Check for blocked extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      extension: ext,
      error: `Blocked file type: ${ext}`,
    };
  }

  // Check against allowed extensions if provided
  if (allowedExtensions && allowedExtensions.length > 0) {
    const allowed = allowedExtensions.map((e) => e.toLowerCase());
    if (!allowed.includes(ext)) {
      return {
        valid: false,
        extension: ext,
        error: `File type ${ext} not allowed. Allowed types: ${allowed.join(", ")}`,
      };
    }
  }

  return { valid: true, extension: ext };
}

/**
 * Get allowed extensions for a media category
 */
export function getAllowedExtensionsForCategory(
  category: MediaCategory
): readonly string[] {
  return ALLOWED_EXTENSIONS[category] || [];
}

/**
 * Validate file size
 */
export async function validateFileSize(
  filePath: string,
  maxSize: number = MAX_FILE_SIZE
): Promise<{ valid: boolean; size: number; error?: string }> {
  try {
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      return { valid: false, size: 0, error: "Path is not a file" };
    }

    if (stats.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const actualSizeMB = Math.round(stats.size / (1024 * 1024));
      return {
        valid: false,
        size: stats.size,
        error: `File too large: ${actualSizeMB}MB (max: ${maxSizeMB}MB)`,
      };
    }

    return { valid: true, size: stats.size };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: `Cannot access file: ${(error as Error).message}`,
    };
  }
}

/**
 * Verify file MIME type using magic numbers
 */
export async function verifyMimeType(
  filePath: string,
  expectedCategory?: MediaCategory
): Promise<{ valid: boolean; mimeType?: string; warning?: string }> {
  try {
    const fileType = await fileTypeFromFile(filePath);

    if (!fileType) {
      // File type couldn't be detected (might be text file or unknown format)
      const extMime = mime.lookup(filePath);
      return {
        valid: true,
        mimeType: extMime || "application/octet-stream",
        warning: "Could not detect file type from magic numbers",
      };
    }

    // Check if MIME type matches expected category
    if (expectedCategory) {
      const categoryMimes: Record<MediaCategory, string[]> = {
        video: ["video/"],
        audio: ["audio/"],
        image: ["image/"],
        document: ["application/pdf", "application/epub", "application/x-"],
      };

      const expectedPrefixes = categoryMimes[expectedCategory];
      const matches = expectedPrefixes.some((prefix) =>
        fileType.mime.startsWith(prefix)
      );

      if (!matches) {
        return {
          valid: false,
          mimeType: fileType.mime,
          warning: `File MIME type ${fileType.mime} doesn't match expected category ${expectedCategory}`,
        };
      }
    }

    return { valid: true, mimeType: fileType.mime };
  } catch (error) {
    logger.error(`Error verifying MIME type for ${filePath}:`, error);
    return {
      valid: true,
      warning: `Could not verify MIME type: ${(error as Error).message}`,
    };
  }
}

/**
 * Check if file is a symlink
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  filePath: string,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    category,
    maxSize,
    verifyMimeType: shouldVerifyMime = false,
    rejectSymlinks = false,
    allowedExtensions,
  } = options;

  const result: FileValidationResult = {
    valid: true,
    path: filePath,
    extension: "",
    size: 0,
    errors: [],
    warnings: [],
  };

  try {
    // 1. Validate path safety
    validatePath(filePath);

    // 2. Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      result.valid = false;
      result.errors.push("File does not exist or is not accessible");
      return result;
    }

    // 3. Check for symlinks
    if (rejectSymlinks && (await isSymlink(filePath))) {
      result.valid = false;
      result.errors.push("Symlinks are not allowed");
      return result;
    }

    // 4. Validate extension
    const extensions =
      allowedExtensions ||
      (category ? getAllowedExtensionsForCategory(category) : undefined);

    const extValidation = validateExtension(filePath, extensions);
    result.extension = extValidation.extension;

    if (!extValidation.valid) {
      result.valid = false;
      result.errors.push(extValidation.error!);
    }

    // 5. Validate file size
    const sizeValidation = await validateFileSize(filePath, maxSize);
    result.size = sizeValidation.size;

    if (!sizeValidation.valid) {
      result.valid = false;
      result.errors.push(sizeValidation.error!);
    }

    // 6. Verify MIME type if requested
    if (shouldVerifyMime && result.valid) {
      const mimeValidation = await verifyMimeType(filePath, category);
      result.mimeType = mimeValidation.mimeType;

      if (!mimeValidation.valid) {
        result.valid = false;
        result.errors.push(mimeValidation.warning!);
      } else if (mimeValidation.warning) {
        result.warnings.push(mimeValidation.warning);
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push((error as Error).message);
  }

  return result;
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  filePaths: string[],
  options: FileValidationOptions = {}
): Promise<FileValidationResult[]> {
  const results = await Promise.all(
    filePaths.map((filePath) => validateFile(filePath, options))
  );

  return results;
}

/**
 * Quick validation for scan operations
 * Less strict than full validation
 */
export async function quickValidate(
  filePath: string,
  allowedExtensions: string[]
): Promise<boolean> {
  try {
    // Check path safety
    validatePath(filePath);

    // Check extension
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.map((e) => e.toLowerCase()).includes(ext)) {
      return false;
    }

    // Check if file exists and is accessible
    await fs.access(filePath);

    return true;
  } catch {
    return false;
  }
}
