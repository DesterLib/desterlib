/**
 * Media Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { prisma } from "../../lib/prisma.js";
import mediaRouter from "../../routes/media/media.module.js";
import authRouter from "../../routes/auth/auth.module.js";
import { responseEnhancerMiddleware } from "../../lib/response.js";
import { requestContextMiddleware } from "../../lib/requestContext.js";
import { errorHandler } from "../../lib/errorHandler.js";

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use(responseEnhancerMiddleware);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/media", mediaRouter);
  app.use(errorHandler);
  return app;
}

describe("Media API", () => {
  const app = createTestApp();
  let testAccessToken: string;
  let testMediaId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.media.deleteMany({
      where: {
        title: {
          in: ["Test Movie", "Test TV Show", "Updated Test Movie"],
        },
      },
    });

    // Create test user and get token
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "mediatest",
        password: "TestPass123",
        email: "mediatest@example.com",
        role: "USER",
      });

    testAccessToken = registerResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.media.deleteMany({
      where: {
        title: {
          in: ["Test Movie", "Test TV Show", "Updated Test Movie"],
        },
      },
    });
    await prisma.user.deleteMany({
      where: { username: "mediatest" },
    });
  });

  describe("POST /media", () => {
    it("should create a new movie", async () => {
      const response = await request(app)
        .post("/api/v1/media")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({
          title: "Test Movie",
          type: "MOVIE",
          description: "A test movie",
          releaseDate: "2024-01-01",
          rating: 8.5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toMatchObject({
        title: "Test Movie",
        type: "MOVIE",
        rating: 8.5,
      });

      testMediaId = response.body.data.media.id;
    });

    it("should fail without authentication", async () => {
      const response = await request(app).post("/api/v1/media").send({
        title: "Test Movie",
        type: "MOVIE",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid data", async () => {
      const response = await request(app)
        .post("/api/v1/media")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({
          title: "", // Invalid: empty title
          type: "INVALID_TYPE",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /media", () => {
    it("should get all media", async () => {
      const response = await request(app)
        .get("/api/v1/media")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.media)).toBe(true);
    });

    it("should filter by type", async () => {
      const response = await request(app)
        .get("/api/v1/media?type=MOVIE")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const media = response.body.data.media;
      if (media.length > 0) {
        expect(media.every((m: any) => m.type === "MOVIE")).toBe(true);
      }
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/v1/media?limit=5&offset=0")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("limit");
      expect(response.body.data).toHaveProperty("offset");
      expect(response.body.data.limit).toBe(5);
    });

    it("should support sorting", async () => {
      const response = await request(app)
        .get("/api/v1/media?sortBy=rating&sortOrder=desc")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);

      const media = response.body.data.media;
      if (media.length > 1) {
        // Check if sorted descending by rating
        for (let i = 0; i < media.length - 1; i++) {
          if (media[i].rating && media[i + 1].rating) {
            expect(media[i].rating).toBeGreaterThanOrEqual(media[i + 1].rating);
          }
        }
      }
    });
  });

  describe("GET /media/:id", () => {
    it("should get media by id", async () => {
      const response = await request(app)
        .get(`/api/v1/media/${testMediaId}`)
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media.id).toBe(testMediaId);
    });

    it("should return 404 for non-existent media", async () => {
      const response = await request(app)
        .get("/api/v1/media/clxxxxxxxxxxxxxx")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /media/:id", () => {
    it("should update media", async () => {
      const response = await request(app)
        .put(`/api/v1/media/${testMediaId}`)
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({
          title: "Updated Test Movie",
          rating: 9.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media.title).toBe("Updated Test Movie");
      expect(response.body.data.media.rating).toBe(9.0);
    });
  });

  describe("DELETE /media/:id", () => {
    it("should delete media", async () => {
      const response = await request(app)
        .delete(`/api/v1/media/${testMediaId}`)
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 when deleting non-existent media", async () => {
      const response = await request(app)
        .delete(`/api/v1/media/${testMediaId}`)
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Media with Relations", () => {
    let movieId: string;

    beforeEach(async () => {
      const media = await prisma.media.create({
        data: {
          title: "Test Movie with Relations",
          type: "MOVIE",
          movie: {
            create: {
              duration: 120,
              director: "Test Director",
            },
          },
        },
      });
      movieId = media.id;
    });

    it("should include movie details", async () => {
      const response = await request(app)
        .get(`/api/v1/media/${movieId}`)
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.media.movie).toBeDefined();
      expect(response.body.data.media.movie.duration).toBe(120);
      expect(response.body.data.media.movie.director).toBe("Test Director");
    });

    afterEach(async () => {
      await prisma.media.delete({ where: { id: movieId } });
    });
  });
});
