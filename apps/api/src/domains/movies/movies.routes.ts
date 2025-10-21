import express, { Router } from "express";
import { moviesControllers } from "./movies.controller";
import { validateParams } from "../../lib/middleware";
import { getMovieByIdSchema } from "./movies.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/movies:
 *   get:
 *     summary: Get all movies
 *     description: Retrieves all movies with their associated media metadata
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of all movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "clx123abc456def789"
 *                   duration:
 *                     type: number
 *                     nullable: true
 *                     description: Movie duration in minutes
 *                     example: 142
 *                   trailerUrl:
 *                     type: string
 *                     nullable: true
 *                     example: "https://youtube.com/watch?v=xyz"
 *                   filePath:
 *                     type: string
 *                     nullable: true
 *                     example: "/media/movies/Movie Title (2024).mkv"
 *                   fileSize:
 *                     type: string
 *                     nullable: true
 *                     description: File size in bytes
 *                     example: "5368709120"
 *                   fileModifiedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   mediaId:
 *                     type: string
 *                     example: "clx987zyx654wvu321"
 *                   media:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                         example: "The Matrix"
 *                       type:
 *                         type: string
 *                         enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                         example: MOVIE
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       posterUrl:
 *                         type: string
 *                         nullable: true
 *                       backdropUrl:
 *                         type: string
 *                         nullable: true
 *                       releaseDate:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       rating:
 *                         type: number
 *                         nullable: true
 *                         example: 8.7
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
 *                   example: "Failed to fetch movies"
 */
router.get("/", moviesControllers.getMovies);

/**
 * @swagger
 * /api/v1/movies/{id}:
 *   get:
 *     summary: Get a movie by ID
 *     description: Retrieves a single movie with its associated media metadata
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The movie ID
 *         example: "clx123abc456def789"
 *     responses:
 *       200:
 *         description: Movie details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clx123abc456def789"
 *                 duration:
 *                   type: number
 *                   nullable: true
 *                   description: Movie duration in minutes
 *                   example: 142
 *                 trailerUrl:
 *                   type: string
 *                   nullable: true
 *                   example: "https://youtube.com/watch?v=xyz"
 *                 filePath:
 *                   type: string
 *                   nullable: true
 *                   example: "/media/movies/Movie Title (2024).mkv"
 *                 fileSize:
 *                   type: string
 *                   nullable: true
 *                   description: File size in bytes
 *                   example: "5368709120"
 *                 fileModifiedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 streamUrl:
 *                   type: string
 *                   description: URL to stream the movie
 *                   example: "/api/v1/stream/clx123abc456def789"
 *                 mediaId:
 *                   type: string
 *                   example: "clx987zyx654wvu321"
 *                 media:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                       example: "The Matrix"
 *                     type:
 *                       type: string
 *                       enum: [MOVIE, TV_SHOW, MUSIC, COMIC]
 *                       example: MOVIE
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     posterUrl:
 *                       type: string
 *                       nullable: true
 *                     backdropUrl:
 *                       type: string
 *                       nullable: true
 *                     releaseDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     rating:
 *                       type: number
 *                       nullable: true
 *                       example: 8.7
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Movie ID is required
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
 *                   example: "Movie ID is required"
 *       404:
 *         description: Movie not found
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
 *                   example: "Movie with ID clx123abc456def789 not found"
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
 *                   example: "Failed to fetch movie"
 */
router.get(
  "/:id",
  validateParams(getMovieByIdSchema),
  moviesControllers.getMovieById
);

export default router;
