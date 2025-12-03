import type { Request, Response } from "express";
import { getMovieByIdSchema } from "../schemas/movies.schema";
import type { z } from "zod";
import { moviesService } from "../../../app/movies";

type GetMovieByIdRequest = z.infer<typeof getMovieByIdSchema>;

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

export const moviesControllers = {
  /**
   * Get all movies
   */
  getMovies: asyncHandler(async (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const movies = await moviesService.getMovies(baseUrl);
    return sendSuccess(res, movies);
  }),

  /**
   * Get a single movie by ID
   */
  getMovieById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as GetMovieByIdRequest;
    const baseUrl = getBaseUrl(req);
    const movie = await moviesService.getMovieById(id, baseUrl);
    return sendSuccess(res, movie);
  }),
};
