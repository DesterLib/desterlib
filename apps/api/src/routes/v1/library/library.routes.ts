import express, { Router } from "express";
import { libraryControllers } from "./library.controller";
import { validateBody } from "../../../lib/middleware";
import { deleteLibrarySchema } from "./library.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/library:
 *   delete:
 *     summary: Delete a library and its associated media
 *     description: |
 *       Deletes a library:
 *       - Removes the library structure and metadata from the database
 *       - Deletes all media entries that ONLY belong to this library
 *       - Keeps media that also belongs to other libraries
 *       - Does NOT delete actual files on disk (prevents accidental data loss)
 *       - Cascade deletes related data (genres, persons, external IDs, etc.)
 *     tags: [Library]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the library to delete
 *                 example: "clx123abc456def789"
 *     responses:
 *       200:
 *         description: Library successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 libraryId:
 *                   type: string
 *                   example: "clx123abc456def789"
 *                 libraryName:
 *                   type: string
 *                   example: "My Anime Library"
 *                 mediaDeleted:
 *                   type: number
 *                   description: Number of media entries that were deleted (only those belonging exclusively to this library)
 *                   example: 42
 *                 message:
 *                   type: string
 *                   example: "Successfully deleted library \"My Anime Library\" and 42 associated media entries"
 *       400:
 *         description: Bad request - Invalid library ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 message:
 *                   type: string
 *                   example: "Library ID is required"
 *       404:
 *         description: Library not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not found"
 *                 message:
 *                   type: string
 *                   example: "Library with ID clx123abc456def789 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to delete library"
 */
router.delete(
  "/",
  validateBody(deleteLibrarySchema),
  libraryControllers.delete
);

export default router;
