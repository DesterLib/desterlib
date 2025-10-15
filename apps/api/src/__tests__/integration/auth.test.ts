/**
 * Authentication Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { prisma } from "../../lib/prisma.js";
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
  app.use(errorHandler);
  return app;
}

describe("Authentication", () => {
  const app = createTestApp();
  let testAccessToken: string;
  let testRefreshToken: string;
  let testApiKeyId: string;
  let testApiKey: string;

  // Cleanup before tests
  beforeAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ["testuser", "testadmin", "testpin", "testpasswordless"],
        },
      },
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ["testuser", "testadmin", "testpin", "testpasswordless"],
        },
      },
    });
  });

  describe("POST /auth/register", () => {
    it("should register a new user with password", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User",
        password: "TestPass123",
        role: "USER",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user).toMatchObject({
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User",
        role: "USER",
      });

      testAccessToken = response.body.data.accessToken;
      testRefreshToken = response.body.data.refreshToken;
    });

    it("should register a user with PIN", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        username: "testpin",
        pin: "1234",
        role: "USER",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should register a passwordless user", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        username: "testpasswordless",
        isPasswordless: true,
        role: "GUEST",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should fail with duplicate username", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        username: "testuser",
        password: "TestPass123",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("should fail with weak password", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        username: "weakpass",
        password: "weak",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/login", () => {
    it("should login with valid password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        username: "testuser",
        password: "TestPass123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should login with valid PIN", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        username: "testpin",
        pin: "1234",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should fail with invalid password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        username: "testuser",
        password: "WrongPass123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail with non-existent user", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        username: "nonexistent",
        password: "TestPass123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/login/passwordless", () => {
    it("should login passwordless user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login/passwordless")
        .send({
          username: "testpasswordless",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should fail for non-passwordless user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login/passwordless")
        .send({
          username: "testuser",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh access token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: testRefreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");

      // Update tokens
      testAccessToken = response.body.data.accessToken;
      testRefreshToken = response.body.data.refreshToken;
    });

    it("should fail with invalid refresh token", async () => {
      const response = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: "invalid-token",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /auth/me", () => {
    it("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        username: "testuser",
        email: "test@example.com",
      });
    });

    it("should fail without token", async () => {
      const response = await request(app).get("/api/v1/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /auth/me", () => {
    it("should update current user", async () => {
      const response = await request(app)
        .put("/api/v1/auth/me")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({
          displayName: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe("Updated Name");
    });
  });

  describe("POST /auth/change-password", () => {
    it("should change password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({
          currentPassword: "TestPass123",
          newPassword: "NewTestPass456",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should login with new password", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        username: "testuser",
        password: "NewTestPass456",
      });

      expect(response.status).toBe(200);
      testAccessToken = response.body.data.accessToken;
    });
  });

  describe("API Keys", () => {
    describe("POST /auth/api-keys", () => {
      it("should create an API key", async () => {
        const response = await request(app)
          .post("/api/v1/auth/api-keys")
          .set("Authorization", `Bearer ${testAccessToken}`)
          .send({
            name: "Test API Key",
            scopes: ["media:read", "media:write"],
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.apiKey).toHaveProperty("key");
        expect(response.body.data.apiKey.name).toBe("Test API Key");

        testApiKeyId = response.body.data.apiKey.id;
        testApiKey = response.body.data.apiKey.key;
      });
    });

    describe("GET /auth/api-keys", () => {
      it("should list API keys", async () => {
        const response = await request(app)
          .get("/api/v1/auth/api-keys")
          .set("Authorization", `Bearer ${testAccessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.apiKeys).toBeInstanceOf(Array);
        expect(response.body.data.apiKeys.length).toBeGreaterThan(0);
      });
    });

    describe("GET /auth/me with API key", () => {
      it("should authenticate with API key", async () => {
        const response = await request(app)
          .get("/api/v1/auth/me")
          .set("X-API-Key", testApiKey);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe("PUT /auth/api-keys/:keyId", () => {
      it("should update API key", async () => {
        const response = await request(app)
          .put(`/api/v1/auth/api-keys/${testApiKeyId}`)
          .set("Authorization", `Bearer ${testAccessToken}`)
          .send({
            name: "Updated API Key",
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.apiKey.name).toBe("Updated API Key");
      });
    });

    describe("POST /auth/api-keys/:keyId/revoke", () => {
      it("should revoke API key", async () => {
        const response = await request(app)
          .post(`/api/v1/auth/api-keys/${testApiKeyId}/revoke`)
          .set("Authorization", `Bearer ${testAccessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.apiKey.isActive).toBe(false);
      });

      it("should fail to authenticate with revoked key", async () => {
        const response = await request(app)
          .get("/api/v1/auth/me")
          .set("X-API-Key", testApiKey);

        expect(response.status).toBe(401);
      });
    });
  });

  describe("Session Management", () => {
    describe("GET /auth/sessions", () => {
      it("should list active sessions", async () => {
        const response = await request(app)
          .get("/api/v1/auth/sessions")
          .set("Authorization", `Bearer ${testAccessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sessions).toBeInstanceOf(Array);
      });
    });

    describe("POST /auth/logout", () => {
      it("should logout current session", async () => {
        const response = await request(app)
          .post("/api/v1/auth/logout")
          .set("Authorization", `Bearer ${testAccessToken}`)
          .send({
            refreshToken: testRefreshToken,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
