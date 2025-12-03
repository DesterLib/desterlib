import type { Request, Response } from "express";
import { searchService } from "../../../app/search";
import type { z } from "zod";
import { searchMediaSchema } from "../schemas/search.schema";

type SearchMediaQuery = z.infer<typeof searchMediaSchema>;

/**
 * Async handler wrapper for error handling
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: any) => Promise<any>
) {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send success response
 */
function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: {
    success: true;
    data: T;
    message?: string;
  } = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Get base URL from request
 */
function getBaseUrl(req: Request): string {
  const protocol = req.protocol;
  const host = req.get("host") || "localhost:3001";
  return `${protocol}://${host}`;
}

export const searchControllers = {
  /**
   * Search for media by title
   */
  searchMedia: asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.validatedData as SearchMediaQuery;
    const baseUrl = getBaseUrl(req);
    const results = await searchService.searchMedia(query, baseUrl);
    return sendSuccess(res, results);
  }),
};
