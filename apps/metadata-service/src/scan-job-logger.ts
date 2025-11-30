import { Logger } from "@dester/logger";
import fs from "fs/promises";
import path from "path";
import { createWriteStream, WriteStream } from "fs";

/**
 * Scan Job Failure Logger
 * Writes failed metadata items to scan-job-specific log files
 */
export class ScanJobLogger {
  private logDir: string;
  private logger: Logger;
  private openStreams: Map<string, WriteStream> = new Map();

  constructor(logDir: string, logger: Logger) {
    this.logDir = logDir;
    this.logger = logger;
  }

  /**
   * Get the log file path for a scan job
   */
  private getLogFilePath(scanJobId: string): string {
    return path.join(this.logDir, `scan-job-${scanJobId}-failures.log`);
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDir(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      this.logger.warn(
        { error, logDir: this.logDir },
        "Failed to create scan job log directory"
      );
    }
  }

  /**
   * Get or create a write stream for a scan job
   */
  private async getStream(scanJobId: string): Promise<WriteStream | null> {
    if (this.openStreams.has(scanJobId)) {
      return this.openStreams.get(scanJobId)!;
    }

    try {
      await this.ensureLogDir();
      const logFilePath = this.getLogFilePath(scanJobId);
      const stream = createWriteStream(logFilePath, { flags: "a" }); // Append mode
      this.openStreams.set(scanJobId, stream);

      // Handle stream errors
      stream.on("error", (error) => {
        this.logger.warn(
          { error, scanJobId, logFilePath },
          "Error writing to scan job log file"
        );
        this.openStreams.delete(scanJobId);
      });

      return stream;
    } catch (error) {
      this.logger.warn(
        { error, scanJobId },
        "Failed to create write stream for scan job log"
      );
      return null;
    }
  }

  /**
   * Log a failed metadata item
   */
  async logFailure(
    scanJobId: string,
    data: {
      mediaId: string;
      title: string;
      year?: number;
      filename?: string;
      folderPath?: string;
      reason: string;
      error?: string;
    }
  ): Promise<void> {
    try {
      const stream = await this.getStream(scanJobId);
      if (!stream) {
        return; // Silently fail if we can't write
      }

      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        mediaId: data.mediaId,
        title: data.title,
        year: data.year,
        filename: data.filename,
        folderPath: data.folderPath,
        reason: data.reason,
        error: data.error,
      };

      const logLine = JSON.stringify(logEntry) + "\n";
      stream.write(logLine);
    } catch (error) {
      // Don't throw - logging failures shouldn't break the main flow
      this.logger.debug(
        { error, scanJobId },
        "Failed to write to scan job log file (non-critical)"
      );
    }
  }

  /**
   * Close the write stream for a scan job
   */
  async closeStream(scanJobId: string): Promise<void> {
    const stream = this.openStreams.get(scanJobId);
    if (stream) {
      return new Promise((resolve) => {
        stream.end(() => {
          this.openStreams.delete(scanJobId);
          resolve();
        });
      });
    }
  }

  /**
   * Close all open streams
   */
  async closeAll(): Promise<void> {
    const promises = Array.from(this.openStreams.keys()).map((scanJobId) =>
      this.closeStream(scanJobId)
    );
    await Promise.all(promises);
  }

  /**
   * Get the log file path for a scan job (public method for reading logs)
   */
  getLogFile(scanJobId: string): string {
    return this.getLogFilePath(scanJobId);
  }
}
