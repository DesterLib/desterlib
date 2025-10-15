import { Router, type Router as RouterType } from "express";
import { mediaController } from "./media.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/v1/media:
 *   get:
 *     summary: Get all media
 *     description: Retrieve all media items with optional filtering, sorting, and pagination
 *     tags:
 *       - Media
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/MediaType'
 *         description: Filter by media type
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
 *         description: Filter media released after this date
 *       - in: query
 *         name: releasedBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter media released before this date
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
 *         description: Successfully retrieved media
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
  mediaController.getMedia(req, res, next);
});

/**
 * @openapi
 * /api/v1/media/statistics:
 *   get:
 *     summary: Get media statistics
 *     description: Retrieve statistics about media in the library
 *     tags:
 *       - Media
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics
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
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             byType:
 *                               type: object
 *                               properties:
 *                                 movies:
 *                                   type: integer
 *                                 tvShows:
 *                                   type: integer
 *                                 music:
 *                                   type: integer
 *                                 comics:
 *                                   type: integer
 */
router.get("/statistics", (req, res, next) => {
  mediaController.getStatistics(req, res, next);
});

/**
 * @openapi
 * /api/v1/media/{id}:
 *   get:
 *     summary: Get media by ID
 *     description: Retrieve a specific media item by its ID
 *     tags:
 *       - Media
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Successfully retrieved media
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
 *         description: Media not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", (req, res, next) => {
  mediaController.getMediaById(req, res, next);
});

/**
 * @openapi
 * /api/v1/media/stream/movie/{id}:
 *   get:
 *     summary: Stream a movie
 *     description: Stream a movie file with byte-range support for seeking
 *     tags:
 *       - Media Streaming
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *       - in: header
 *         name: Range
 *         schema:
 *           type: string
 *         description: Byte range (e.g., bytes=0-1048575)
 *     responses:
 *       200:
 *         description: Full movie file
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial content (byte range)
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Movie or file not found
 */
router.get("/stream/movie/:id", (req, res, next) => {
  mediaController.streamMovie(req, res, next);
});

/**
 * @openapi
 * /api/v1/media/stream/episode/{id}/{seasonNumber}/{episodeNumber}:
 *   get:
 *     summary: Stream a TV episode
 *     description: Stream a TV episode file with byte-range support for seeking
 *     tags:
 *       - Media Streaming
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
 *       - in: header
 *         name: Range
 *         schema:
 *           type: string
 *         description: Byte range (e.g., bytes=0-1048575)
 *     responses:
 *       200:
 *         description: Full episode file
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial content (byte range)
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Episode or file not found
 */
router.get(
  "/stream/episode/:id/:seasonNumber/:episodeNumber",
  (req, res, next) => {
    mediaController.streamEpisode(req, res, next);
  }
);

export default router;
