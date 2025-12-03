import express from "express";
import helmet from "helmet";
import compression from "compression";
import { config } from "../../../config/env";
import { logger } from "@dester/logger";
import { sanitizeInput } from "./sanitization.middleware";
import { addVersionHeader } from "./version.middleware";
import { validateVersion } from "./version.middleware";
import { networkInterfaces } from "os";
import path from "path";
import rateLimit from "express-rate-limit";

// Define limiter here since it's not exported from a separate file
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Helper to get local IP address
function getLocalIpAddress(): string {
  const nets = networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family !== "IPv4" || net.internal) {
        continue;
      }

      candidates.push(net.address);
    }
  }

  // Prefer private LAN addresses over link-local or others
  const isPrivateLan = (ip: string) =>
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

  const privateIp = candidates.find(isPrivateLan);
  if (privateIp) {
    return privateIp;
  }

  // Fallback: first non-internal IPv4 address, even if link-local
  if (candidates.length > 0) {
    // candidates contains only non-internal IPv4 addresses, so the first entry is safe
    return candidates[0] as string;
  }

  return "127.0.0.1";
}

const localIp = getLocalIpAddress();

export function setupMiddleware(app: express.Application) {
  // Logging middleware (skip health checks to reduce noise)
  app.use((req, res, next) => {
    if (
      req.path !== "/health" &&
      req.path !== "/ws" &&
      !req.path.includes("/api/docs")
    ) {
      logger.debug(`${req.method} ${req.path}`);
    }
    next();
  });

  app.set("trust proxy", "loopback");
  app.use(
    helmet({
      hsts: config.nodeEnv === "production" ? undefined : false,
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading for images
    })
  );
  app.use(compression());
  app.use(limiter);

  // Serve static metadata (posters, backdrops)
  // Ensure we use the same metadata path as the metadata service
  const metadataPath = config.metadataPath;
  logger.info(`Serving static metadata from: ${metadataPath}`);
  app.use("/metadata", express.static(metadataPath));

  // CORS
  app.use(
    require("cors")({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
          `http://${localIp}:3000`,
          `http://${localIp}:3001`,
        ];

        if (config.nodeEnv === "development" && origin.includes("localhost")) {
          return callback(null, true);
        }

        if (config.nodeEnv === "development" && origin.includes(localIp)) {
          return callback(null, true);
        }

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
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Client-Version",
      ],
      exposedHeaders: ["X-API-Version"],
    })
  );

  app.use(addVersionHeader);
  app.use("/api/v1", validateVersion);

  app.use((req, res, next) => {
    if (
      req.path.startsWith("/assets/") ||
      req.path.startsWith("/metadata/") || // Skip body parsing for metadata
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
        maxLength: 50000,
      },
    })
  );
}
