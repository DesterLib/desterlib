import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { logger } from "@dester/logger";

declare global {
  var __prisma: PrismaClient | undefined;
}

interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
  timestamp: Date;
}

interface PrismaLogEvent {
  message: string;
  target: string;
  timestamp: Date;
}

interface PrismaClientWithEvents {
  $on(event: "query", callback: (e: PrismaQueryEvent) => void): void;
  $on(event: "warn" | "error", callback: (e: PrismaLogEvent) => void): void;
}

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});

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
const prismaClient = prisma as PrismaClientWithEvents;

// Only enable query logging if explicitly enabled via PRISMA_LOG env var
if (process.env.PRISMA_LOG === "true") {
  prismaClient.$on("query", (e: PrismaQueryEvent) => {
    logger.debug(`prisma:query ${e.query}`, {
      duration: `${e.duration}ms`,
      params: e.params,
    });
  });

  prismaClient.$on("warn", (e: PrismaLogEvent) => {
    logger.warn(`prisma:warn ${e.message}`, { target: e.target });
  });
}

// Error logging in all environments
prismaClient.$on("error", (e: PrismaLogEvent) => {
  logger.error(`prisma:error ${e.message}`, { target: e.target });
});

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

export { prisma };
export default prisma;
