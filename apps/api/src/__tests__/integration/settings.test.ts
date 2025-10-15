/**
 * Settings Endpoint Integration Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { settingsController } from "../../routes/settings/settings.controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { responseEnhancerMiddleware } from "../../lib/response.js";
import { requestContextMiddleware } from "../../lib/requestContext.js";
import { errorHandler, notFoundHandler } from "../../lib/errorHandler.js";
import { validateRequest } from "../../lib/validation.js";
import {
  completeSetupSchema,
  updateSettingsSchema,
} from "../../routes/settings/settings.schemas.js";
import { MediaType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use(responseEnhancerMiddleware);

  app.get(
    "/api/v1/settings",
    asyncHandler(settingsController.getSettings.bind(settingsController))
  );
  app.get(
    "/api/v1/settings/setup-status",
    asyncHandler(settingsController.getSetupStatus.bind(settingsController))
  );
  app.post(
    "/api/v1/settings/complete-setup",
    validateRequest({ body: completeSetupSchema }),
    asyncHandler(settingsController.completeSetup.bind(settingsController))
  );
  app.put(
    "/api/v1/settings",
    validateRequest({ body: updateSettingsSchema }),
    asyncHandler(settingsController.updateSettings.bind(settingsController))
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe("Settings Endpoints", () => {
  const app = createTestApp();

  describe("GET /api/v1/settings", () => {
    it("should create and return default settings", async () => {
      const response = await request(app).get("/api/v1/settings");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toMatchObject({
        id: "default",
        isSetupComplete: false,
      });
    });

    it("should return existing settings", async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
          tmdbApiKey: "test-key",
        },
      });

      const response = await request(app).get("/api/v1/settings");

      expect(response.body.data.settings.isSetupComplete).toBe(true);
      expect(response.body.data.settings.tmdbApiKey).toBe("test-key");
    });

    it("should include libraries", async () => {
      const settings = await prisma.settings.create({
        data: { id: "default" },
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

      const response = await request(app).get("/api/v1/settings");

      expect(response.body.data.settings.libraries).toHaveLength(1);
      expect(response.body.data.settings.libraries[0].name).toBe("Movies");
    });
  });

  describe("GET /api/v1/settings/setup-status", () => {
    it("should return incomplete for new installation", async () => {
      const response = await request(app).get("/api/v1/settings/setup-status");

      expect(response.status).toBe(200);
      expect(response.body.data.isSetupComplete).toBe(false);
    });

    it("should return complete when setup is done", async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
        },
      });

      const response = await request(app).get("/api/v1/settings/setup-status");

      expect(response.body.data.isSetupComplete).toBe(true);
    });
  });

  describe("POST /api/v1/settings/complete-setup", () => {
    it("should complete setup successfully", async () => {
      const setupData = {
        tmdbApiKey: "test-api-key",
        libraries: [
          {
            name: "Movies",
            type: "MOVIE",
            path: "/movies",
          },
          {
            name: "TV Shows",
            type: "TV_SHOW",
            path: "/tv",
          },
        ],
      };

      const response = await request(app)
        .post("/api/v1/settings/complete-setup")
        .send(setupData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.isSetupComplete).toBe(true);
      expect(response.body.data.settings.tmdbApiKey).toBe("test-api-key");
      expect(response.body.data.settings.libraries).toHaveLength(2);
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/settings/complete-setup")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    it("should validate library structure", async () => {
      const response = await request(app)
        .post("/api/v1/settings/complete-setup")
        .send({
          tmdbApiKey: "key",
          libraries: [
            {
              name: "Movies",
              // missing type and path
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it("should validate media type enum", async () => {
      const response = await request(app)
        .post("/api/v1/settings/complete-setup")
        .send({
          tmdbApiKey: "key",
          libraries: [
            {
              name: "Movies",
              type: "INVALID_TYPE",
              path: "/movies",
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/v1/settings", () => {
    beforeEach(async () => {
      await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: true,
          tmdbApiKey: "old-key",
        },
      });
    });

    it("should update TMDB API key", async () => {
      const response = await request(app).put("/api/v1/settings").send({
        tmdbApiKey: "new-key",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.settings.tmdbApiKey).toBe("new-key");
    });

    it("should update libraries", async () => {
      const response = await request(app)
        .put("/api/v1/settings")
        .send({
          libraries: [
            {
              name: "New Library",
              type: "MOVIE",
              path: "/new",
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.settings.libraries).toHaveLength(1);
      expect(response.body.data.settings.libraries[0].name).toBe("New Library");
    });

    it("should allow updating both", async () => {
      const response = await request(app)
        .put("/api/v1/settings")
        .send({
          tmdbApiKey: "updated-key",
          libraries: [
            {
              name: "Updated Library",
              type: "TV_SHOW",
              path: "/updated",
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.settings.tmdbApiKey).toBe("updated-key");
      expect(response.body.data.settings.libraries).toHaveLength(1);
    });

    it("should validate at least one field is provided", async () => {
      const response = await request(app).put("/api/v1/settings").send({});

      expect(response.status).toBe(400);
    });
  });
});
