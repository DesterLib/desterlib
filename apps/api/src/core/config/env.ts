import dotenv from "dotenv";
import path from "path";
import { settingsManager } from "./settings";

// Load environment variables for development
const possiblePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../../../.env"),
  path.resolve(__dirname, "../.env"),
  ".env",
];

for (const envPath of possiblePaths) {
  try {
    dotenv.config({ path: envPath });
    if (process.env.DATABASE_URL) {
      break;
    }
  } catch {
    continue;
  }
}

// Get default settings from user settings manager
const defaultSettings = settingsManager.getDefaultSettings();

export const config = {
  port: process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : defaultSettings.port,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/desterlib_prod",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
} as const;
