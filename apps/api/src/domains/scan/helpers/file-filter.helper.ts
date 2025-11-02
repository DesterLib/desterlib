/**
 * File filtering utilities for media scanning
 * Determines which files and directories to skip during scanning
 */

/**
 * List of directory patterns to skip during scanning
 */
const SKIP_DIRECTORIES = [
  // System directories
  ".",
  "..",
  "$RECYCLE.BIN",
  "System Volume Information",
  ".Spotlight-V100",
  ".Trashes",
  ".fseventsd",
  ".TemporaryItems",
  
  // Hidden/config directories
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  ".cache",
  ".tmp",
  
  // Media-specific
  "@eaDir", // Synology
  "#recycle",
  ".@__thumb",
  "Extras",
  "Behind The Scenes",
  "Deleted Scenes",
  "Featurettes",
  "Interviews",
  "Scenes",
  "Shorts",
  "Trailers",
  "Other",
  ".AppleDouble",
];

/**
 * File patterns to skip during scanning
 */
const SKIP_FILE_PATTERNS = [
  // System files
  /^\./,  // Hidden files
  /^~\$/,  // Temp files
  /^Thumbs\.db$/i,
  /^\.DS_Store$/,
  /^desktop\.ini$/i,
  
  // Media-specific
  /\.(nfo|txt|srt|sub|idx|ass|ssa|vtt)$/i,  // Metadata/subtitles
  /\.(jpg|jpeg|png|gif|bmp)$/i,  // Images
  /^sample\./i,  // Sample files
  /-sample\./i,
  /\bsample\b/i,
];

/**
 * Checks if a directory or file should be skipped during scanning
 * 
 * @param name - File or directory name
 * @param isDirectory - Whether this is a directory
 * @returns True if should skip, false otherwise
 */
export function shouldSkipEntry(name: string, isDirectory: boolean): boolean {
  // Skip hidden/system files and directories
  if (name.startsWith(".")) {
    // Allow specific media directories that start with dot but aren't system files
    const allowedDotDirs = [".media", ".movies", ".tv"];
    if (!isDirectory || !allowedDotDirs.includes(name.toLowerCase())) {
      return true;
    }
  }

  // Skip system and unwanted directories
  if (isDirectory) {
    if (SKIP_DIRECTORIES.includes(name)) {
      return true;
    }
    
    // Skip directories matching patterns
    if (name.toLowerCase().includes("@eadir")) {
      return true;
    }
  }

  // Skip files matching patterns
  if (!isDirectory) {
    for (const pattern of SKIP_FILE_PATTERNS) {
      if (pattern.test(name)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get default video file extensions for scanning
 */
export function getDefaultVideoExtensions(): string[] {
  return [
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
  ];
}

/**
 * Check if a file has a valid video extension
 * 
 * @param filename - Name of the file
 * @param allowedExtensions - Optional array of allowed extensions
 * @returns True if file has video extension
 */
export function isVideoFile(
  filename: string,
  allowedExtensions: string[] = getDefaultVideoExtensions()
): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return allowedExtensions.includes(ext);
}

