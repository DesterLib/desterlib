import express, { Router } from "express";
import { searchControllers } from "./search.controller";
import { validateQuery } from "../../lib/middleware";
import { searchMediaSchema } from "./search.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Search media by title
 *     description: |
 *       Searches for movies and TV shows by title (case-insensitive).
 *       Returns matching movies and TV shows with their media metadata.
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
 *         example: "matrix"
 *     responses:
 *       200:
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
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "clx123abc456def789"
 *                           duration:
 *                             type: number
 *                             nullable: true
 *                             example: 142
 *                           trailerUrl:
 *                             type: string
 *                             nullable: true
 *                           filePath:
 *                             type: string
 *                             nullable: true
 *                           fileSize:
 *                             type: string
 *                             nullable: true
 *                           fileModifiedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           mediaId:
 *                             type: string
 *                           media:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                                 example: "The Matrix"
 *                               type:
 *                                 type: string
 *                                 enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                                 example: MOVIE
 *                               description:
 *                                 type: string
 *                                 nullable: true
 *                               posterUrl:
 *                                 type: string
 *                                 nullable: true
 *                               backdropUrl:
 *                                 type: string
 *                                 nullable: true
 *                               releaseDate:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                               rating:
 *                                 type: number
 *                                 nullable: true
 *                                 example: 8.7
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                     tvShows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "clx123abc456def789"
 *                           creator:
 *                             type: string
 *                             nullable: true
 *                           network:
 *                             type: string
 *                             nullable: true
 *                           mediaId:
 *                             type: string
 *                           media:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                                 example: "Breaking Bad"
 *                               type:
 *                                 type: string
 *                                 enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                                 example: TV_SHOW
 *                               description:
 *                                 type: string
 *                                 nullable: true
 *                               posterUrl:
 *                                 type: string
 *                                 nullable: true
 *                               backdropUrl:
 *                                 type: string
 *                                 nullable: true
 *                               releaseDate:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                               rating:
 *                                 type: number
 *                                 nullable: true
 *                                 example: 9.5
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *       400:
 *         description: Bad request - Invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 message:
 *                   type: string
 *                   example: "Search query must be at least 1 character"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to search media"
 */
router.get("/", validateQuery(searchMediaSchema), searchControllers.searchMedia);

export default router;

