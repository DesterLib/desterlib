import dotenv from "dotenv";
import path from "path";

// Load environment variables
// .env file is at project root (only in development, not in pkg executable)
// In pkg executables, __dirname points to /snapshot, so we can't reliably find .env
// Try to load .env, but don't fail if it doesn't exist (executable mode)
try {
  const envPath = path.resolve(__dirname, "../../../../.env");
  dotenv.config({ path: envPath });
} catch (error) {
  // .env file not found, that's okay in executable mode
  // Configuration will come from environment variables
}

// Validate required environment variables (lazy validation - only when server starts)
export function validateConfig(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!process.env.METADATA_PATH) {
    throw new Error("METADATA_PATH environment variable is required");
  }

  if (!process.env.API_LOG_PATH) {
    throw new Error("API_LOG_PATH environment variable is required");
  }
}

// Parse plugins from environment variable (comma-separated)
const parsePlugins = (): string[] => {
  const pluginsEnv = process.env.PLUGINS;
  if (!pluginsEnv) {
    return ["@dester/tmdb-plugin"]; // Default to tmdb-plugin
  }
  return pluginsEnv
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
};

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  scannerServiceUrl: process.env.SCANNER_SERVICE_URL || "http://localhost:8080",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  // Resolve paths: if absolute, use as-is; if relative, resolve from current working directory
  // In pkg executables, __dirname is /snapshot, so we use process.cwd() instead
  // Note: validateConfig() must be called before accessing these values
  // Using fallback empty string to prevent runtime errors during module load
  metadataPath: process.env.METADATA_PATH
    ? path.isAbsolute(process.env.METADATA_PATH)
      ? process.env.METADATA_PATH
      : path.resolve(process.cwd(), process.env.METADATA_PATH)
    : "",
  apiLogPath: process.env.API_LOG_PATH
    ? path.isAbsolute(process.env.API_LOG_PATH)
      ? process.env.API_LOG_PATH
      : path.resolve(process.cwd(), process.env.API_LOG_PATH)
    : "",
  plugins: parsePlugins(),
  // Plugin configuration
  pluginConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379/0",
    queueName: process.env.METADATA_QUEUE_NAME || "metadata:jobs",
    maxConcurrentJobs: process.env.METADATA_MAX_CONCURRENT || "20",
    rateLimitRps: process.env.METADATA_RATE_LIMIT_RPS || "4",
    metadataPath: process.env.METADATA_PATH
      ? path.isAbsolute(process.env.METADATA_PATH)
        ? process.env.METADATA_PATH
        : path.resolve(process.cwd(), process.env.METADATA_PATH)
      : "",
    scanJobLogPath: path.isAbsolute(process.env.SCAN_JOB_LOG_PATH || "logs")
      ? process.env.SCAN_JOB_LOG_PATH || "logs"
      : path.resolve(process.cwd(), process.env.SCAN_JOB_LOG_PATH || "logs"),
    projectRoot: process.cwd(), // Use current working directory in executable mode
  },
} as const;
