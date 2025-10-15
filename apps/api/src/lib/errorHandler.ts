import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errors.js";
import logger from "../config/logger.js";

type ErrorEnvelope = {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

function getRequestId(res: Response): string {
  const requestIdHeader = res.getHeader("x-request-id");
  return String(
    (Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader) ??
      "unknown"
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  const payload: ErrorEnvelope = {
    success: false,
    requestId: getRequestId(res),
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.path}`,
    },
  };
  res.status(404).json(payload);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const payload: ErrorEnvelope = {
      success: false,
      requestId: getRequestId(res),
      error: {
        code: err.code,
        message: err.expose ? err.message : "Internal Server Error",
        details: err.expose
          ? (err.extra as Record<string, unknown> | undefined)
          : undefined,
      },
    };
    if (err.statusCode >= 500) {
      // Log server errors with stack for operators
      logger.error(`AppError [${err.code}]: ${err.message}`, {
        statusCode: err.statusCode,
        stack: err.stack,
        extra: err.extra,
        requestId: getRequestId(res),
      });
    }
    res.status(err.statusCode).json(payload);
    return;
  }

  // Unknown errors
  logger.error(
    "Unhandled error:",
    err instanceof Error ? err : new Error(String(err))
  );
  const payload: ErrorEnvelope = {
    success: false,
    requestId: getRequestId(res),
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal Server Error",
    },
  };
  res.status(500).json(payload);
}
