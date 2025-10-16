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
  const config: {
    log: ("query" | "error" | "warn")[];
    errorFormat: "pretty" | "minimal";
    datasources?: {
      db: {
        url: string;
      };
    };
  } = {
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
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
const basePrisma = global.__prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  global.__prisma = basePrisma;
}

// ────────────────────────────────────────────────────────────────────────────
// Prisma Extension: Auto-assign SUPER_ADMIN to first user
// ────────────────────────────────────────────────────────────────────────────

export const prisma = basePrisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        // Check if this will be the first user
        const userCount = await basePrisma.user.count();

        if (userCount === 0) {
          // This is the first user - set role to SUPER_ADMIN
          logger.info(
            "[Prisma Extension] Creating first user - assigning SUPER_ADMIN role"
          );
          args.data.role = "SUPER_ADMIN";
        }

        return query(args);
      },
    },
  },
});

/**
 * Gracefully disconnect from database
 * Should be called during application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await basePrisma.$disconnect();
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error("Error disconnecting from database:", error);
    throw error;
  }
}

/**
 * Verify database connection on startup
 * This should be called before starting the server
 * @throws {Error} If connection fails
 */
export async function verifyDatabaseConnection(): Promise<void> {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Attempting to connect to database (attempt ${attempt}/${maxRetries})...`
      );
      await basePrisma.$connect();
      await basePrisma.$queryRaw`SELECT 1`;
      logger.info("✅ Database connection established successfully");
      return;
    } catch (error: unknown) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        logger.error("❌ Failed to connect to database after all attempts");
        logger.error("Error details:", error);

        // Provide helpful troubleshooting information
        const dbUrl = env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"); // Hide password
        logger.error("\n──────────────────────────────────────────────────");
        logger.error("DATABASE CONNECTION FAILED");
        logger.error("──────────────────────────────────────────────────");
        logger.error(`Database URL: ${dbUrl}`);
        logger.error("\nPossible causes:");
        logger.error("  1. Database server is not running");
        logger.error("  2. Database credentials are incorrect");
        logger.error("  3. Database host/port is incorrect");
        logger.error("  4. Firewall is blocking the connection");
        logger.error("\nTroubleshooting steps:");
        logger.error("  • Check if PostgreSQL is running:");
        logger.error("    $ docker-compose ps     (if using Docker)");
        logger.error("    $ pg_isready -h localhost -p 5432");
        logger.error("  • Verify DATABASE_URL in your .env file");
        logger.error("  • Run database migrations:");
        logger.error("    $ pnpm db:migrate");
        logger.error("  • Start database with Docker:");
        logger.error("    $ docker-compose up -d postgres");
        logger.error("──────────────────────────────────────────────────\n");

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(
          `Cannot connect to database. The application requires a database connection to function. ${errorMessage}`
        );
      }

      logger.warn(
        `Database connection attempt ${attempt} failed, retrying in ${retryDelay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Check database connection health
 * Useful for health check endpoints
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await basePrisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database health check failed:", error);
    return false;
  }
}
