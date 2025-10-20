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
  // Only trust loopback proxies to satisfy express-rate-limit validation
  app.set("trust proxy", "loopback");
  // Security & compression
  app.use(
    helmet({
      // Disable HSTS in development to prevent HTTPS forcing
      hsts: config.nodeEnv === "production" ? undefined : false,
      contentSecurityPolicy: false, // Disable CSP to prevent upgrade-insecure-requests
    })
  );
  app.use(compression());
  app.use(limiter);

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          config.frontendUrl,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
        ];

        // In development, also allow any localhost origin
        if (config.nodeEnv === "development" && origin.includes("localhost")) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
