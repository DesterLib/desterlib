import type { Request, Response } from "express";
import {
  deleteLibrarySchema,
  updateLibrarySchema,
  getLibrariesSchema,
} from "../schemas/library.schema";
import type { z } from "zod";
import { libraryService } from "../../../app/library";
import { serializeBigInt } from "../../../infrastructure/utils/serialization";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess, getBaseUrl } from "../utils/response.helpers";

type DeleteLibraryRequest = z.infer<typeof deleteLibrarySchema>;
type UpdateLibraryRequest = z.infer<typeof updateLibrarySchema>;
type GetLibrariesRequest = z.infer<typeof getLibrariesSchema>;

export const libraryControllers = {
  /**
   * Delete a library and its associated media
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Library ID is required",
      });
    }

    const result = await libraryService.delete(id);
    const baseUrl = getBaseUrl(req);
    const serialized = serializeBigInt(result, baseUrl);

    return sendSuccess(res, serialized, 200, result.message);
  }),

  /**
   * Get all libraries with optional filtering
   */
  getLibraries: asyncHandler(async (req: Request, res: Response) => {
    const { isLibrary, libraryType } = req.validatedData as GetLibrariesRequest;

    const filters: { isLibrary?: boolean; libraryType?: string } = {};
    if (isLibrary !== undefined) {
      filters.isLibrary = isLibrary;
    }
    if (libraryType) {
      filters.libraryType = libraryType;
    }

    const libraries = await libraryService.getLibraries(filters);
    const baseUrl = getBaseUrl(req);
    const serialized = serializeBigInt(libraries, baseUrl);

    return sendSuccess(res, serialized);
  }),

  /**
   * Update library details
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { id, ...updateData } = req.validatedData as UpdateLibraryRequest;
    const result = await libraryService.update(id, updateData);
    const baseUrl = getBaseUrl(req);
    const serialized = serializeBigInt(result, baseUrl);

    return sendSuccess(res, serialized, 200, result.message);
  }),
};
