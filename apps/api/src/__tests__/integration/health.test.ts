/**
 * Health Endpoint Integration Tests
 */

import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { healthController } from "../../routes/health/health.controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { responseEnhancerMiddleware } from "../../lib/response.js";
import { requestContextMiddleware } from "../../lib/requestContext.js";

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use(responseEnhancerMiddleware);

  app.get(
    "/health",
    asyncHandler(healthController.health.bind(healthController))
  );
  app.get(
    "/health/ready",
    asyncHandler(healthController.ready.bind(healthController))
  );
  app.get(
    "/health/live",
    asyncHandler(healthController.live.bind(healthController))
  );

  return app;
}

describe("Health Endpoints", () => {
  const app = createTestApp();

  describe("GET /health", () => {
    it("should return 200 with health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: "ok",
          uptime: expect.any(Number),
          timestamp: expect.any(String),
        },
      });
      expect(response.body.requestId).toBeDefined();
    });

    it("should return valid ISO timestamp", async () => {
      const response = await request(app).get("/health");

      const timestamp = response.body.data.timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it("should have positive uptime", async () => {
      const response = await request(app).get("/health");

      expect(response.body.data.uptime).toBeGreaterThan(0);
    });
  });

  describe("GET /health/ready", () => {
    it("should return 200 when ready", async () => {
      const response = await request(app).get("/health/ready");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: "ready",
          timestamp: expect.any(String),
          checks: {
            database: true,
          },
        },
      });
    });

    it("should include database check", async () => {
      const response = await request(app).get("/health/ready");

      expect(response.body.data.checks).toHaveProperty("database");
      expect(typeof response.body.data.checks.database).toBe("boolean");
    });
  });

  describe("GET /health/live", () => {
    it("should return 200 with liveness status", async () => {
      const response = await request(app).get("/health/live");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: "alive",
          timestamp: expect.any(String),
          pid: expect.any(Number),
          memory: expect.any(Object),
        },
      });
    });

    it("should include memory usage", async () => {
      const response = await request(app).get("/health/live");

      const memory = response.body.data.memory;
      expect(memory).toHaveProperty("rss");
      expect(memory).toHaveProperty("heapTotal");
      expect(memory).toHaveProperty("heapUsed");
      expect(memory).toHaveProperty("external");
    });

    it("should have valid process ID", async () => {
      const response = await request(app).get("/health/live");

      expect(response.body.data.pid).toBeGreaterThan(0);
      expect(response.body.data.pid).toBe(process.pid);
    });
  });

  describe("Request Context", () => {
    it("should include x-request-id header", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-request-id"]).toBeDefined();
      expect(typeof response.headers["x-request-id"]).toBe("string");
    });

    it("should preserve custom x-request-id", async () => {
      const customId = "custom-id-123";
      const response = await request(app)
        .get("/health")
        .set("x-request-id", customId);

      expect(response.headers["x-request-id"]).toBe(customId);
      expect(response.body.requestId).toBe(customId);
    });
  });
});
