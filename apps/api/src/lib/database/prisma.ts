import { PrismaClient } from "@prisma/client";
import { logger } from "../utils";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

// Integrate Prisma logging with custom logger
if (process.env.NODE_ENV === "development") {
  (prisma as any).$on("query", (e: any) => {
    logger.debug(`prisma:query ${e.query}`, {
      duration: `${e.duration}ms`,
      params: e.params,
    });
  });

  (prisma as any).$on("warn", (e: any) => {
    logger.warn(`prisma:warn ${e.message}`, { target: e.target });
  });
}

(prisma as any).$on("error", (e: any) => {
  logger.error(`prisma:error ${e.message}`, { target: e.target });
});

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

export default prisma;
