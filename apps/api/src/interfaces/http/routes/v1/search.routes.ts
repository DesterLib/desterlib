import express, { Router } from "express";
import { searchControllers } from "../../controllers/search.controller";
import { validateQuery } from "../../middleware";
import { searchMediaSchema } from "../../schemas/search.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Search for media by title
 *     description: Searches for movies and TV shows by title across the library
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query string
 *         example: "The Matrix"
 *     responses:
 *       '200':
 *         description: Search results
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
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         type: object
 *                     tvShows:
 *                       type: array
 *                       items:
 *                         type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/",
  validateQuery(searchMediaSchema),
  searchControllers.searchMedia
);

export default router;
