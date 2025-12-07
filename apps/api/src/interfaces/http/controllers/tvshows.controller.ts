import type { Request, Response } from "express";
import { getTVShowByIdSchema } from "../schemas/tvshows.schema";
import type { z } from "zod";
import { tvshowsService } from "../../../app/tvshows";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess, getBaseUrl } from "../utils/response.helpers";

type GetTVShowByIdRequest = z.infer<typeof getTVShowByIdSchema>;

export const tvshowsControllers = {
  /**
   * Get all TV shows
   */
  getTVShows: asyncHandler(async (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const tvshows = await tvshowsService.getTVShows(baseUrl);
    return sendSuccess(res, tvshows);
  }),

  /**
   * Get a single TV show by ID
   */
  getTVShowById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as GetTVShowByIdRequest;
    const baseUrl = getBaseUrl(req);
    const tvshow = await tvshowsService.getTVShowById(id, baseUrl);
    return sendSuccess(res, tvshow);
  }),
};
