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
        url: "http://localhost:3000/api/v1",
        description: "Development server (API v1)",
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
            stats: {
              type: "object",
              properties: {
                added: {
                  type: "integer",
                  description: "Number of new files added",
                  example: 10,
                },
                skipped: {
                  type: "integer",
                  description: "Number of files already existing",
                  example: 5,
                },
                updated: {
                  type: "integer",
                  description: "Number of existing files updated",
                  example: 2,
                },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: {
              type: "integer",
              description: "Total number of items",
              example: 100,
            },
            limit: {
              type: "integer",
              description: "Number of items per page",
              example: 50,
            },
            offset: {
              type: "integer",
              description: "Number of items skipped",
              example: 0,
            },
            hasMore: {
              type: "boolean",
              description: "Whether there are more items available",
              example: true,
            },
          },
        },
        Media: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            title: {
              type: "string",
              example: "Inception",
            },
            type: {
              $ref: "#/components/schemas/MediaType",
            },
            description: {
              type: "string",
              nullable: true,
              example: "A mind-bending thriller",
            },
            posterUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/poster.jpg",
            },
            backdropUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/backdrop.jpg",
            },
            releaseDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2010-07-16T00:00:00.000Z",
            },
            rating: {
              type: "number",
              nullable: true,
              example: 8.8,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-10-12T10:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-10-12T10:30:00.000Z",
            },
            movie: {
              $ref: "#/components/schemas/Movie",
              nullable: true,
            },
            tvShow: {
              $ref: "#/components/schemas/TVShow",
              nullable: true,
            },
            music: {
              $ref: "#/components/schemas/Music",
              nullable: true,
            },
            comic: {
              $ref: "#/components/schemas/Comic",
              nullable: true,
            },
            genres: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MediaGenre",
              },
            },
            people: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MediaPerson",
              },
            },
            collections: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MediaCollection",
              },
            },
            externalIds: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ExternalId",
              },
            },
          },
        },
        Movie: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            duration: {
              type: "integer",
              nullable: true,
              description: "Duration in minutes",
              example: 148,
            },
            director: {
              type: "string",
              nullable: true,
              example: "Christopher Nolan",
            },
            trailerUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/trailer.mp4",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
          },
        },
        TVShow: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            creator: {
              type: "string",
              nullable: true,
              example: "Vince Gilligan",
            },
            network: {
              type: "string",
              nullable: true,
              example: "AMC",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
            seasons: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Season",
              },
            },
          },
        },
        Season: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            number: {
              type: "integer",
              example: 1,
            },
            tvShowId: {
              type: "string",
              example: "clx123456789",
            },
            episodes: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Episode",
              },
            },
          },
        },
        Episode: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            title: {
              type: "string",
              example: "Pilot",
            },
            number: {
              type: "integer",
              example: 1,
            },
            duration: {
              type: "integer",
              nullable: true,
              description: "Duration in minutes",
              example: 45,
            },
            airDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2008-01-20T00:00:00.000Z",
            },
            videoUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/episode.mp4",
            },
            seasonId: {
              type: "string",
              example: "clx123456789",
            },
          },
        },
        Music: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            artist: {
              type: "string",
              example: "The Beatles",
            },
            album: {
              type: "string",
              nullable: true,
              example: "Abbey Road",
            },
            genre: {
              type: "string",
              nullable: true,
              example: "Rock",
            },
            duration: {
              type: "integer",
              nullable: true,
              description: "Duration in seconds",
              example: 280,
            },
            trackUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/track.mp3",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
          },
        },
        Comic: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            issue: {
              type: "integer",
              nullable: true,
              example: 1,
            },
            volume: {
              type: "string",
              nullable: true,
              example: "Volume 1",
            },
            publisher: {
              type: "string",
              nullable: true,
              example: "Marvel Comics",
            },
            pages: {
              type: "integer",
              nullable: true,
              example: 32,
            },
            fileUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/comic.cbz",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
          },
        },
        Genre: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            name: {
              type: "string",
              example: "Action",
            },
            slug: {
              type: "string",
              example: "action",
            },
            description: {
              type: "string",
              nullable: true,
              example: "High-energy movies with fight scenes",
            },
          },
        },
        MediaGenre: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
            genreId: {
              type: "string",
              example: "clx123456789",
            },
            genre: {
              $ref: "#/components/schemas/Genre",
            },
          },
        },
        Person: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            name: {
              type: "string",
              example: "Leonardo DiCaprio",
            },
            bio: {
              type: "string",
              nullable: true,
              example: "American actor and film producer",
            },
            birthDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "1974-11-11T00:00:00.000Z",
            },
            profileUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/profile.jpg",
            },
          },
        },
        MediaPerson: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            role: {
              type: "string",
              enum: [
                "ACTOR",
                "DIRECTOR",
                "WRITER",
                "PRODUCER",
                "ARTIST",
                "COMPOSER",
                "AUTHOR",
              ],
              example: "ACTOR",
            },
            character: {
              type: "string",
              nullable: true,
              example: "Dom Cobb",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
            personId: {
              type: "string",
              example: "clx123456789",
            },
            person: {
              $ref: "#/components/schemas/Person",
            },
          },
        },
        Collection: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            name: {
              type: "string",
              example: "Marvel Cinematic Universe",
            },
            slug: {
              type: "string",
              example: "marvel-cinematic-universe",
            },
            description: {
              type: "string",
              nullable: true,
              example: "All MCU movies",
            },
            posterUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/poster.jpg",
            },
            backdropUrl: {
              type: "string",
              nullable: true,
              example: "https://example.com/backdrop.jpg",
            },
          },
        },
        MediaCollection: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
            collectionId: {
              type: "string",
              example: "clx123456789",
            },
            order: {
              type: "integer",
              nullable: true,
              example: 1,
            },
            collection: {
              $ref: "#/components/schemas/Collection",
            },
          },
        },
        ExternalId: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "clx123456789",
            },
            source: {
              type: "string",
              enum: [
                "TMDB",
                "IMDB",
                "TVDB",
                "ANIDB",
                "MYANIMELIST",
                "MUSICBRAINZ",
                "SPOTIFY",
                "COMICVINE",
                "OTHER",
              ],
              example: "TMDB",
            },
            externalId: {
              type: "string",
              example: "tt1375666",
            },
            mediaId: {
              type: "string",
              example: "clx123456789",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
