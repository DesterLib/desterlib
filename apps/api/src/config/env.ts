/* eslint-disable turbo/no-undeclared-env-vars */
import dotenv from "dotenv";
import path from "path";

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

if (!process.env.DATABASE_URL) {
  throw new Error(`Missing required environment variable: DATABASE_URL`);
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  enableRouteGuards: process.env.ENABLE_ROUTE_GUARDS === "true",
  tmdbApiKey: process.env.TMDB_API_KEY || "",
} as const;
