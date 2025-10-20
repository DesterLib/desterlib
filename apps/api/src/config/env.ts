import dotenv from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${nodeEnv}`;

// Try to load environment-specific file
const envPath = path.resolve(process.cwd(), envFile);
dotenv.config({ path: envPath });

// If no environment-specific file found, try default .env
if (!process.env.DATABASE_URL) {
  dotenv.config();
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
