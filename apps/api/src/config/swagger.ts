import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dester Media Library API",
      version: "0.0.1",
      description: "A media library management system similar to Plex/Jellyfin",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            requestId: {
              type: "string",
              example: "abc123",
            },
            data: {
              type: "object",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            requestId: {
              type: "string",
              example: "abc123",
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "BAD_REQUEST",
                },
                message: {
                  type: "string",
                  example: "Invalid request",
                },
              },
            },
          },
        },
        MediaType: {
          type: "string",
          enum: ["MOVIE", "TV_SHOW", "MUSIC", "COMIC"],
          description: "Type of media to scan",
        },
        ScannedFile: {
          type: "object",
          properties: {
            path: {
              type: "string",
              example: "/media/movies/Inception.mkv",
            },
            name: {
              type: "string",
              example: "Inception.mkv",
            },
            size: {
              type: "integer",
              example: 1234567890,
            },
            extension: {
              type: "string",
              example: ".mkv",
            },
            relativePath: {
              type: "string",
              example: "Inception.mkv",
            },
          },
        },
        ScanResult: {
          type: "object",
          properties: {
            collectionName: {
              type: "string",
              example: "My Movie Collection",
            },
            mediaType: {
              $ref: "#/components/schemas/MediaType",
            },
            scannedPath: {
              type: "string",
              example: "/media/movies",
            },
            totalFiles: {
              type: "integer",
              example: 15,
            },
            files: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ScannedFile",
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-10-12T10:30:00.000Z",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
