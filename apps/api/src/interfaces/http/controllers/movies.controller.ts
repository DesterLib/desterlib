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

export const moviesControllers = {
  /**
   * Get all movies
   */
  getMovies: asyncHandler(async (req: Request, res: Response) => {
    const movies = await moviesService.getMovies();
    return sendSuccess(res, movies);
  }),

  /**
   * Get a single movie by ID
   */
  getMovieById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as GetMovieByIdRequest;
    const movie = await moviesService.getMovieById(id);
    return sendSuccess(res, movie);
  }),
};
