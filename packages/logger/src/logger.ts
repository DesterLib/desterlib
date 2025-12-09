import pino from "pino";
import path from "path";
import fs from "fs";

const isDevelopment = process.env.NODE_ENV === "development";

// Configure file destination if API_LOG_PATH is set
let fileDestination: pino.DestinationStream | undefined;
if (process.env.API_LOG_PATH) {
  try {
    // API_LOG_PATH should be relative to project root
    // When running from compiled code, __dirname will be in packages/logger/dist/
    // When running from source, we can use process.cwd() as project root
    // Try to detect project root by looking for pnpm-workspace.yaml
    let projectRoot = process.cwd();

    // If we're in a packages/logger/dist folder, go up to find project root
    // __dirname will be packages/logger/dist when compiled
    if (
      __dirname.includes("packages/logger/dist") ||
      __dirname.includes("packages\\logger\\dist")
    ) {
      // Go up: packages/logger/dist -> packages/logger -> packages -> root
      let currentDir = path.resolve(__dirname, "../../../");
      if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
        projectRoot = currentDir;
      }
    } else {
      // When running from source or if path detection fails, use cwd
      // Try to find project root by going up from cwd
      let currentDir = process.cwd();
      while (currentDir !== path.dirname(currentDir)) {
        if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
          projectRoot = currentDir;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
    }

    const logDir = path.resolve(projectRoot, process.env.API_LOG_PATH);
    const logFile = path.join(logDir, "combined.log");

    // Ensure directory exists
    fs.mkdirSync(logDir, { recursive: true });

    // Create file stream destination
    // In pkg executables, pino-pretty transport may not resolve, so use pino.destination() instead
    // This writes JSON logs which is fine for file storage
    try {
      // Try to use pino-pretty for readable logs (works in normal Node.js)
      fileDestination = pino.transport({
        target: "pino-pretty",
        options: {
          destination: logFile,
          colorize: false, // No colors in file
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: false,
        },
      });
    } catch (transportError) {
      // Fallback to regular file destination if pino-pretty transport fails
      // This happens in pkg executables where module resolution is different
      fileDestination = pino.destination(logFile);
    }
  } catch (error) {
    // Silently fail if file logging can't be set up
    console.error("Failed to setup file logging:", error);
  }
}

// Configure transports
const streams: Array<{ level: pino.Level; stream: pino.DestinationStream }> =
  [];

// Add file destination if configured
if (fileDestination) {
  streams.push({ level: "debug", stream: fileDestination });
}

// Add pretty console output in development
if (isDevelopment) {
  try {
    // Try to use pino-pretty for pretty console output
    streams.push({
      level: "debug",
      stream: pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }),
    });
  } catch (error) {
    // Fallback to regular pino output if pino-pretty is not available
    // This can happen in pkg executables
    streams.push({
      level: "debug",
      stream: process.stdout,
    });
  }
}

export const logger =
  streams.length > 0
    ? pino(
        {
          level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
        },
        pino.multistream(streams)
      )
    : pino({
        level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
      });

export type Logger = typeof logger;
