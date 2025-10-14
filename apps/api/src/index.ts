import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import logger, { morganStream } from "./config/logger.js";
import { requestContextMiddleware } from "./lib/requestContext.js";
import { responseEnhancerMiddleware } from "./lib/response.js";
import { notFoundHandler, errorHandler } from "./lib/errorHandler.js";
import { swaggerSpec } from "./config/swagger.js";
import scanRouter from "./routes/scan/scan.module.js";
import mediaRouter from "./routes/media/media.module.js";
import moviesRouter from "./routes/movies/movies.module.js";
import tvShowsRouter from "./routes/tv-shows/tv-shows.module.js";
import musicRouter from "./routes/music/music.module.js";
import comicsRouter from "./routes/comics/comics.module.js";
import collectionsRouter from "./routes/collections/collections.module.js";
import searchRouter from "./routes/search/search.module.js";
import settingsRouter from "./routes/settings/settings.module.js";
import notificationsRouter from "./routes/notifications/notifications.module.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// CORS configuration - allow requests from web app
app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// HTTP request logging
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
    { stream: morganStream }
  )
);

app.use(requestContextMiddleware);
app.use(responseEnhancerMiddleware);

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

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the API health status
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 */
app.get("/health", (_req, res) => {
  res.jsonOk({ status: "ok" });
});

// API Routes
app.use("/api/settings", settingsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/scan", scanRouter);
app.use("/api/media", mediaRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/movies", moviesRouter);
app.use("/api/tv-shows", tvShowsRouter);
app.use("/api/music", musicRouter);
app.use("/api/comics", comicsRouter);
app.use("/api/search", searchRouter);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`API listening on http://localhost:${port}`);
  logger.info(
    `📚 API Documentation available at http://localhost:${port}/api-docs`
  );
});
