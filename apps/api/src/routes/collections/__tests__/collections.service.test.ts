/**
 * Collections Service Tests
 */

import { describe, it, expect } from "vitest";
import { collectionsService } from "../collections.service.js";
import { NotFoundError } from "../../../lib/errors.js";
import {
  createTestCollection,
  createTestMovie,
} from "../../../__tests__/helpers/testUtils.js";
import { MediaType } from "../../../generated/prisma/index.js";
import { prisma } from "../../../lib/prisma.js";

describe("CollectionsService", () => {
  describe("getCollections", () => {
    it("should return empty array when no collections exist", async () => {
      const collections = await collectionsService.getCollections();

      expect(collections).toEqual([]);
    });

    it("should return all collections with media count", async () => {
      const collection = await createTestCollection({
        name: "Test Collection",
      });

      const movie = await createTestMovie();
      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collection.id,
        },
      });

      const collections = await collectionsService.getCollections();

      expect(collections).toHaveLength(1);
      expect(collections[0]?.id).toBe(collection.id);
      expect(collections[0]?.name).toBe("Test Collection");
      expect(collections[0]?.mediaCount).toBe(1);
    });

    it("should return recent media (max 4)", async () => {
      const collection = await createTestCollection();

      // Create 5 movies
      for (let i = 0; i < 5; i++) {
        const movie = await createTestMovie({ title: `Movie ${i}` });
        await prisma.mediaCollection.create({
          data: {
            mediaId: movie.media.id,
            collectionId: collection.id,
          },
        });
      }

      const collections = await collectionsService.getCollections();

      expect(collections[0]?.recentMedia).toHaveLength(4);
      expect(collections[0]?.mediaCount).toBe(5);
    });
  });

  describe("getCollectionBySlugOrId", () => {
    it("should find collection by ID", async () => {
      const collection = await createTestCollection({
        name: "Test Collection",
        slug: "test-collection",
      });

      const result = await collectionsService.getCollectionBySlugOrId(
        collection.id
      );

      expect(result.id).toBe(collection.id);
      expect(result.name).toBe("Test Collection");
    });

    it("should find collection by slug", async () => {
      const collection = await createTestCollection({
        name: "Test Collection",
        slug: "test-collection",
      });

      const result =
        await collectionsService.getCollectionBySlugOrId("test-collection");

      expect(result.id).toBe(collection.id);
      expect(result.name).toBe("Test Collection");
    });

    it("should throw NotFoundError when collection does not exist", async () => {
      await expect(
        collectionsService.getCollectionBySlugOrId("nonexistent")
      ).rejects.toThrow(NotFoundError);
    });

    it("should include full media details", async () => {
      const collection = await createTestCollection();
      const movie = await createTestMovie({ title: "Test Movie" });

      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collection.id,
        },
      });

      const result = await collectionsService.getCollectionBySlugOrId(
        collection.id
      );

      expect(result.media).toHaveLength(1);
      expect(result.media[0]?.title).toBe("Test Movie");
      expect(result.media[0]?.movie).toBeDefined();
    });
  });

  describe("getLibraries", () => {
    it("should return only libraries", async () => {
      await createTestCollection({ name: "Regular Collection" });
      await createTestCollection({
        name: "Library Collection",
        isLibrary: true,
        libraryPath: "/test/path",
        libraryType: MediaType.MOVIE,
      });

      const libraries = await collectionsService.getLibraries();

      expect(libraries).toHaveLength(1);
      expect(libraries[0]?.name).toBe("Library Collection");
      expect(libraries[0]?.isLibrary).toBe(true);
    });

    it("should return empty array when no libraries exist", async () => {
      await createTestCollection({ name: "Regular Collection" });

      const libraries = await collectionsService.getLibraries();

      expect(libraries).toEqual([]);
    });

    it("should include media count", async () => {
      const library = await createTestCollection({
        isLibrary: true,
        libraryPath: "/test",
        libraryType: MediaType.MOVIE,
      });

      const movie = await createTestMovie();
      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: library.id,
        },
      });

      const libraries = await collectionsService.getLibraries();

      expect(libraries[0]?.mediaCount).toBe(1);
    });
  });

  describe("getStatistics", () => {
    it("should return zero counts when no collections exist", async () => {
      const stats = await collectionsService.getStatistics();

      expect(stats).toEqual({
        total: 0,
        withMedia: 0,
        empty: 0,
      });
    });

    it("should count collections correctly", async () => {
      // Create empty collection
      await createTestCollection({ name: "Empty" });

      // Create collection with media
      const collection = await createTestCollection({ name: "With Media" });
      const movie = await createTestMovie();
      await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collection.id,
        },
      });

      const stats = await collectionsService.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.withMedia).toBe(1);
      expect(stats.empty).toBe(1);
    });
  });

  describe("deleteCollection", () => {
    it("should delete collection successfully", async () => {
      const collection = await createTestCollection({ name: "To Delete" });

      const result = await collectionsService.deleteCollection(collection.id);

      expect(result.id).toBe(collection.id);
      expect(result.name).toBe("To Delete");

      // Verify deletion
      const found = await prisma.collection.findUnique({
        where: { id: collection.id },
      });
      expect(found).toBeNull();
    });

    it("should throw NotFoundError when collection does not exist", async () => {
      await expect(
        collectionsService.deleteCollection("nonexistent-id")
      ).rejects.toThrow(NotFoundError);
    });

    it("should cascade delete media associations", async () => {
      const collection = await createTestCollection();
      const movie = await createTestMovie();
      const mc = await prisma.mediaCollection.create({
        data: {
          mediaId: movie.media.id,
          collectionId: collection.id,
        },
      });

      await collectionsService.deleteCollection(collection.id);

      // Verify cascade deletion
      const found = await prisma.mediaCollection.findUnique({
        where: { id: mc.id },
      });
      expect(found).toBeNull();
    });
  });
});
