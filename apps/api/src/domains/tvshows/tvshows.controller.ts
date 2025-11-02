import { Request, Response } from "express";
import { tvshowsServices } from "./tvshows.services";
import { sendSuccess, asyncHandler } from "@/lib/utils";
import { z } from "zod";
import { getTVShowByIdSchema } from "./tvshows.schema";

type GetTVShowByIdRequest = z.infer<typeof getTVShowByIdSchema>;

export const tvshowsControllers = {
  /**
   * Get all TV shows
   */
  getTVShows: asyncHandler(async (req: Request, res: Response) => {
    const tvshows = await tvshowsServices.getTVShows();
    return sendSuccess(res, tvshows);
  }),

  /**
   * Get a single TV show by ID
   */
  getTVShowById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as GetTVShowByIdRequest;
    const tvshow = await tvshowsServices.getTVShowById(id);
    return sendSuccess(res, tvshow);
  }),
};
