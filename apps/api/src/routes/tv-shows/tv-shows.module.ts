import { Router, type Router as RouterType } from "express";
import { mediaController } from "../media/media.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/tv-shows:
 *   get:
 *     summary: Get all TV shows
 *     description: Retrieve all TV shows with optional filtering, sorting, and pagination
 *     tags:
 *       - TV Shows
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
 *         description: Filter TV shows released after this date
 *       - in: query
 *         name: releasedBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter TV shows released before this date
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
 *         description: Successfully retrieved TV shows
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
  mediaController.getTVShows(req, res, next);
});

/**
 * @openapi
 * /api/tv-shows/{id}:
 *   get:
 *     summary: Get TV show by ID
 *     description: Retrieve a specific TV show by its ID
 *     tags:
 *       - TV Shows
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TV show ID
 *     responses:
 *       200:
 *         description: Successfully retrieved TV show
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
 *         description: TV show not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Media is not a TV show
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", (req, res, next) => {
  mediaController.getTVShowById(req, res, next);
});

/**
 * @openapi
 * /api/tv-shows/{id}/seasons/{seasonNumber}:
 *   get:
 *     summary: Get a specific season
 *     description: Retrieve a specific season of a TV show
 *     tags:
 *       - TV Shows
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TV show ID
 *       - in: path
 *         name: seasonNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season number
 *     responses:
 *       200:
 *         description: Successfully retrieved season
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
 *                         season:
 *                           $ref: '#/components/schemas/Season'
 *       404:
 *         description: Season not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id/seasons/:seasonNumber", (req, res, next) => {
  mediaController.getSeasonById(req, res, next);
});

/**
 * @openapi
 * /api/tv-shows/{id}/seasons/{seasonNumber}/episodes/{episodeNumber}:
 *   get:
 *     summary: Get a specific episode
 *     description: Retrieve a specific episode of a TV show
 *     tags:
 *       - TV Shows
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TV show ID
 *       - in: path
 *         name: seasonNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season number
 *       - in: path
 *         name: episodeNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Episode number
 *     responses:
 *       200:
 *         description: Successfully retrieved episode
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
 *                         episode:
 *                           $ref: '#/components/schemas/Episode'
 *       404:
 *         description: Episode not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id/seasons/:seasonNumber/episodes/:episodeNumber",
  (req, res, next) => {
    mediaController.getEpisodeById(req, res, next);
  }
);

export default router;
