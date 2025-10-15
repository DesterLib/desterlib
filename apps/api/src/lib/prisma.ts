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
 * Create Prisma client with appropriate logging based on environment
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as const)
        : (["error"] as const),
    errorFormat: env.NODE_ENV === "development" ? "pretty" : "minimal",
  });
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
