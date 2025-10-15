/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to catch errors and pass them to Express error middleware.
 * Eliminates the need for try-catch blocks in every controller method.
 *
 * Usage:
 *   import { asyncHandler } from '../lib/asyncHandler.js';
 *
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await userService.getAll();
 *     res.jsonOk({ users });
 *   }));
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps an async function to catch any thrown errors and pass them to next()
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
