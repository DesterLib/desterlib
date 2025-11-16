import { Request, Response } from "express";
import { searchServices } from "./search.services";
import { sendSuccess, asyncHandler } from "../../lib/utils";
import { z } from "zod";
import { searchMediaSchema } from "./search.schema";

type SearchMediaQuery = z.infer<typeof searchMediaSchema>;

export const searchControllers = {
  /**
   * Search for media by title
   */
  searchMedia: asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.validatedData as SearchMediaQuery;
    const results = await searchServices.searchMedia(query);
    return sendSuccess(res, results);
  }),
};
