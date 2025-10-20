/* eslint-disable turbo/no-undeclared-env-vars */
import dotenv from "dotenv";
import path from "path";

// Load environment variables from single .env file in project root
// Try multiple possible locations for the .env file
const possiblePaths = [
  // From project root (when running from project root)
  path.resolve(process.cwd(), ".env"),
  // From API directory (when running from apps/api)
  path.resolve(__dirname, "../../../../../.env"),
  // API-specific .env file
  path.resolve(__dirname, "../.env"),
  // Absolute path fallback
  ".env",
];

for (const envPath of possiblePaths) {
  try {
    dotenv.config({ path: envPath });
    // Check if we loaded DATABASE_URL to confirm success
    if (process.env.DATABASE_URL) {
      break;
    }
  } catch {
    // Continue trying other paths
    continue;
  }
}

// Validate required environment variables before creating config
if (!process.env.DATABASE_URL) {
  throw new Error(`Missing required environment variable: DATABASE_URL`);
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // JWT (add when implementing authentication)
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),

  // Route guards
  enableRouteGuards: process.env.ENABLE_ROUTE_GUARDS === "true",

  // TMDB API
  tmdbApiKey: process.env.TMDB_API_KEY || "",
} as const;
