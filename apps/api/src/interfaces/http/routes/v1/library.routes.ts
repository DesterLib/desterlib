import express, { Router } from "express";
import { libraryControllers } from "../../controllers/library.controller";
import { validateBody, validateQuery } from "../../middleware";
import {
  deleteLibrarySchema,
  updateLibrarySchema,
  getLibrariesSchema,
} from "../../schemas/library.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/library:
 *   get:
 *     summary: Get all libraries
 *     description: Retrieves a list of all libraries with optional filtering
 *     tags: [Library]
 *     parameters:
 *       - in: query
 *         name: includeMedia
 *         schema:
 *           type: boolean
 *         description: Include media files in the response
 *     responses:
 *       '200':
 *         description: List of libraries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: Update library details
 *     description: Updates the configuration and details of a library
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
 *                 description: Library CUID identifier
 *               name:
 *                 type: string
 *                 description: Library name
 *               path:
 *                 type: string
 *                 description: Library file system path
 *     responses:
 *       '200':
 *         description: Library updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: Delete a library
 *     description: Deletes a library and all its associated media files
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
 *                 description: Library CUID identifier to delete
 *     responses:
 *       '200':
 *         description: Library deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/",
  validateQuery(getLibrariesSchema),
  libraryControllers.getLibraries
);

router.put("/", validateBody(updateLibrarySchema), libraryControllers.update);

router.delete(
  "/",
  validateBody(deleteLibrarySchema),
  libraryControllers.delete
);

export default router;
