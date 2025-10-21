/* eslint-disable turbo/no-undeclared-env-vars */
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

// Get default settings from user settings manager (works for both dev and executable)
// Note: We use defaults here for initialization, actual settings will be loaded async later
const defaultSettings = settingsManager.getDefaultSettings();

export const config = {
  port: process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : defaultSettings.port,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/desterlib_prod",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || defaultSettings.jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  enableRouteGuards:
    process.env.ENABLE_ROUTE_GUARDS === "true" ||
    defaultSettings.enableRouteGuards,
  // TMDB API key will be loaded from database when needed
  tmdbApiKey: process.env.TMDB_API_KEY || "",
} as const;

// Helper function to get TMDB API key from database
export const getTmdbApiKey = async (): Promise<string> => {
  try {
    return await settingsManager.getTmdbApiKey();
  } catch {
    return process.env.TMDB_API_KEY || "";
  }
};
