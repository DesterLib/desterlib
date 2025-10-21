import { Request, Response } from "express";
import { libraryServices } from "./library.services";
import {
  deleteLibrarySchema,
  updateLibrarySchema,
  getLibrariesSchema,
} from "./library.schema";
import { z } from "zod";
import { logger } from "@/lib/utils";

type DeleteLibraryRequest = z.infer<typeof deleteLibrarySchema>;
type UpdateLibraryRequest = z.infer<typeof updateLibrarySchema>;
type GetLibrariesRequest = z.infer<typeof getLibrariesSchema>;

export const libraryControllers = {
  delete: async (req: Request, res: Response) => {
    try {
      const validatedData = req.validatedData as DeleteLibraryRequest;

      if (!validatedData) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Request data is missing or invalid",
        });
      }

      const { id } = validatedData;

      // Call the deletion service
      const result = await libraryServices.delete(id);

      return res.status(200).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete library";
      logger.error(`Delete library controller error: ${errorMessage}`);

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

  getLibraries: async (req: Request, res: Response) => {
    try {
      const validatedData = req.validatedData as GetLibrariesRequest;

      if (!validatedData) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Request data is missing or invalid",
        });
      }

      const { isLibrary, libraryType } = validatedData;

      const filters: { isLibrary?: boolean; libraryType?: string } = {};
      if (isLibrary !== undefined) {
        filters.isLibrary = isLibrary;
      }
      if (libraryType) {
        filters.libraryType = libraryType;
      }

      const libraries = await libraryServices.getLibraries(filters);

      return res.status(200).json(libraries);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch libraries";
      logger.error(`Get libraries controller error: ${errorMessage}`);

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validatedData = req.validatedData as UpdateLibraryRequest;

      if (!validatedData) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Request data is missing or invalid",
        });
      }

      const { id, ...updateData } = validatedData;

      // Call the update service
      const result = await libraryServices.update(id, updateData);

      return res.status(200).json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update library";
      logger.error(`Update library controller error: ${errorMessage}`);

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
