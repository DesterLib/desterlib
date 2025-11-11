/**
 * Detects if a directory structure matches the expected media type
 * Helps prevent accidentally scanning movies as TV shows and vice versa
 */

import { readdirSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/utils";

interface MediaTypeHints {
  hasSeasonFolders: number; // Count of folders with "Season" pattern
  hasEpisodeFiles: number;  // Count of files with S##E## pattern
  hasMovieFiles: number;     // Count of files with year pattern (2020)
  avgDepth: number;          // Average nesting depth
  sampleFiles: string[];     // Sample filenames for logging
}

/**
 * Analyze directory structure to detect media type hints
 */
export function analyzeDirectoryStructure(
  rootPath: string,
  maxSamples: number = 20
): MediaTypeHints {
  const hints: MediaTypeHints = {
    hasSeasonFolders: 0,
    hasEpisodeFiles: 0,
    hasMovieFiles: 0,
    avgDepth: 0,
    sampleFiles: [],
  };

  const depths: number[] = [];
  const seasonPattern = /season\s*\d+/i;
  const episodePattern = /S\d{1,2}E\d{1,2}/i;
  const yearPattern = /\(?\d{4}\)?/; // (2020) or 2020

  function scan(currentPath: string, depth: number = 0): void {
    // Limit depth to prevent long scans
    if (depth > 4) return;
    
    // Limit total samples
    if (hints.sampleFiles.length >= maxSamples) return;

    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (hints.sampleFiles.length >= maxSamples) break;

        const fullPath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Check for season folders
          if (seasonPattern.test(entry.name)) {
            hints.hasSeasonFolders++;
          }
          scan(fullPath, depth + 1);
        } else {
          // Check file patterns
          const filename = entry.name.toLowerCase();
          
          // Video extensions only
          if (!/\.(mkv|mp4|avi|mov)$/i.test(filename)) continue;

          depths.push(depth);
          hints.sampleFiles.push(entry.name);

          if (episodePattern.test(entry.name)) {
            hints.hasEpisodeFiles++;
          }
          if (yearPattern.test(entry.name)) {
            hints.hasMovieFiles++;
          }
        }
      }
    } catch (error) {
      // Silently skip inaccessible directories
    }
  }

  scan(rootPath);

  // Calculate average depth
  if (depths.length > 0) {
    hints.avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
  }

  return hints;
}

/**
 * Detect if specified media type matches directory structure
 * Returns warning if mismatch detected
 */
export function detectMediaTypeMismatch(
  rootPath: string,
  specifiedType: "movie" | "tv"
): { mismatch: boolean; warning?: string; confidence: number } {
  logger.info(`🔍 Analyzing directory structure for media type validation...`);
  
  const hints = analyzeDirectoryStructure(rootPath);
  
  logger.info(`   Season folders: ${hints.hasSeasonFolders}`);
  logger.info(`   Episode-pattern files: ${hints.hasEpisodeFiles}`);
  logger.info(`   Movie-pattern files: ${hints.hasMovieFiles}`);
  logger.info(`   Average depth: ${hints.avgDepth.toFixed(1)}`);
  
  if (hints.sampleFiles.length > 0) {
    logger.info(`   Sample files: ${hints.sampleFiles.slice(0, 3).join(", ")}`);
  }

  // Calculate confidence scores (0-100)
  const tvScore = 
    (hints.hasSeasonFolders > 0 ? 40 : 0) +
    (hints.hasEpisodeFiles > 5 ? 30 : hints.hasEpisodeFiles * 6) +
    (hints.avgDepth >= 3 ? 30 : 0);
  
  const movieScore = 
    (hints.hasMovieFiles > 5 ? 40 : hints.hasMovieFiles * 8) +
    (hints.avgDepth <= 2 ? 30 : 0) +
    (hints.hasSeasonFolders === 0 ? 30 : 0);

  // Determine mismatch
  if (specifiedType === "tv") {
    // Specified TV, but looks like movies
    if (movieScore > tvScore + 20) {
      return {
        mismatch: true,
        warning: `⚠️  WARNING: You specified "TV Shows" but this directory looks like MOVIES!\n` +
                `   Detected: ${hints.hasMovieFiles} movie-pattern files, avg depth ${hints.avgDepth.toFixed(1)}, ${hints.hasSeasonFolders} season folders\n` +
                `   This may result in incorrect metadata matching. Consider scanning as "movie" type instead.`,
        confidence: movieScore,
      };
    }
  } else if (specifiedType === "movie") {
    // Specified movie, but looks like TV
    if (tvScore > movieScore + 20) {
      return {
        mismatch: true,
        warning: `⚠️  WARNING: You specified "Movies" but this directory looks like TV SHOWS!\n` +
                `   Detected: ${hints.hasSeasonFolders} season folders, ${hints.hasEpisodeFiles} episode files, avg depth ${hints.avgDepth.toFixed(1)}\n` +
                `   This may result in incorrect metadata matching. Consider scanning as "tv" type instead.`,
        confidence: tvScore,
      };
    }
  }

  return {
    mismatch: false,
    confidence: specifiedType === "tv" ? tvScore : movieScore,
  };
}

