import type { Request, Response } from "express";
import { getTVShowByIdSchema } from "../schemas/tvshows.schema";
import type { z } from "zod";
import { tvshowsService } from "../../../app/tvshows";

type GetTVShowByIdRequest = z.infer<typeof getTVShowByIdSchema>;

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

export const tvshowsControllers = {
  /**
   * Get all TV shows
   */
  getTVShows: asyncHandler(async (req: Request, res: Response) => {
    const tvshows = await tvshowsService.getTVShows();
    return sendSuccess(res, tvshows);
  }),

  /**
   * Get a single TV show by ID
   */
  getTVShowById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as GetTVShowByIdRequest;
    const tvshow = await tvshowsService.getTVShowById(id);
    return sendSuccess(res, tvshow);
  }),
};
