import express, { Router } from "express";
import { libraryControllers } from "./library.controller";
import { validateBody, validateQuery } from "../../lib/middleware";
import {
  deleteLibrarySchema,
  updateLibrarySchema,
  getLibrariesSchema,
} from "./library.schema";

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
/**
 * @swagger
 * /api/v1/library:
 *   get:
 *     summary: Get all libraries with optional filtering
 *     description: |
 *       Retrieves a list of libraries with optional filtering by:
 *       - isLibrary: Filter by actual libraries vs collections
 *       - libraryType: Filter by media type (MOVIE, TV_SHOW, MUSIC, COMIC)
 *     tags: [Library]
 *     parameters:
 *       - in: query
 *         name: isLibrary
 *         schema:
 *           type: boolean
 *         description: Filter by actual libraries (true) vs collections (false)
 *         example: true
 *       - in: query
 *         name: libraryType
 *         schema:
 *           type: string
 *           enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *         description: Filter by library media type
 *         example: MOVIE
 *     responses:
 *       200:
 *         description: List of libraries with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Library'
 */
router.get(
  "/",
  validateQuery(getLibrariesSchema),
  libraryControllers.getLibraries
);

/**
 * @swagger
 * /api/v1/library:
 *   put:
 *     summary: Update library details
 *     description: |
 *       Updates library metadata including name, description, URLs, and settings.
 *       Empty string values for optional fields will be set to null.
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
 *                 description: The ID of the library to update
 *                 example: "clx123abc456def789"
 *               name:
 *                 type: string
 *                 description: Updated library name
 *                 example: "My Updated Anime Library"
 *               description:
 *                 type: string
 *                 description: Updated library description
 *                 example: "A curated collection of anime shows and movies"
 *               posterUrl:
 *                 type: string
 *                 format: url
 *                 description: Updated poster image URL
 *                 example: "https://example.com/poster.jpg"
 *               backdropUrl:
 *                 type: string
 *                 format: url
 *                 description: Updated backdrop image URL
 *                 example: "https://example.com/backdrop.jpg"
 *               libraryPath:
 *                 type: string
 *                 description: Updated file system path
 *                 example: "/media/anime"
 *               libraryType:
 *                 type: string
 *                 enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                 description: Updated library media type
 *                 example: TV_SHOW
 *     responses:
 *       200:
 *         description: Library successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 library:
 *                   $ref: '#/components/schemas/Library'
 *                 message:
 *                   type: string
 *                   example: "Successfully updated library \"My Updated Anime Library\""
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
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
 */
router.put("/", validateBody(updateLibrarySchema), libraryControllers.update);

router.delete(
  "/",
  validateBody(deleteLibrarySchema),
  libraryControllers.delete
);

export default router;
