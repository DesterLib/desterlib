import type { Request, Response } from "express";
import {
  deleteLibrarySchema,
  updateLibrarySchema,
  getLibrariesSchema,
} from "../schemas/library.schema";
import type { z } from "zod";
import { libraryService } from "../../../app/library";

type DeleteLibraryRequest = z.infer<typeof deleteLibrarySchema>;
type UpdateLibraryRequest = z.infer<typeof updateLibrarySchema>;
type GetLibrariesRequest = z.infer<typeof getLibrariesSchema>;

/**
 * Async handler wrapper for error handling
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: any) => Promise<any>
) {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send success response
 */
function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: {
    success: true;
    data: T;
    message?: string;
  } = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

export const libraryControllers = {
  /**
   * Delete a library and its associated media
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as DeleteLibraryRequest;
    const result = await libraryService.delete(id);

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

    const libraries = await libraryService.getLibraries(filters);

    return sendSuccess(res, libraries);
  }),

  /**
   * Update library details
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { id, ...updateData } = req.validatedData as UpdateLibraryRequest;
    const result = await libraryService.update(id, updateData);

    return sendSuccess(res, result, 200, result.message);
  }),
};
