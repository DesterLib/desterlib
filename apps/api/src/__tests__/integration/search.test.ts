/**
 * Search Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { prisma } from "../../lib/prisma.js";
import searchRouter from "../../routes/search/search.module.js";
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
  app.use("/api/v1/search", searchRouter);
  app.use(errorHandler);
  return app;
}

describe("Search API", () => {
  const app = createTestApp();
  let testAccessToken: string;
  const testMediaIds: string[] = [];

  beforeAll(async () => {
    // Create test user
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "searchtest",
        password: "TestPass123",
        email: "searchtest@example.com",
        role: "USER",
      });

    testAccessToken = registerResponse.body.data.accessToken;

    // Create test media for searching
    const testMedia = [
      {
        title: "The Matrix",
        type: "MOVIE",
        description:
          "A computer hacker learns about the true nature of reality",
      },
      {
        title: "Matrix Reloaded",
        type: "MOVIE",
        description: "Neo and the rebel leaders continue their fight",
      },
      {
        title: "Breaking Bad",
        type: "TV_SHOW",
        description: "A chemistry teacher turned drug lord",
      },
      {
        title: "Better Call Saul",
        type: "TV_SHOW",
        description: "The story of lawyer Jimmy McGill",
      },
    ];

    for (const media of testMedia) {
      const created = await prisma.media.create({
        data: media as any,
      });
      testMediaIds.push(created.id);
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.media.deleteMany({
      where: { id: { in: testMediaIds } },
    });
    await prisma.user.deleteMany({
      where: { username: "searchtest" },
    });
  });

  describe("GET /search", () => {
    it("should search all media types", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=matrix")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.results)).toBe(true);

      const results = response.body.data.results;
      expect(results.length).toBeGreaterThan(0);

      // Check that results contain "matrix"
      const hasMatrixInTitle = results.some((r: any) =>
        r.title.toLowerCase().includes("matrix")
      );
      expect(hasMatrixInTitle).toBe(true);
    });

    it("should filter by type", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=matrix&type=MOVIE")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      const results = response.body.data.results;

      if (results.length > 0) {
        expect(results.every((r: any) => r.type === "MOVIE")).toBe(true);
      }
    });

    it("should respect limit parameter", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=matrix&limit=1")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.results.length).toBeLessThanOrEqual(1);
    });

    it("should search in description", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=hacker")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      const results = response.body.data.results;

      if (results.length > 0) {
        const hasHackerInDescription = results.some(
          (r: any) =>
            r.description && r.description.toLowerCase().includes("hacker")
        );
        expect(hasHackerInDescription).toBe(true);
      }
    });

    it("should return empty results for non-existent query", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=nonexistenttitle12345xyz")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.results).toEqual([]);
    });

    it("should require authentication", async () => {
      const response = await request(app).get("/api/v1/search?q=matrix");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should validate query parameter", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle special characters", async () => {
      const response = await request(app)
        .get("/api/v1/search?q=matrix%20reloaded")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should be case-insensitive", async () => {
      const response1 = await request(app)
        .get("/api/v1/search?q=MATRIX")
        .set("Authorization", `Bearer ${testAccessToken}`);

      const response2 = await request(app)
        .get("/api/v1/search?q=matrix")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.results.length).toBeGreaterThan(0);
      expect(response1.body.data.results.length).toBe(
        response2.body.data.results.length
      );
    });
  });
});
