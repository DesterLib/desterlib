import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "../../config/env";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DesterLib API",
      version: "1.0.0",
      description: "API documentation for DesterLib",
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
        HelloResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Hello World from DesterLib API v1! 👋",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
