import express, { Router } from "express";
import { tvshowsControllers } from "./tvshows.controller";
import { validateParams } from "../../lib/middleware";
import { getTVShowByIdSchema } from "./tvshows.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/tvshows:
 *   get:
 *     summary: Get all TV shows
 *     description: Retrieves all TV shows with their associated media metadata
 *     tags: [TV Shows]
 *     responses:
 *       200:
 *         description: List of all TV shows
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "clx123abc456def789"
 *                       creator:
 *                         type: string
 *                         nullable: true
 *                         description: Creator of the TV show
 *                         example: "Vince Gilligan"
 *                       network:
 *                         type: string
 *                         nullable: true
 *                         description: Network that aired the TV show
 *                         example: "AMC"
 *                       mediaId:
 *                         type: string
 *                         example: "clx987zyx654wvu321"
 *                       media:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                             example: "Breaking Bad"
 *                           type:
 *                             type: string
 *                             enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                             example: TV_SHOW
 *                           description:
 *                             type: string
 *                             nullable: true
 *                           posterUrl:
 *                             type: string
 *                             nullable: true
 *                           backdropUrl:
 *                             type: string
 *                             nullable: true
 *                           meshGradientColors:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Hex color strings for mesh gradient (4 corners)
 *                             example: ["#7C3AED", "#2563EB", "#EC4899", "#8B5CF6"]
 *                           releaseDate:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             example: 9.5
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
 *                   example: "Failed to fetch TV shows"
 */
router.get("/", tvshowsControllers.getTVShows);

/**
 * @swagger
 * /api/v1/tvshows/{id}:
 *   get:
 *     summary: Get a TV show by ID
 *     description: Retrieves a single TV show with its associated media metadata
 *     tags: [TV Shows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The TV show ID
 *         example: "clx123abc456def789"
 *     responses:
 *       200:
 *         description: TV show details
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
 *                     id:
 *                       type: string
 *                       example: "clx123abc456def789"
 *                     creator:
 *                       type: string
 *                       nullable: true
 *                       description: Creator of the TV show
 *                       example: "Vince Gilligan"
 *                     network:
 *                       type: string
 *                       nullable: true
 *                       description: Network that aired the TV show
 *                       example: "AMC"
 *                     mediaId:
 *                       type: string
 *                       example: "clx987zyx654wvu321"
 *                     media:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                           example: "Breaking Bad"
 *                         type:
 *                           type: string
 *                           enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                           example: TV_SHOW
 *                         description:
 *                           type: string
 *                           nullable: true
 *                         posterUrl:
 *                           type: string
 *                           nullable: true
 *                         backdropUrl:
 *                           type: string
 *                           nullable: true
 *                         meshGradientColors:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Hex color strings for mesh gradient (4 corners)
 *                           example: ["#7C3AED", "#2563EB", "#EC4899", "#8B5CF6"]
 *                         releaseDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         rating:
 *                           type: number
 *                           nullable: true
 *                           example: 9.5
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     seasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           seasonNumber:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             nullable: true
 *                             example: "Season 1"
 *                           overview:
 *                             type: string
 *                             nullable: true
 *                           airDate:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           posterUrl:
 *                             type: string
 *                             nullable: true
 *                           tvShowId:
 *                             type: string
 *                           episodes:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 episodeNumber:
 *                                   type: integer
 *                                   example: 1
 *                                 seasonNumber:
 *                                   type: integer
 *                                   example: 1
 *                                 title:
 *                                   type: string
 *                                   example: "Pilot"
 *                                 overview:
 *                                   type: string
 *                                   nullable: true
 *                                 airDate:
 *                                   type: string
 *                                   format: date-time
 *                                   nullable: true
 *                                 runtime:
 *                                   type: integer
 *                                   nullable: true
 *                                   example: 45
 *                                 stillUrl:
 *                                   type: string
 *                                   nullable: true
 *                                 filePath:
 *                                   type: string
 *                                   nullable: true
 *                                 fileSize:
 *                                   type: string
 *                                   nullable: true
 *                                 seasonId:
 *                                   type: string
 *                                 streamUrl:
 *                                   type: string
 *                                   example: "/api/v1/stream/clx123"
 *       400:
 *         description: Bad request - TV show ID is required
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
 *                   example: "TV Show ID is required"
 *       404:
 *         description: TV show not found
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
 *                   example: "Not found"
 *                 message:
 *                   type: string
 *                   example: "TV Show with identifier 'clx123abc456def789' not found"
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
 *                   example: "Failed to fetch TV show"
 */
router.get(
  "/:id",
  validateParams(getTVShowByIdSchema),
  tvshowsControllers.getTVShowById
);

export default router;
