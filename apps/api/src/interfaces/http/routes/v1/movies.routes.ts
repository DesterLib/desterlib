import express, { Router } from "express";
import { moviesControllers } from "../../controllers/movies.controller";
import { validateParams } from "../../middleware";
import { getMovieByIdSchema } from "../../schemas/movies.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/movies:
 *   get:
 *     summary: Get all movies
 *     description: Retrieves a list of all movies in the library
 *     tags: [Movies]
 *     responses:
 *       '200':
 *         description: List of movies
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
 *                       title:
 *                         type: string
 *                       year:
 *                         type: integer
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", moviesControllers.getMovies);

/**
 * @swagger
 * /api/v1/movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     description: Retrieves detailed information about a specific movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^c[a-z0-9]{24,25}$'
 *         description: Movie CUID identifier
 *         example: "clx1234567890123456789012"
 *     responses:
 *       '200':
 *         description: Movie details
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
 *                     title:
 *                       type: string
 *                     year:
 *                       type: integer
 *                     media:
 *                       type: array
 *                       items:
 *                         type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id",
  validateParams(getMovieByIdSchema),
  moviesControllers.getMovieById
);

export default router;
