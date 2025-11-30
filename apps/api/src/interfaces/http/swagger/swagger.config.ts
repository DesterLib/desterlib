import swaggerJsdoc from "swagger-jsdoc";
import { config } from "../../../config/env";
import { readFileSync } from "fs";
import { join } from "path";

function getApiVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../../../package.json"), "utf-8")
    );
    return packageJson.version;
  } catch (error) {
    return "unknown";
  }
}

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DesterLib API",
      version: getApiVersion(),
      description:
        "RESTful API for DesterLib - A media library management system",
      contact: {
        name: "DesterLib",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: "Development server",
      },
      {
        url: `http://127.0.0.1:${config.port}`,
        description: "Local server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Stream",
        description: "Media streaming endpoints",
      },
      {
        name: "Movies",
        description: "Movie management endpoints",
      },
      {
        name: "TV Shows",
        description: "TV show management endpoints",
      },
      {
        name: "Library",
        description: "Library management endpoints",
      },
      {
        name: "Scan",
        description: "Media scanning endpoints",
      },
      {
        name: "Search",
        description: "Search endpoints",
      },
      {
        name: "Settings",
        description: "Settings management endpoints",
      },
      {
        name: "Logs",
        description: "Log management endpoints",
      },
    ],
    components: {
      parameters: {
        ClientVersion: {
          name: "X-Client-Version",
          in: "header",
          description:
            "Client version for API compatibility checking. Should match the API version (e.g., 0.2.1). If not provided, a warning will be logged but the request will still be processed.",
          required: false,
          schema: {
            type: "string",
            example: getApiVersion(),
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error type",
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "OK",
            },
            version: {
              type: "string",
              example: "0.2.1",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            uptime: {
              type: "number",
              example: 12345.67,
            },
          },
        },
        UpdateSettingsRequest: {
          type: "object",
          description:
            "Request body for updating application settings. All fields are optional - only include the fields you want to update.",
          properties: {
            tmdbApiKey: {
              type: "string",
              description:
                "The Movie Database (TMDB) API key for metadata fetching. Get your free API key at https://www.themoviedb.org/settings/api. This will automatically sync to the metadata provider system and enable the TMDB provider. The provider system supports multiple metadata providers, and this is one of them.",
              example: "your_tmdb_api_key_here",
              minLength: 1,
            },
            port: {
              type: "integer",
              description: "API server port",
              minimum: 1000,
              maximum: 65535,
              example: 3001,
            },
            enableRouteGuards: {
              type: "boolean",
              description: "Enable authentication/route guards",
              example: false,
            },
            firstRun: {
              type: "boolean",
              description: "First run setup flag",
              example: false,
            },
            scanSettings: {
              type: "object",
              description: "Media scanning configuration",
              additionalProperties: true,
              properties: {
                mediaType: {
                  type: "string",
                  enum: ["movie", "tv"],
                  description: "Default media type for scanning",
                },
                mediaTypeDepth: {
                  type: "object",
                  description: "Maximum directory depth for each media type",
                  additionalProperties: true,
                  properties: {
                    movie: {
                      type: "integer",
                      minimum: 0,
                      maximum: 10,
                      default: 2,
                      description: "Maximum depth for movie scanning",
                    },
                    tv: {
                      type: "integer",
                      minimum: 0,
                      maximum: 10,
                      default: 4,
                      description: "Maximum depth for TV show scanning",
                    },
                  },
                },
                filenamePattern: {
                  type: "string",
                  description:
                    "Regex pattern to match filenames. Default matches common video extensions.",
                  example: ".*\\.(mkv|mp4|avi)$",
                },
                directoryPattern: {
                  type: "string",
                  description:
                    "Regex pattern to match directory names. Default matches common media organization patterns.",
                  example: "^[^\\/]+(?:\\s*\\(\\d{4}\\))?$",
                },
                rescan: {
                  type: "boolean",
                  default: false,
                  description: "Force rescan of already processed files",
                },
                followSymlinks: {
                  type: "boolean",
                  default: true,
                  description: "Follow symbolic links when scanning",
                },
              },
            },
          },
        },
        PublicSettings: {
          type: "object",
          description:
            "Public application settings (excludes sensitive data like API keys)",
          properties: {
            port: {
              type: "integer",
              example: 3001,
            },
            enableRouteGuards: {
              type: "boolean",
              example: false,
            },
            firstRun: {
              type: "boolean",
              example: false,
            },
            scanSettings: {
              type: "object",
              properties: {
                mediaTypeDepth: {
                  type: "object",
                  properties: {
                    movie: {
                      type: "integer",
                    },
                    tv: {
                      type: "integer",
                    },
                  },
                },
                filenamePattern: {
                  type: "string",
                },
                directoryPattern: {
                  type: "string",
                },
                rescan: {
                  type: "boolean",
                },
                followSymlinks: {
                  type: "boolean",
                },
              },
            },
          },
        },
        MetadataProvider: {
          type: "object",
          description: "Metadata provider configuration",
          properties: {
            id: {
              type: "string",
              example: "uuid-here",
            },
            name: {
              type: "string",
              example: "tmdb",
              description: "Provider name (e.g., 'tmdb', 'omdb', 'tvdb')",
            },
            enabled: {
              type: "boolean",
              example: true,
            },
            priority: {
              type: "integer",
              example: 0,
              description: "Lower number = higher priority",
            },
            config: {
              type: "object",
              description: "Provider-specific configuration",
              additionalProperties: true,
              properties: {},
            },
          },
        },
        UpdateProviderRequest: {
          type: "object",
          description: "Request body for updating a metadata provider",
          properties: {
            enabled: {
              type: "boolean",
              example: true,
            },
            priority: {
              type: "integer",
              example: 0,
              minimum: 0,
            },
            config: {
              type: "object",
              description:
                "Provider-specific configuration (JSON object). Common fields include 'apiKey', 'baseUrl', and 'rateLimitRps', but providers may have additional fields.",
              additionalProperties: true,
              example: {
                apiKey: "your_api_key",
                baseUrl: "https://api.themoviedb.org/3",
                rateLimitRps: 4.0,
              },
            },
          },
        },
        MediaTypeDepth: {
          type: "object",
          description: "Maximum directory depth for each media type",
          properties: {
            movie: {
              type: "integer",
              minimum: 0,
              maximum: 10,
              default: 2,
              description: "Maximum depth for movie scanning",
            },
            tv: {
              type: "integer",
              minimum: 0,
              maximum: 10,
              default: 4,
              description: "Maximum depth for TV show scanning",
            },
          },
        },
        ScanOptions: {
          type: "object",
          description: "Optional scan configuration parameters",
          required: ["mediaType"],
          properties: {
            mediaType: {
              type: "string",
              enum: ["movie", "tv"],
              description:
                'Media type to scan. Critical for determining the scanning strategy (e.g., parsing seasons/episodes for "tv" vs standalone "movie").',
            },
            mediaTypeDepth: {
              $ref: "#/components/schemas/MediaTypeDepth",
            },
            filenamePattern: {
              type: "string",
              description: "Regex pattern to match filenames",
            },
            directoryPattern: {
              type: "string",
              description: "Regex pattern to match directory names",
            },
            rescan: {
              type: "boolean",
              default: false,
              description: "Force rescan of already processed files",
            },
            followSymlinks: {
              type: "boolean",
              default: true,
              description: "Follow symbolic links when scanning",
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  apis: [
    // Source files (for development)
    join(process.cwd(), "src/interfaces/http/routes/**/*.ts"),
    join(process.cwd(), "src/interfaces/http/controllers/**/*.ts"),
    // Compiled files (for production)
    join(__dirname, "../routes/**/*.js"),
    join(__dirname, "../controllers/**/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
