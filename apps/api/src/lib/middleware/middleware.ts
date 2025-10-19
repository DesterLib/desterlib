import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "../../config/env";
import { sanitizeInput } from "./sanitization";

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
    })
  );

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Global input sanitization (basic level)
  app.use(
    sanitizeInput({
      sanitizeBody: true,
      sanitizeQuery: true,
      sanitizeParams: true,
      sanitizeOptions: {
        stripHtml: true,
        trimWhitespace: true,
        maxLength: 50000, // Higher limit for global middleware
      },
    })
  );
}
