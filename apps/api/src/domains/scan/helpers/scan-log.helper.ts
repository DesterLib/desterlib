/**
 * Scan log helper - tracks what matched and what didn't during scanning
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { logger } from "@/lib/utils";
import type { MediaEntry } from "../scan.types";

export interface ScanLogEntry {
  filePath: string;
  fileName: string;
  extractedIds: {
    tmdbId?: string;
    imdbId?: string;
    tvdbId?: string;
    title?: string;
    year?: string;
    season?: number;
    episode?: number;
  };
  metadataFound: boolean;
  metadataSource?: "cache" | "database" | "tmdb" | "search";
  tmdbId?: string;
  matchedTitle?: string;
  searchAttempted?: boolean;
  searchResults?: number; // Number of search results found
  saved: boolean;
  error?: string;
  savedAt?: string;
}

export class ScanLogger {
  private logEntries: ScanLogEntry[] = [];
  private logFilePath: string;
  private libraryId: string;
  private libraryName: string;
  private scanStartTime: Date;

  constructor(libraryId: string, libraryName: string) {
    this.libraryId = libraryId;
    this.libraryName = libraryName;
    this.scanStartTime = new Date();

    // Create log file path: logs/scan-{libraryId}-{timestamp}.json
    const timestamp = this.scanStartTime.toISOString().replace(/[:.]/g, "-");
    const logsDir = join(process.cwd(), "logs", "scans");
    this.logFilePath = join(logsDir, `scan-${libraryId}-${timestamp}.json`);
  }

  /**
   * Log a file entry before processing
   */
  logFileFound(mediaEntry: MediaEntry): void {
    this.logEntries.push({
      filePath: mediaEntry.path,
      fileName: mediaEntry.name,
      extractedIds: {
        tmdbId: mediaEntry.extractedIds.tmdbId,
        imdbId: mediaEntry.extractedIds.imdbId,
        tvdbId: mediaEntry.extractedIds.tvdbId,
        title: mediaEntry.extractedIds.title,
        year: mediaEntry.extractedIds.year,
        season: mediaEntry.extractedIds.season,
        episode: mediaEntry.extractedIds.episode,
      },
      metadataFound: false,
      saved: false,
    });
  }

  /**
   * Log metadata found from cache/database
   */
  logMetadataFromCache(
    filePath: string,
    tmdbId: string | number,
    source: "cache" | "database"
  ): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.metadataFound = true;
      entry.metadataSource = source;
      entry.tmdbId = String(tmdbId);
    }
  }

  /**
   * Log metadata found from TMDB
   */
  logMetadataFromTMDB(
    filePath: string,
    tmdbId: string | number,
    title: string
  ): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.metadataFound = true;
      entry.metadataSource = "tmdb";
      entry.tmdbId = String(tmdbId);
      entry.matchedTitle = title;
    }
  }

  /**
   * Log search attempt
   */
  logSearchAttempt(
    filePath: string,
    searchTitle: string,
    resultsFound: number,
    matchedTmdbId?: number,
    matchedTitle?: string
  ): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.searchAttempted = true;
      entry.searchResults = resultsFound;
      if (matchedTmdbId) {
        entry.metadataFound = true;
        entry.metadataSource = "search";
        entry.tmdbId = String(matchedTmdbId);
        entry.matchedTitle = matchedTitle;
      }
    }
  }

  /**
   * Log search failure
   */
  logSearchFailure(
    filePath: string,
    searchTitle: string,
    error?: string
  ): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.searchAttempted = true;
      entry.searchResults = 0;
      if (error) {
        entry.error = `Search failed: ${error}`;
      }
    }
  }

  /**
   * Log successful save
   */
  logSaveSuccess(filePath: string, title: string): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.saved = true;
      entry.savedAt = new Date().toISOString();
      if (!entry.matchedTitle) {
        entry.matchedTitle = title;
      }
    }
  }

  /**
   * Log save failure
   */
  logSaveFailure(filePath: string, error: string): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.saved = false;
      entry.error = `Save failed: ${error}`;
    }
  }

  /**
   * Log skipped file (no metadata/TMDB ID)
   */
  logSkipped(filePath: string, reason: string): void {
    const entry = this.findEntry(filePath);
    if (entry) {
      entry.saved = false;
      entry.error = `Skipped: ${reason}`;
    }
  }

  /**
   * Find log entry by file path
   */
  private findEntry(filePath: string): ScanLogEntry | undefined {
    return this.logEntries.find((entry) => entry.filePath === filePath);
  }

  /**
   * Save log file to disk
   */
  async saveLog(): Promise<void> {
    try {
      // Ensure logs/scans directory exists
      const logsDir = join(process.cwd(), "logs", "scans");
      await mkdir(logsDir, { recursive: true });

      const scanEndTime = new Date();
      const duration = scanEndTime.getTime() - this.scanStartTime.getTime();

      const summary = {
        libraryId: this.libraryId,
        libraryName: this.libraryName,
        scanStartTime: this.scanStartTime.toISOString(),
        scanEndTime: scanEndTime.toISOString(),
        durationMs: duration,
        durationSeconds: Math.round(duration / 1000),
        totalFiles: this.logEntries.length,
        matched: this.logEntries.filter((e) => e.metadataFound).length,
        notMatched: this.logEntries.filter((e) => !e.metadataFound).length,
        saved: this.logEntries.filter((e) => e.saved).length,
        failed: this.logEntries.filter((e) => !e.saved && e.error).length,
        skipped: this.logEntries.filter(
          (e) => !e.saved && e.error?.startsWith("Skipped")
        ).length,
        metadataSources: {
          cache: this.logEntries.filter((e) => e.metadataSource === "cache")
            .length,
          database: this.logEntries.filter(
            (e) => e.metadataSource === "database"
          ).length,
          tmdb: this.logEntries.filter((e) => e.metadataSource === "tmdb")
            .length,
          search: this.logEntries.filter((e) => e.metadataSource === "search")
            .length,
        },
      };

      const logData = {
        summary,
        entries: this.logEntries,
      };

      await writeFile(
        this.logFilePath,
        JSON.stringify(logData, null, 2),
        "utf-8"
      );

      logger.info(`📝 Scan log saved to: ${this.logFilePath}`);
      logger.info(
        `   Summary: ${summary.matched}/${summary.totalFiles} matched, ${summary.saved}/${summary.totalFiles} saved`
      );
    } catch (error) {
      logger.error(
        `Failed to save scan log: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Get the log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}
