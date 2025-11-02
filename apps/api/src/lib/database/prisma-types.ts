/**
 * Prisma event types for logging
 */

export interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

export interface PrismaLogEvent {
  message: string;
  target: string;
}

export interface PrismaErrorEvent {
  message: string;
  target: string;
}

