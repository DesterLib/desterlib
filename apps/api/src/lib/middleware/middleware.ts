import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "../../config/env";

// Create rate limiter
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: "Too many requests from this IP, please try again later.",
});

// Middleware setup function
export function setupMiddleware(app: express.Application) {
  // Security & compression
  app.use(helmet());
  app.use(compression());
  app.use(limiter);

  // CORS
  app.use(
    cors({
      origin:
        config.nodeEnv === "production"
          ? config.frontendUrl
          : ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
}
