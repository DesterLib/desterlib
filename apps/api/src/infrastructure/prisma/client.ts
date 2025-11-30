import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "@dester/logger";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Prevent multiple instances of Prisma Client in development
const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.PRISMA_LOG === "true"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

// Integrate Prisma logging with custom logger
// Using type assertion since Prisma's $on typing doesn't include event emitter pattern
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaClient = prisma as any;

// Only enable query logging if explicitly enabled via PRISMA_LOG env var
if (process.env.PRISMA_LOG === "true") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient.$on("query", (e: any) => {
    logger.debug(`prisma:query ${e.query}`, {
      duration: `${e.duration}ms`,
      params: e.params,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient.$on("warn", (e: any) => {
    logger.warn(`prisma:warn ${e.message}`, { target: e.target });
  });
}

// Error logging in all environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
prismaClient.$on("error", (e: any) => {
  logger.error(`prisma:error ${e.message}`, { target: e.target });
});

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

export { prisma };
export default prisma;
