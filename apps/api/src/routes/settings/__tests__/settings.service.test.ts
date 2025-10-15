/**
 * Settings Service Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SettingsService } from "../settings.service.js";
import { MediaType } from "../../../generated/prisma/index.js";
import { prisma } from "../../../lib/prisma.js";

describe("SettingsService", () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService();
  });

  describe("getSettings", () => {
    it("should create default settings if none exist", async () => {
      const settings = await service.getSettings();

      expect(settings.id).toBe("default");
      expect(settings.isSetupComplete).toBe(false);
      expect(settings.libraries).toEqual([]);
    });

    it("should return existing settings", async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
          tmdbApiKey: "test-key",
        },
      });

      const settings = await service.getSettings();

      expect(settings.isSetupComplete).toBe(true);
      expect(settings.tmdbApiKey).toBe("test-key");
    });

    it("should include libraries", async () => {
      const settings = await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
        },
      });

      await prisma.collection.create({
        data: {
          name: "Movies",
          slug: "movies",
          isLibrary: true,
          libraryPath: "/movies",
          libraryType: MediaType.MOVIE,
          settingsId: settings.id,
        },
      });

      const result = await service.getSettings();

      expect(result.libraries).toHaveLength(1);
      expect(result.libraries[0]?.name).toBe("Movies");
    });
  });

  describe("isSetupComplete", () => {
    it("should return false for new installation", async () => {
      const isComplete = await service.isSetupComplete();

      expect(isComplete).toBe(false);
    });

    it("should return true when setup is complete", async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
        },
      });

      const isComplete = await service.isSetupComplete();

      expect(isComplete).toBe(true);
    });
  });

  describe("completeSetup", () => {
    it("should create settings with libraries", async () => {
      const config = {
        tmdbApiKey: "test-api-key",
        libraries: [
          {
            name: "Movies",
            type: MediaType.MOVIE,
            path: "/movies",
          },
          {
            name: "TV Shows",
            type: MediaType.TV_SHOW,
            path: "/tv",
          },
        ],
      };

      const settings = await service.completeSetup(config);

      expect(settings.isSetupComplete).toBe(true);
      expect(settings.tmdbApiKey).toBe("test-api-key");
      expect(settings.libraries).toHaveLength(2);
      expect(settings.libraries[0]?.name).toBe("Movies");
      expect(settings.libraries[0]?.isLibrary).toBe(true);
      expect(settings.libraries[1]?.name).toBe("TV Shows");
    });

    it("should generate slugs for libraries", async () => {
      const config = {
        tmdbApiKey: "key",
        libraries: [
          {
            name: "My Movie Library",
            type: MediaType.MOVIE,
            path: "/movies",
          },
        ],
      };

      const settings = await service.completeSetup(config);

      expect(settings.libraries[0]?.slug).toBe("my-movie-library");
    });

    it("should replace existing settings", async () => {
      // Create old settings
      const oldSettings = await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: false,
          tmdbApiKey: "old-key",
        },
      });

      await prisma.collection.create({
        data: {
          name: "Old Library",
          slug: "old-library",
          isLibrary: true,
          libraryPath: "/old",
          libraryType: MediaType.MOVIE,
          settingsId: oldSettings.id,
        },
      });

      // Complete setup with new data
      const config = {
        tmdbApiKey: "new-key",
        libraries: [
          {
            name: "New Library",
            type: MediaType.TV_SHOW,
            path: "/new",
          },
        ],
      };

      const newSettings = await service.completeSetup(config);

      expect(newSettings.tmdbApiKey).toBe("new-key");
      expect(newSettings.libraries).toHaveLength(1);
      expect(newSettings.libraries[0]?.name).toBe("New Library");

      // Verify old library is gone
      const oldLibrary = await prisma.collection.findFirst({
        where: { name: "Old Library" },
      });
      expect(oldLibrary).toBeNull();
    });
  });

  describe("updateSettings", () => {
    it("should update only TMDB API key", async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
          tmdbApiKey: "old-key",
        },
      });

      const updated = await service.updateSettings({
        tmdbApiKey: "new-key",
      });

      expect(updated.tmdbApiKey).toBe("new-key");
      expect(updated.isSetupComplete).toBe(true);
    });

    it("should update libraries", async () => {
      const settings = await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
        },
      });

      await prisma.collection.create({
        data: {
          name: "Old Library",
          slug: "old-library",
          isLibrary: true,
          libraryPath: "/old",
          libraryType: MediaType.MOVIE,
          settingsId: settings.id,
        },
      });

      const updated = await service.updateSettings({
        libraries: [
          {
            name: "New Library",
            type: MediaType.TV_SHOW,
            path: "/new",
          },
        ],
      });

      expect(updated.libraries).toHaveLength(1);
      expect(updated.libraries[0]?.name).toBe("New Library");

      // Verify old library replaced
      const allLibraries = await prisma.collection.findMany({
        where: { isLibrary: true },
      });
      expect(allLibraries).toHaveLength(1);
      expect(allLibraries[0]?.name).toBe("New Library");
    });

    it("should update both API key and libraries", async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
          tmdbApiKey: "old-key",
        },
      });

      const updated = await service.updateSettings({
        tmdbApiKey: "new-key",
        libraries: [
          {
            name: "Movies",
            type: MediaType.MOVIE,
            path: "/movies",
          },
        ],
      });

      expect(updated.tmdbApiKey).toBe("new-key");
      expect(updated.libraries).toHaveLength(1);
      expect(updated.libraries[0]?.name).toBe("Movies");
    });
  });
});
