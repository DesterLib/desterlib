/**
 * Structured Logging Utilities
 *
 * Provides context-aware logging helpers for better observability.
 */

import logger from "../config/logger.js";
import type { Request, Response } from "express";

/**
 * Extract request context for logging
 */
export function getRequestContext(req: Request) {
  return {
    requestId: req.context?.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };
}

/**
 * Log API request with context
 */
export function logRequest(
  req: Request,
  additionalContext?: Record<string, unknown>
) {
  logger.info("API Request", {
    ...getRequestContext(req),
    ...additionalContext,
  });
}

/**
 * Log API response with context
 */
export function logResponse(
  req: Request,
  res: Response,
  additionalContext?: Record<string, unknown>
) {
  const duration = Date.now() - (req.context?.startTimeMs ?? Date.now());

  logger.info("API Response", {
    ...getRequestContext(req),
    statusCode: res.statusCode,
    durationMs: duration,
    ...additionalContext,
  });
}

/**
 * Log error with full context
 */
export function logError(
  error: Error | unknown,
  req?: Request,
  additionalContext?: Record<string, unknown>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  logger.error("Error occurred", {
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    },
    ...(req ? getRequestContext(req) : {}),
    ...additionalContext,
  });
}

/**
 * Log database query (for debugging)
 */
export function logQuery(
  model: string,
  operation: string,
  duration?: number,
  additionalContext?: Record<string, unknown>
) {
  logger.debug("Database Query", {
    model,
    operation,
    durationMs: duration,
    ...additionalContext,
  });
}

/**
 * Log external API call
 */
export function logExternalCall(
  service: string,
  endpoint: string,
  method: string,
  status?: number,
  duration?: number,
  additionalContext?: Record<string, unknown>
) {
  logger.info("External API Call", {
    service,
    endpoint,
    method,
    status,
    durationMs: duration,
    ...additionalContext,
  });
}

/**
 * Log business event (e.g., media scanned, collection created)
 */
export function logEvent(
  eventName: string,
  eventData?: Record<string, unknown>
) {
  logger.info("Event", {
    eventName,
    ...eventData,
  });
}
