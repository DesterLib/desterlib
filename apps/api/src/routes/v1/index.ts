import express, { Router } from "express";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/hello:
 *   get:
 *     summary: Hello World endpoint
 *     description: Returns a greeting message from the API
 *     tags: [V1]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/hello", (req, res) => {
  res.json({
    message: "Hello World from DesterLib API v1! 👋",
    timestamp: new Date().toISOString(),
  });
});

export default router;
