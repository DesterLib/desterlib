import { Request, Response } from "express";
import { libraryServices } from "./library.services";
import {
  deleteLibrarySchema,
  updateLibrarySchema,
  getLibrariesSchema,
} from "./library.schema";
import { z } from "zod";
import { sendSuccess, asyncHandler } from "@/lib/utils";

type DeleteLibraryRequest = z.infer<typeof deleteLibrarySchema>;
type UpdateLibraryRequest = z.infer<typeof updateLibrarySchema>;
type GetLibrariesRequest = z.infer<typeof getLibrariesSchema>;

export const libraryControllers = {
  /**
   * Delete a library and its associated media
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as DeleteLibraryRequest;
    const result = await libraryServices.delete(id);

    return sendSuccess(res, result, 200, result.message);
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

    const libraries = await libraryServices.getLibraries(filters);

    return sendSuccess(res, libraries);
  }),

  /**
   * Update library details
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { id, ...updateData } = req.validatedData as UpdateLibraryRequest;
    const result = await libraryServices.update(id, updateData);

    return sendSuccess(res, result, 200, result.message);
  }),
};
