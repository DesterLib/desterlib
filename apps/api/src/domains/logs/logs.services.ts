import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/utils";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, unknown>;
}

const LOG_FILE_PATH = path.join(process.cwd(), "logs", "combined.log");
const MAX_LOGS_TO_READ = 500; // Maximum number of logs to read from file

/**
 * Strip ANSI color codes from a string
 */
function stripAnsiColors(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Parse a log line from the combined.log file
 */
function parseLogLine(line: string): LogEntry | null {
  try {
    // Strip ANSI color codes first
    const cleanLine = stripAnsiColors(line);

    // Log format: "YYYY-MM-DD HH:mm:ss [level]: message meta"
    const match = cleanLine.match(
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/
    );

    if (!match) return null;

    const [, timestamp, level, rest] = match;

    if (!timestamp || !level || !rest) return null;

    // Try to extract metadata JSON if present
    let message = rest;
    let meta: Record<string, unknown> | undefined;

    // Check if there's JSON at the end
    const jsonMatch = rest.match(/^(.+?)(\{.+\})$/);
    if (jsonMatch && jsonMatch[1] && jsonMatch[2]) {
      try {
        message = jsonMatch[1].trim();
        meta = JSON.parse(jsonMatch[2]);
      } catch {
        // If JSON parsing fails, keep original message
        message = rest;
      }
    }

    return {
      timestamp,
      level: level.toLowerCase(),
      message,
      meta,
    };
  } catch {
    return null;
  }
}

/**
 * Get recent logs from the log file
 */
export async function getRecentLogs(
  limit: number = 100,
  levelFilter?: string
): Promise<LogEntry[]> {
  try {
    // Read the log file
    const content = await fs.readFile(LOG_FILE_PATH, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());

    // Parse log lines
    const logs = lines
      .slice(-MAX_LOGS_TO_READ) // Get last N lines
      .map(parseLogLine)
      .filter((log): log is LogEntry => log !== null);

    // Filter by level if specified
    let filteredLogs = logs;
    if (levelFilter) {
      const normalizedLevel = levelFilter.toLowerCase();
      filteredLogs = logs.filter((log) => log.level === normalizedLevel);
    }

    // Return most recent logs (up to limit)
    return filteredLogs.slice(-limit).reverse();
  } catch {
    logger.error("Error reading log file");
    return [];
  }
}

/**
 * Clear the log file
 */
export async function clearLogs(): Promise<void> {
  try {
    await fs.writeFile(LOG_FILE_PATH, "");
    logger.info("Logs cleared");
  } catch (error) {
    logger.error("Error clearing logs");
    throw error;
  }
}

export const logsServices = {
  getRecentLogs,
  clearLogs,
};

