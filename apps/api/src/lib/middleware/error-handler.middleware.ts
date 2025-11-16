import express from "express";
import { config } from "../../core/config/env";
import { logger, ApiError, ValidationError } from "../utils";

// 404 handler
export const notFoundHandler = (
  req: express.Request,
  res: express.Response,
) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  // Handle custom API errors
  if (error instanceof ApiError) {
    logger.error(`API Error: ${error.message}`, {
      statusCode: error.statusCode,
      errorType: error.errorType,
      path: req.path,
      method: req.method,
    });

    const response: {
      success: false;
      error: string;
      message: string;
      details?: unknown[];
      stack?: string;
    } = {
      success: false,
      error: error.errorType,
      message: error.message,
    };

    // Include validation details if available
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    // Include stack trace in development
    if (config.nodeEnv !== "production") {
      response.stack = error.stack;
    }

    return res.status(error.statusCode).json(response);
  }

  // Handle unexpected errors
  logger.error(`Unhandled error: ${error.message}`, {
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      config.nodeEnv === "production"
        ? "An unexpected error occurred"
        : error.message,
    ...(config.nodeEnv !== "production" && { stack: error.stack }),
  });
};

// Setup all error handling
export function setupErrorHandling(app: express.Application) {
  // 404 handler (must be after all routes)
  app.use("*", notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);
}
