import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "../../config/env";

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
      },
    },
  },
  apis: ["./src/routes/**/*.ts", "./dist/src/routes/**/*.ts"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
