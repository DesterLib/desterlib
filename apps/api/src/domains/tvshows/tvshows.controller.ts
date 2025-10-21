import { Request, Response } from "express";
import { tvshowsServices } from "./tvshows.services";
import { logger } from "@/lib/utils";
import { z } from "zod";
import { getTVShowByIdSchema } from "./tvshows.schema";

type GetTVShowByIdRequest = z.infer<typeof getTVShowByIdSchema>;

export const tvshowsControllers = {
  getTVShows: async (req: Request, res: Response) => {
    try {
      const tvshows = await tvshowsServices.getTVShows();
      return res.status(200).json(tvshows);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch TV shows";
      logger.error(`Get TV shows controller error: ${errorMessage}`);

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },

  getTVShowById: async (req: Request, res: Response) => {
    try {
      const validatedParams = req.validatedData as GetTVShowByIdRequest;

      if (!validatedParams) {
        return res.status(400).json({
          error: "Validation failed",
          message: "TV Show ID is required",
        });
      }

      const { id } = validatedParams;

      const tvshow = await tvshowsServices.getTVShowById(id);
      return res.status(200).json(tvshow);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch TV show";
      logger.error(`Get TV show by ID controller error: ${errorMessage}`);

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
