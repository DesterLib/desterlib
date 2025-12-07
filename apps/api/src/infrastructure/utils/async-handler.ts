/**
 * Async Handler Utility
 * Wraps async route handlers to automatically catch and forward errors to Express error handler
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler to automatically catch errors and pass them to Express error handler
 * @param fn Async route handler function
 * @returns Wrapped handler that catches errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

