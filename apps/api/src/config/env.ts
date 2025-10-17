/**
 * Environment Configuration with Zod Validation
 *
 * This module validates all environment variables at startup.
 * If validation fails, the application will not start.
 *
 * Usage:
 *   import { env } from './config/env.js';
 *   const port = env.PORT;
 */

// Load environment variables from .env file
// .env.local takes precedence over .env
import { config } from "dotenv";
config({ path: ".env.local" }); // Load .env.local first (if exists)
config(); // Then load .env (won't override existing vars)

import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().int().positive().optional(),
  DATABASE_POOL_TIMEOUT: z.coerce.number().int().positive().optional(), // seconds

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  WEB_URL: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),

  // External API Keys (Legacy - prefer configuring via Settings UI)
  TMDB_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  // Redis Cache
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  CACHE_TTL: z.coerce.number().int().positive().default(3600), // 1 hour in seconds
  CACHE_ENABLED: z.coerce.boolean().default(false),

  // Authentication
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"), // JWT expiration (e.g., "7d", "24h")
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "Refresh token secret must be at least 32 characters"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),

  // API Keys
  API_KEY_PREFIX: z.string().default("dester"),
});

/**
 * Validates and parses environment variables
 * @throws {ZodError} If validation fails
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment variables:");
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

// Type export for usage in other files
export type Env = z.infer<typeof envSchema>;
