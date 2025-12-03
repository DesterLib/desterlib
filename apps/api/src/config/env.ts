import dotenv from "dotenv";
import path from "path";

// Load environment variables
// .env file is at project root
// From apps/api/src/config: ../../.. goes to apps/, then ../ goes to root
const envPath = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

if (!process.env.METADATA_PATH) {
  throw new Error("METADATA_PATH environment variable is required");
}

if (!process.env.API_LOG_PATH) {
  throw new Error("API_LOG_PATH environment variable is required");
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  scannerServiceUrl: process.env.SCANNER_SERVICE_URL || "http://localhost:8080",
  metadataServiceUrl:
    process.env.METADATA_SERVICE_URL || "http://localhost:8081",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  metadataPath: path.resolve(
    __dirname,
    "../../../../",
    process.env.METADATA_PATH
  ),
  apiLogPath: path.resolve(__dirname, "../../../../", process.env.API_LOG_PATH),
} as const;
