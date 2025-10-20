import express, { Router } from "express";
import { streamControllers } from "./stream.controller";
import { validateParams } from "../../../lib/middleware";
import { streamMediaSchema } from "./stream.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/stream/{id}:
 *   get:
 *     summary: Stream any media file by ID with byte-range support
 *     description: |
 *       Streams any media file (movie, TV episode, music, comic) with proper HTTP range request support.
 *       This centralized endpoint can handle any media type stored in the database.
 *       Supports seeking, partial content delivery, and proper streaming headers for video/audio playback.
 *     tags: [Stream]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The media file ID (can be movie ID, episode ID, music ID, or comic ID)
 *         example: "clx123abc456def789"
 *       - in: header
 *         name: Range
 *         required: false
 *         schema:
 *           type: string
 *         description: Byte range request (e.g., "bytes=0-1023")
 *         example: "bytes=0-1048576"
 *     responses:
 *       200:
 *         description: Full file content (when no Range header is provided)
 *         headers:
 *           Content-Type:
 *             description: Media MIME type based on file extension
 *             type: string
 *             example: "video/mp4"
 *           Accept-Ranges:
 *             description: Indicates range requests are supported
 *             type: string
 *             example: "bytes"
 *           Content-Length:
 *             description: Total file size in bytes
 *             type: string
 *           Content-Disposition:
 *             description: Filename for download/display
 *             type: string
 *             example: "inline; filename=\"Movie Title.mp4\""
 *       206:
 *         description: Partial content (when Range header is provided)
 *         headers:
 *           Content-Type:
 *             description: Media MIME type based on file extension
 *             type: string
 *             example: "video/mp4"
 *           Content-Range:
 *             description: Range of bytes being returned
 *             type: string
 *             example: "bytes 0-1048575/5368709120"
 *           Content-Length:
 *             description: Size of the returned chunk in bytes
 *             type: string
 *       400:
 *         description: Bad request - Invalid media ID or file path
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
 *                   example: "Media ID is required"
 *       404:
 *         description: Media file not found or doesn't exist on disk
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
 *                   example: "Media file not found on disk"
 *       416:
 *         description: Range Not Satisfiable - Invalid range request
 *         headers:
 *           Content-Range:
 *             description: Indicates the valid range for the file
 *             type: string
 *             example: "bytes 5368709120"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Range Not Satisfiable"
 *                 message:
 *                   type: string
 *                   example: "Requested range not satisfiable"
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
 *                   example: "Failed to stream media file"
 */
router.get(
  "/:id",
  validateParams(streamMediaSchema),
  streamControllers.streamMedia
);

export default router;
