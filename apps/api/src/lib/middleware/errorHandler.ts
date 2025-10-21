import express from "express";
import { config } from "../../core/config/env";
import { logger } from "../utils";

// 404 handler
export const notFoundHandler = (
  req: express.Request,
  res: express.Response
) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  logger.error(`Unhandled error: ${error.message}`, { stack: error.stack });
  res.status(500).json({
    error:
      config.nodeEnv === "production" ? "Internal server error" : error.message,
  });
};

// Setup all error handling
export function setupErrorHandling(app: express.Application) {
  // 404 handler (must be after all routes)
  app.use("*", notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);
}
