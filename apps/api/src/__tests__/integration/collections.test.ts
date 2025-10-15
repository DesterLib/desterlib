/**
 * Collections Endpoint Integration Tests
 */

import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { collectionsController } from "../../routes/collections/collections.controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { responseEnhancerMiddleware } from "../../lib/response.js";
import { requestContextMiddleware } from "../../lib/requestContext.js";
import { errorHandler, notFoundHandler } from "../../lib/errorHandler.js";
import { createTestCollection, createTestMovie } from "../helpers/testUtils.js";
import { prisma } from "../../lib/prisma.js";
import { MediaType } from "../../generated/prisma/index.js";

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use(responseEnhancerMiddleware);

  app.get(
    "/api/v1/collections",
    asyncHandler(
      collectionsController.getCollections.bind(collectionsController)
    )
  );
  app.get(
    "/api/v1/collections/statistics",
    asyncHandler(
      collectionsController.getStatistics.bind(collectionsController)
    )
  );
  app.get(
    "/api/v1/collections/libraries",
    asyncHandler(collectionsController.getLibraries.bind(collectionsController))
  );
  app.get(
    "/api/v1/collections/:slugOrId",
    asyncHandler(
      collectionsController.getCollectionBySlugOrId.bind(collectionsController)
    )
  );
  app.delete(
    "/api/v1/collections/:id",
    asyncHandler(
      collectionsController.deleteCollection.bind(collectionsController)
    )
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe("Collections Endpoints", () => {
  const app = createTestApp();

  describe("GET /api/v1/collections", () => {
    it("should return empty array when no collections", async () => {
      const response = await request(app).get("/api/v1/collections");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.collections).toEqual([]);
    });

    it("should return all collections", async () => {
      await createTestCollection({ name: "Collection 1" });
      await createTestCollection({ name: "Collection 2" });

      const response = await request(app).get("/api/v1/collections");

      expect(response.status).toBe(200);
      expect(response.body.data.collections).toHaveLength(2);
      expect(response.body.data.message).toContain("Found 2 collections");
    });

    it("should include media count", async () => {
      const collection = await createTestCollection();
      const movie = await createTestMovie();

      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collection.id,
        },
      });

      const response = await request(app).get("/api/v1/collections");

      expect(response.body.data.collections[0].mediaCount).toBe(1);
    });
  });

  describe("GET /api/v1/collections/:slugOrId", () => {
    it("should get collection by ID", async () => {
      const collection = await createTestCollection({
        name: "Test Collection",
      });

      const response = await request(app).get(
        `/api/v1/collections/${collection.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.collection.id).toBe(collection.id);
      expect(response.body.data.collection.name).toBe("Test Collection");
    });

    it("should get collection by slug", async () => {
      await createTestCollection({
        name: "Test Collection",
        slug: "test-collection",
      });

      const response = await request(app).get(
        "/api/v1/collections/test-collection"
      );

      expect(response.status).toBe(200);
      expect(response.body.data.collection.slug).toBe("test-collection");
    });

    it("should return 404 for non-existent collection", async () => {
      const response = await request(app).get(
        "/api/v1/collections/nonexistent"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });

    it("should include media details", async () => {
      const collection = await createTestCollection();
      const movie = await createTestMovie({ title: "Test Movie" });

      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collection.id,
        },
      });

      const response = await request(app).get(
        `/api/v1/collections/${collection.id}`
      );

      expect(response.body.data.collection.media).toHaveLength(1);
      expect(response.body.data.collection.media[0].title).toBe("Test Movie");
    });
  });

  describe("GET /api/v1/collections/statistics", () => {
    it("should return statistics", async () => {
      await createTestCollection();

      const collectionWithMedia = await createTestCollection();
      const movie = await createTestMovie();
      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collectionWithMedia.id,
        },
      });

      const response = await request(app).get("/api/v1/collections/statistics");

      expect(response.status).toBe(200);
      expect(response.body.data.statistics).toEqual({
        total: 2,
        withMedia: 1,
        empty: 1,
      });
    });
  });

  describe("GET /api/v1/collections/libraries", () => {
    it("should return only libraries", async () => {
      await createTestCollection({ name: "Regular Collection" });
      await createTestCollection({
        name: "Library",
        isLibrary: true,
        libraryPath: "/test",
        libraryType: MediaType.MOVIE,
      });

      const response = await request(app).get("/api/v1/collections/libraries");

      expect(response.status).toBe(200);
      expect(response.body.data.collections).toHaveLength(1);
      expect(response.body.data.collections[0].name).toBe("Library");
      expect(response.body.data.collections[0].isLibrary).toBe(true);
    });
  });

  describe("DELETE /api/v1/collections/:id", () => {
    it("should delete collection", async () => {
      const collection = await createTestCollection({ name: "To Delete" });

      const response = await request(app).delete(
        `/api/v1/collections/${collection.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain("deleted successfully");

      // Verify deletion
      const found = await prisma.collection.findUnique({
        where: { id: collection.id },
      });
      expect(found).toBeNull();
    });

    it("should return 404 for non-existent collection", async () => {
      const response = await request(app).delete(
        "/api/v1/collections/nonexistent"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
