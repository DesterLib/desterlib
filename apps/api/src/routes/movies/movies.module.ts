import { Router, type Router as RouterType } from "express";
import { mediaController } from "../media/media.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/v1/movies:
 *   get:
 *     summary: Get all movies
 *     description: Retrieve all movies with optional filtering, sorting, and pagination
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: genreId
 *         schema:
 *           type: string
 *         description: Filter by genre ID
 *       - in: query
 *         name: personId
 *         schema:
 *           type: string
 *         description: Filter by person ID
 *       - in: query
 *         name: collectionId
 *         schema:
 *           type: string
 *         description: Filter by collection ID
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *         description: Maximum rating filter
 *       - in: query
 *         name: releasedAfter
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter movies released after this date
 *       - in: query
 *         name: releasedBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter movies released before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, releaseDate, rating, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved movies
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         media:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Media'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Bad request (invalid parameters)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", (req, res, next) => {
  mediaController.getMovies(req, res, next);
});

/**
 * @openapi
 * /api/v1/movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     description: Retrieve a specific movie by its ID
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Successfully retrieved movie
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         media:
 *                           $ref: '#/components/schemas/Media'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Media is not a movie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", (req, res, next) => {
  mediaController.getMovieById(req, res, next);
});

export default router;
