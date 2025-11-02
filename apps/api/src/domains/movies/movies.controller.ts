import { Request, Response } from "express";
import { moviesServices } from "./movies.services";
import { sendSuccess, asyncHandler } from "@/lib/utils";
import { z } from "zod";
import { getMovieByIdSchema } from "./movies.schema";

type GetMovieByIdRequest = z.infer<typeof getMovieByIdSchema>;

export const moviesControllers = {
  /**
   * Get all movies
   */
  getMovies: asyncHandler(async (req: Request, res: Response) => {
    const movies = await moviesServices.getMovies();
    return sendSuccess(res, movies);
  }),

  /**
   * Get a single movie by ID
   */
  getMovieById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as GetMovieByIdRequest;
    const movie = await moviesServices.getMovieById(id);
    return sendSuccess(res, movie);
  }),
};
