import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { networkInterfaces } from "os";

// Configuration
import { env } from "./config/env.js";
import logger, { morganStream } from "./config/logger.js";
import { swaggerSpec } from "./config/swagger.js";

// Middleware
import { requestContextMiddleware } from "./lib/requestContext.js";
import { responseEnhancerMiddleware } from "./lib/response.js";
import { notFoundHandler, errorHandler } from "./lib/errorHandler.js";
import { setupGracefulShutdown } from "./lib/shutdown.js";
import { webSocketService } from "./lib/websocket.js";
import { metricsMiddleware, metricsHandler } from "./lib/metrics.js";
import {
  csrfCookieMiddleware,
  csrfProtection,
  csrfTokenHandler,
} from "./lib/csrf.js";
import { scheduleBackups } from "./lib/backup.js";
import { warmupCache } from "./lib/metadataCache.js";
import { rateLimiters } from "./lib/rateLimiter.js";
import { alertingService } from "./lib/alerting.js";
import {
  performanceMiddleware,
  performanceMonitor,
} from "./lib/performanceMonitor.js";

// Routes
import healthRouter from "./routes/health/health.module.js";
import scanRouter from "./routes/scan/scan.module.js";
import { authHandler } from "./lib/auth.js";
import usersRouter from "./routes/users/users.module.js";
import mediaRouter from "./routes/media/media.module.js";
import moviesRouter from "./routes/movies/movies.module.js";
import tvShowsRouter from "./routes/tv-shows/tv-shows.module.js";
import musicRouter from "./routes/music/music.module.js";
import comicsRouter from "./routes/comics/comics.module.js";
import collectionsRouter from "./routes/collections/collections.module.js";
import searchRouter from "./routes/search/search.module.js";
import settingsRouter from "./routes/settings/settings.module.js";
import notificationsRouter from "./routes/notifications/notifications.module.js";
import bulkRouter from "./lib/bulk/bulk.routes.js";
import adminRouter from "./routes/admin/admin.routes.js";

const app = express();

// ────────────────────────────────────────────────────────────────────────────
// Security Middleware
// ────────────────────────────────────────────────────────────────────────────

// Helmet - Security headers with custom CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs unsafe-inline
        scriptSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs unsafe-inline
        imgSrc: ["'self'", "data:", "https:"], // Allow images from HTTPS and data URIs
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [], // Force HTTPS in production
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// Rate limiting - Apply standard rate limit to all API routes
// Specific routes below will have their own more restrictive limits
app.use("/api/", rateLimiters.standard);

// CORS configuration - allow localhost and LAN access
const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

// Add dynamic origin checking for LAN access
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin matches any of our configured origins
    const isConfiguredOrigin = corsOrigins.some((configuredOrigin) => {
      if (configuredOrigin === origin) return true;
      // Allow any localhost or LAN IP on our port
      if (
        configuredOrigin.includes("localhost") &&
        origin.includes("localhost")
      )
        return true;
      if (configuredOrigin.includes(":3000") && origin.includes(":3000")) {
        // Allow any IP address on port 3000 (LAN access)
        const lanIpRegex = /^https?:\/\/([0-9]{1,3}\.){3}[0-9]{1,3}:3000$/;
        return lanIpRegex.test(origin);
      }
      return false;
    });

    if (isConfiguredOrigin) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      logger.info(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-csrf-token",
    "cookie",
    "set-cookie",
  ],
  exposedHeaders: ["set-cookie"],
};

app.use(cors(corsOptions));

// Compression - Reduce response size
app.use(compression());

// Body parsing with size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parsing (required for CSRF)
app.use(cookieParser());

// ────────────────────────────────────────────────────────────────────────────
// Request Processing Middleware
// ────────────────────────────────────────────────────────────────────────────

// HTTP request logging
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
    { stream: morganStream }
  )
);

// Request context (request ID, timing)
app.use(requestContextMiddleware);

// Response helpers (res.jsonOk)
app.use(responseEnhancerMiddleware);

// Metrics tracking
app.use(metricsMiddleware);

// Performance monitoring
app.use(performanceMiddleware);

// CSRF cookie setup (must be before CSRF protection)
app.use(csrfCookieMiddleware);

// ────────────────────────────────────────────────────────────────────────────
// Documentation
// ────────────────────────────────────────────────────────────────────────────

// Swagger documentation with dark mode
const swaggerDarkCss = `
  html { background: #1a1a1a; }
  body { background: #1a1a1a; margin: 0; }
  .swagger-ui .topbar { display: none }
  .swagger-ui { background: #1a1a1a; }
  .swagger-ui .info { background: transparent; }
  .swagger-ui .info .title { color: #fff; }
  .swagger-ui .info .description, .swagger-ui .info .base-url { color: #b3b3b3; }
  .swagger-ui .scheme-container { background: #2a2a2a; }
  .swagger-ui .opblock-tag { color: #fff; border-bottom: 1px solid #3a3a3a; }
  .swagger-ui .opblock { background: #2a2a2a; border: 1px solid #3a3a3a; }
  .swagger-ui .opblock .opblock-summary { background: #2a2a2a; border: none; }
  .swagger-ui .opblock .opblock-summary-description { color: #b3b3b3; }
  .swagger-ui .opblock .opblock-section-header { background: #2a2a2a; }
  .swagger-ui .opblock-description-wrapper, .swagger-ui .opblock-external-docs-wrapper { color: #b3b3b3; }
  .swagger-ui .opblock-body pre.microlight { background: #1a1a1a; border: 1px solid #3a3a3a; color: #b3b3b3; }
  .swagger-ui .parameter__name, .swagger-ui .parameter__type { color: #fff; }
  .swagger-ui .response-col_status { color: #fff; }
  .swagger-ui .response-col_description { color: #b3b3b3; }
  .swagger-ui .tab li { color: #b3b3b3; }
  .swagger-ui .tab li.active { color: #fff; }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #fff; border-bottom: 1px solid #3a3a3a; }
  .swagger-ui .model-box { background: #2a2a2a; }
  .swagger-ui .model { color: #b3b3b3; }
  .swagger-ui .model-title { color: #fff; }
  .swagger-ui .prop-type { color: #88c0d0; }
  .swagger-ui .prop-format { color: #a3be8c; }
  .swagger-ui section.models { border: 1px solid #3a3a3a; }
  .swagger-ui section.models h4 { color: #fff; border-bottom: 1px solid #3a3a3a; }
  .swagger-ui .btn { background: #4a4a4a; color: #fff; border: 1px solid #5a5a5a; }
  .swagger-ui .btn:hover { background: #5a5a5a; }
  .swagger-ui .responses-inner h5, .swagger-ui .responses-inner h4 { color: #fff; }
  .swagger-ui input[type=text], .swagger-ui input[type=password], .swagger-ui input[type=email],
  .swagger-ui textarea, .swagger-ui select { background: #2a2a2a; color: #fff; border: 1px solid #3a3a3a; }
  .swagger-ui textarea:focus, .swagger-ui input[type=text]:focus { border: 1px solid #5a5a5a; }
`;

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: swaggerDarkCss,
    customSiteTitle: "Dester API Documentation",
  })
);

// Swagger JSON endpoint
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ────────────────────────────────────────────────────────────────────────────
// Monitoring & Security Endpoints
// ────────────────────────────────────────────────────────────────────────────

// Prometheus metrics endpoint (no auth required for monitoring tools)
app.get("/metrics", metricsHandler);

// CSRF token endpoint (for web clients)
app.get("/api/v1/csrf-token", csrfTokenHandler);

// Server info endpoint for LAN discovery
app.get("/api/v1/server-info", (_req, res) => {
  const interfaces = networkInterfaces();
  const lanIps: string[] = [];

  // Find all LAN IP addresses
  Object.values(interfaces).forEach((netInterface) => {
    netInterface?.forEach((details) => {
      if (details.family === "IPv4" && !details.internal) {
        lanIps.push(details.address);
      }
    });
  });

  res.json({
    port: env.PORT,
    lanIps,
    urls: lanIps.map((ip) => `http://${ip}:${env.PORT}`),
    localhost: `http://localhost:${env.PORT}`,
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Health Check Routes (no versioning, no rate limiting)
// ────────────────────────────────────────────────────────────────────────────

app.use("/health", healthRouter);

// ────────────────────────────────────────────────────────────────────────────
// API Routes (v1)
// ────────────────────────────────────────────────────────────────────────────

const API_V1 = "/api/v1";

// Better-auth routes - handles all authentication /api/auth/* endpoints
// (register, login, logout, session management, etc.)
app.all("/api/auth/*", authHandler);

// User management routes (admin only)
app.use(`${API_V1}/users`, csrfProtection, usersRouter);

// Admin routes (requires admin role)
app.use(`${API_V1}/admin`, adminRouter);

// Application routes (some may require authentication)
// CSRF protection is applied selectively within these routers
app.use(`${API_V1}/settings`, csrfProtection, settingsRouter);
app.use(`${API_V1}/notifications`, csrfProtection, notificationsRouter);
app.use(`${API_V1}/scan`, csrfProtection, scanRouter);
app.use(`${API_V1}/media`, csrfProtection, mediaRouter);
app.use(`${API_V1}/collections`, csrfProtection, collectionsRouter);
app.use(`${API_V1}/movies`, csrfProtection, moviesRouter);
app.use(`${API_V1}/tv-shows`, csrfProtection, tvShowsRouter);
app.use(`${API_V1}/music`, csrfProtection, musicRouter);
app.use(`${API_V1}/comics`, csrfProtection, comicsRouter);
app.use(`${API_V1}/search`, rateLimiters.search, searchRouter); // GET requests, no CSRF needed
app.use(`${API_V1}/bulk`, csrfProtection, bulkRouter);

// ────────────────────────────────────────────────────────────────────────────
// Static File Serving (Web App)
// ────────────────────────────────────────────────────────────────────────────

// Get the current file directory for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built web app static files
// In development: ../../web/dist (relative to src/)
// In production Docker: ../web/dist (relative to dist/)
const webDistPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "../web/dist")
    : path.join(__dirname, "../../../web/dist");

// Serve static files from the web app build directory
app.use(
  express.static(webDistPath, {
    maxAge: env.NODE_ENV === "production" ? "1y" : "0", // Cache for 1 year in production
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Set proper MIME types for JavaScript and CSS files
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

// Handle client-side routing - serve index.html for all non-API routes
app.get("*", (req, res, next) => {
  // Skip if this is an API route, health check, metrics, or docs
  if (
    req.path.startsWith("/api") ||
    req.path.startsWith("/health") ||
    req.path.startsWith("/metrics") ||
    req.path.startsWith("/api-docs")
  ) {
    return next();
  }

  // Serve the web app index.html for all other routes (client-side routing)
  res.sendFile(path.join(webDistPath, "index.html"));
});

// ────────────────────────────────────────────────────────────────────────────
// Error Handlers
// ────────────────────────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ────────────────────────────────────────────────────────────────────────────
// Server Startup
// ────────────────────────────────────────────────────────────────────────────

import { verifyDatabaseConnection } from "./lib/prisma.js";

async function startServer() {
  try {
    // Verify database connection before starting server
    logger.info("Verifying database connection...");
    await verifyDatabaseConnection();

    // Start the HTTP server - bind to all interfaces for LAN access
    const server = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`🚀 Server started successfully`);
      logger.info(`   Environment: ${env.NODE_ENV}`);
      logger.info(`   Port: ${env.PORT}`);
      logger.info(`   Web App: http://localhost:${env.PORT}`);
      logger.info(`   API: http://localhost:${env.PORT}/api/v1`);
      logger.info(`   Docs: http://localhost:${env.PORT}/api-docs`);
      logger.info(`   Health: http://localhost:${env.PORT}/health`);
      logger.info(`   Metrics: http://localhost:${env.PORT}/metrics`);
      logger.info(`   WebSocket: ws://localhost:${env.PORT}/ws`);
      logger.info(`   CSRF Protection: Enabled`);
      logger.info(
        `   🌐 Server is accessible on LAN - check your local IP address`
      );
    });

    // Initialize WebSocket server
    webSocketService.initialize(server);

    // Schedule automatic backups
    scheduleBackups();

    // Warm up cache with frequently accessed data
    warmupCache().catch((error) => {
      logger.error("Cache warmup failed:", error);
    });

    // Start health monitoring and alerting
    alertingService.startMonitoring(60000); // Check every minute
    logger.info("Health monitoring and alerting started");

    // Start performance monitoring
    performanceMonitor.startPeriodicChecks(60000); // Check every minute
    logger.info("Performance monitoring started");

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error("Failed to start server:", error);
    logger.error(
      "\n⛔ Server startup aborted due to database connection failure."
    );
    logger.error("   Please resolve the database issue and try again.\n");
    process.exit(1);
  }
}

// Start the server
startServer();
