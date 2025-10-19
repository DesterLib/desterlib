import { Request, Response } from "express";
import { moviesServices } from "./movies.services";
import { logger } from "@/lib/utils";
import { z } from "zod";
import { getMovieByIdSchema } from "./movies.schema";

type GetMovieByIdRequest = z.infer<typeof getMovieByIdSchema>;

export const moviesControllers = {
  getMovies: async (req: Request, res: Response) => {
    try {
      const movies = await moviesServices.getMovies();
      return res.status(200).json(movies);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch movies";
      logger.error(`Get movies controller error: ${errorMessage}`);

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },

  getMovieById: async (req: Request, res: Response) => {
    try {
      const validatedParams = req.validatedData as GetMovieByIdRequest;

      if (!validatedParams) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Movie ID is required",
        });
      }

      const { id } = validatedParams;

      const movie = await moviesServices.getMovieById(id);
      return res.status(200).json(movie);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch movie";
      logger.error(`Get movie by ID controller error: ${errorMessage}`);

      // Check if it's a "not found" error
      if (errorMessage.includes("not found")) {
        return res.status(404).json({
          error: "Not found",
          message: errorMessage,
        });
      }

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },
};
