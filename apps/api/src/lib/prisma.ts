/**
 * Singleton Prisma Client
 *
 * Creates a single PrismaClient instance shared across the application.
 * Prevents creating multiple database connections in development.
 *
 * Usage:
 *   import { prisma } from '../lib/prisma.js';
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from "../generated/prisma/index.js";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with appropriate logging and connection pooling
 *
 * Connection Pool Settings (PostgreSQL):
 * - connection_limit: Maximum number of database connections (default: num_physical_cpus * 2 + 1)
 * - pool_timeout: How long to wait for a connection from the pool (default: 10s)
 */
function createPrismaClient(): PrismaClient {
  const config: any = {
    log:
      env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as const)
        : (["error"] as const),
    errorFormat: env.NODE_ENV === "development" ? "pretty" : "minimal",
  };

  // Add datasource configuration for connection pooling
  if (env.DATABASE_CONNECTION_LIMIT || env.DATABASE_POOL_TIMEOUT) {
    config.datasources = {
      db: {
        url: buildDatabaseUrl(),
      },
    };
  }

  return new PrismaClient(config);
}

/**
 * Build database URL with connection pool parameters
 */
function buildDatabaseUrl(): string {
  const url = new URL(env.DATABASE_URL);

  // Only add pooling params for PostgreSQL
  if (url.protocol.startsWith("postgres")) {
    if (env.DATABASE_CONNECTION_LIMIT) {
      url.searchParams.set(
        "connection_limit",
        env.DATABASE_CONNECTION_LIMIT.toString()
      );
    }
    if (env.DATABASE_POOL_TIMEOUT) {
      url.searchParams.set(
        "pool_timeout",
        env.DATABASE_POOL_TIMEOUT.toString()
      );
    }

    // Recommended PostgreSQL connection settings
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "10");
    }
  }

  return url.toString();
}

/**
 * Singleton instance - reused in development to prevent multiple connections
 */
export const prisma = global.__prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

/**
 * Gracefully disconnect from database
 * Should be called during application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error("Error disconnecting from database:", error);
    throw error;
  }
}

/**
 * Check database connection health
 * Useful for health check endpoints
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database health check failed:", error);
    return false;
  }
}
