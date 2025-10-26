import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import os from "os";
import { config } from "../../core/config/env";
import { sanitizeInput } from "./sanitization";

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: "Too many requests from this IP, please try again later.",
});

// Get local machine IP address for LAN access
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const addr of iface) {
      // Skip internal and IPv6 addresses
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback to localhost
}

const localIp = getLocalIpAddress();

export function setupMiddleware(app: express.Application) {
  // Only trust loopback proxies to satisfy express-rate-limit validation
  app.set("trust proxy", "loopback");
  app.use(
    helmet({
      // Disable HSTS in development to prevent HTTPS forcing
      hsts: config.nodeEnv === "production" ? undefined : false,
      contentSecurityPolicy: false, // Disable CSP to prevent upgrade-insecure-requests
    })
  );
  app.use(compression());
  app.use(limiter);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
          `http://${localIp}:3000`,
          `http://${localIp}:3001`,
        ];

        // In development, also allow any localhost origin
        if (config.nodeEnv === "development" && origin.includes("localhost")) {
          return callback(null, true);
        }

        // Allow the local machine IP with any port in development
        if (config.nodeEnv === "development" && origin.includes(localIp)) {
          return callback(null, true);
        }

        // Allow LAN IP access in all environments (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isLocalNetwork =
          /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
            origin
          );
        if (isLocalNetwork) {
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

  // JSON parsing middleware - skip for static assets and image/media files
  app.use((req, res, next) => {
    // Skip JSON parsing for static assets and media files
    if (
      req.path.startsWith("/assets/") ||
      req.path.endsWith(".css") ||
      req.path.endsWith(".js") ||
      req.path.endsWith(".html") ||
      req.path.endsWith(".png") ||
      req.path.endsWith(".jpg") ||
      req.path.endsWith(".jpeg") ||
      req.path.endsWith(".gif") ||
      req.path.endsWith(".svg") ||
      req.path.endsWith(".ico") ||
      req.path.endsWith(".woff") ||
      req.path.endsWith(".woff2") ||
      req.path.endsWith(".ttf") ||
      req.path.endsWith(".eot")
    ) {
      return next();
    }
    return express.json({ limit: "10mb" })(req, res, next);
  });

  app.use(express.urlencoded({ extended: true }));

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
