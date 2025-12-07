import type { Request, Response } from "express";
import { getMovieByIdSchema } from "../schemas/movies.schema";
import type { z } from "zod";
import { moviesService } from "../../../app/movies";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess, getBaseUrl } from "../utils/response.helpers";

type GetMovieByIdRequest = z.infer<typeof getMovieByIdSchema>;

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
