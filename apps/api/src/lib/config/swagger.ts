import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "../../core/config/env";
import { logger } from "../../lib/utils";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DesterLib API",
      version: "1.0.0",
      description:
        "API documentation for DesterLib - A comprehensive media library management system",
      contact: {
        name: "DesterLib Team",
        url: "https://t.me/Dester_Community",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: "Development server",
      },
      {
        url: `http://0.0.0.0:${config.port}`,
        description: "Production server (LAN accessible)",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check and API status endpoints",
      },
      {
        name: "Scan",
        description: "Media scanning and metadata fetching operations",
      },
      {
        name: "Library",
        description: "Library management endpoints",
      },
      {
        name: "Movies",
        description: "Movie catalog and retrieval endpoints",
      },
      {
        name: "TV Shows",
        description: "TV show catalog and retrieval endpoints",
      },
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "OK",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            uptime: {
              type: "number",
              example: 123.45,
            },
          },
        },
        Library: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique library identifier",
              example: "clx123abc456def789",
            },
            name: {
              type: "string",
              description: "Library name",
              example: "My Anime Library",
            },
            slug: {
              type: "string",
              description: "URL-friendly library identifier",
              example: "my-anime-library",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Library description",
              example: "A curated collection of anime shows and movies",
            },
            posterUrl: {
              type: "string",
              nullable: true,
              description: "URL to the library poster image",
              example: "https://example.com/poster.jpg",
            },
            backdropUrl: {
              type: "string",
              nullable: true,
              description: "URL to the library backdrop image",
              example: "https://example.com/backdrop.jpg",
            },
            isLibrary: {
              type: "boolean",
              description:
                "Whether this is a library (true) or collection (false)",
              example: true,
            },
            libraryPath: {
              type: "string",
              nullable: true,
              description: "File system path to the library",
              example: "/media/anime",
            },
            libraryType: {
              type: "string",
              enum: ["MOVIE", "TV_SHOW", "MUSIC", "COMIC"],
              nullable: true,
              description: "Type of media in the library",
              example: "TV_SHOW",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Library creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Library last update timestamp",
            },
            parentId: {
              type: "string",
              nullable: true,
              description: "ID of parent library (for nested libraries)",
              example: null,
            },
            mediaCount: {
              type: "number",
              description: "Number of media items in the library",
              example: 42,
            },
          },
          required: [
            "id",
            "name",
            "slug",
            "isLibrary",
            "createdAt",
            "updatedAt",
          ],
        },
      },
    },
  },
  apis: [
    // Include main routes
    "./src/routes/**/*.ts",
    "./dist/src/routes/**/*.js",
    // Include domain routes (where most API endpoints are defined)
    "./src/domains/**/*.ts",
    "./dist/src/domains/**/*.js",
    // Fallback paths for different environments
    path.join(process.cwd(), "src", "routes", "**", "*.ts"),
    path.join(process.cwd(), "dist", "src", "routes", "**", "*.js"),
    path.join(process.cwd(), "src", "domains", "**", "*.ts"),
    path.join(process.cwd(), "dist", "src", "domains", "**", "*.js"),
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let specs: any;
try {
  specs = swaggerJsdoc(options);
  logger.info(
    `Swagger specs generated successfully with ${Object.keys(specs.paths || {}).length} paths`
  );
} catch (error) {
  logger.error("Error generating Swagger specs:", error);
  // Fallback to basic specs if parsing fails
  specs = {
    openapi: "3.0.0",
    info: {
      title: "DesterLib API",
      version: "1.0.0",
      description: "API documentation for DesterLib",
    },
    paths: {},
    components: {},
  };
}

export { swaggerUi, specs };
