import express, { Router } from "express";
import { streamControllers } from "../../controllers/stream.controller";
import { validateParams } from "../../middleware";
import { streamMediaSchema } from "../../schemas/stream.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/stream/{id}:
 *   get:
 *     summary: Stream media file by ID
 *     description: Streams a media file (movie, TV show episode, etc.) by its ID with support for HTTP range requests (byte-range) for video streaming
 *     tags: [Stream]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^c[a-z0-9]{24,25}$'
 *         description: Media file CUID identifier
 *         example: "clx1234567890123456789012"
 *     responses:
 *       '200':
 *         description: Full file content (when no Range header is provided)
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type of the media file
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Size of the file in bytes
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *             description: Acceptable range units (bytes)
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: Cache control directive
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: Filename for download
 *       '206':
 *         description: Partial content (when Range header is provided)
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Range:
 *             schema:
 *               type: string
 *             description: Range of bytes returned (e.g., "bytes 0-1023/2048")
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Size of the requested range in bytes
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '416':
 *         description: Range Not Satisfiable
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
 *                   example: "Range Not Satisfiable"
 *                 message:
 *                   type: string
 *                   example: "Requested range not satisfiable"
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id",
  validateParams(streamMediaSchema),
  streamControllers.streamMedia
);

export default router;
