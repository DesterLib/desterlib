import express, { Router } from "express";
import { imageControllers } from "../../controllers/image.controller";
import { validateParams, validateQuery } from "../../middleware";
import { getImageSchema } from "../../schemas/image.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/image/{path}:
 *   get:
 *     summary: Get image by path
 *     description: Retrieves an image file from the metadata directory by its path. Supports caching headers for optimal performance.
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Image path relative to metadata directory (e.g., movies/posters/tmdb12345.jpg)
 *         example: "movies/posters/tmdb12345.jpg"
 *     responses:
 *       '200':
 *         description: Image file content
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type of the image (e.g., image/jpeg, image/png)
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Size of the image in bytes
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: Cache control directive (public, max-age=31536000, immutable)
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *             description: Acceptable range units (bytes)
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:path(*)", imageControllers.getImage);

export default router;
