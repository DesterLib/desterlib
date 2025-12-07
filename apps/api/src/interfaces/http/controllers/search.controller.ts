import type { Request, Response } from "express";
import { searchService } from "../../../app/search";
import type { z } from "zod";
import { searchMediaSchema } from "../schemas/search.schema";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess, getBaseUrl } from "../utils/response.helpers";

type SearchMediaQuery = z.infer<typeof searchMediaSchema>;

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
