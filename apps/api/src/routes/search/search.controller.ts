import type { Request, Response, NextFunction } from "express";
import { searchService } from "./search.service.js";
import { BadRequestError, AppError } from "../../lib/errors.js";

export class SearchController {
  /**
   * GET /api/search
   * Search across all content
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, type } = req.query;

      if (!q || typeof q !== "string") {
        throw new BadRequestError("Search query 'q' is required");
      }

      let results;

      switch (type) {
        case "media":
          const media = await searchService.searchMedia(q);
          results = { media, total: media.length };
          break;
        case "collections":
          const collections = await searchService.searchCollections(q);
          results = { collections, total: collections.length };
          break;
        default:
          results = await searchService.searchAll(q);
      }

      res.jsonOk({
        message: `Found ${results.total} results for "${q}"`,
        query: q,
        ...results,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to perform search", { cause: error }));
      }
    }
  }
}

// Export singleton instance
export const searchController = new SearchController();
