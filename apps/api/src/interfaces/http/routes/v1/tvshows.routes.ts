import express, { Router } from "express";
import { tvshowsControllers } from "../../controllers/tvshows.controller";
import { validateParams } from "../../middleware";
import { getTVShowByIdSchema } from "../../schemas/tvshows.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/tvshows:
 *   get:
 *     summary: Get all TV shows
 *     description: Retrieves a list of all TV shows in the library
 *     tags: [TV Shows]
 *     responses:
 *       '200':
 *         description: List of TV shows
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
router.get("/", tvshowsControllers.getTVShows);

/**
 * @swagger
 * /api/v1/tvshows/{id}:
 *   get:
 *     summary: Get TV show by ID
 *     description: Retrieves detailed information about a specific TV show including seasons and episodes
 *     tags: [TV Shows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^c[a-z0-9]{24,25}$'
 *         description: TV show CUID identifier
 *         example: "clx1234567890123456789012"
 *     responses:
 *       '200':
 *         description: TV show details with seasons and episodes
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
 *                     seasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           seasonNumber:
 *                             type: integer
 *                           episodes:
 *                             type: array
 *                             items:
 *                               type: object
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id",
  validateParams(getTVShowByIdSchema),
  tvshowsControllers.getTVShowById
);

export default router;
