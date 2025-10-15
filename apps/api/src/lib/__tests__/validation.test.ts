/**
 * Validation Middleware Tests
 */

import { describe, it, expect, vi } from "vitest";
import { validateRequest, commonSchemas } from "../validation.js";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

describe("validateRequest", () => {
  it("should validate body successfully", async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const req = {
      body: { name: "John", email: "john@example.com" },
      query: {},
      params: {},
    } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({ body: schema });
    await middleware(req, res, next);

    expect(req.body).toEqual({ name: "John", email: "john@example.com" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should throw BadRequestError for invalid body", async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const req = {
      body: { name: "John", email: "invalid-email" },
      query: {},
      params: {},
    } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({ body: schema });

    await expect(async () => {
      await middleware(req, res, next);
    }).rejects.toThrow("Validation failed");
  });

  it("should validate query parameters", async () => {
    const schema = z.object({
      page: z.coerce.number().int().positive(),
    });

    const req = {
      body: {},
      query: { page: "2" },
      params: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({ query: schema });
    await middleware(req, res, next);

    expect(req.query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });

  it("should validate URL parameters", async () => {
    const schema = z.object({
      id: z.string().min(1),
    });

    const req = {
      body: {},
      query: {},
      params: { id: "123" },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({ params: schema });
    await middleware(req, res, next);

    expect(req.params).toEqual({ id: "123" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should validate multiple parts simultaneously", async () => {
    const bodySchema = z.object({ name: z.string() });
    const querySchema = z.object({ filter: z.string().optional() });
    const paramsSchema = z.object({ id: z.string() });

    const req = {
      body: { name: "Test" },
      query: { filter: "active" },
      params: { id: "123" },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({
      body: bodySchema,
      query: querySchema,
      params: paramsSchema,
    });
    await middleware(req, res, next);

    expect(req.body).toEqual({ name: "Test" });
    expect(req.query).toEqual({ filter: "active" });
    expect(req.params).toEqual({ id: "123" });
    expect(next).toHaveBeenCalledWith();
  });
});

describe("commonSchemas", () => {
  it("should validate pagination with defaults", () => {
    const result = commonSchemas.pagination.parse({});
    expect(result).toEqual({ limit: 50, offset: 0 });
  });

  it("should validate pagination with custom values", () => {
    const result = commonSchemas.pagination.parse({
      limit: "20",
      offset: "10",
    });
    expect(result).toEqual({ limit: 20, offset: 10 });
  });

  it("should enforce max limit", () => {
    expect(() => {
      commonSchemas.pagination.parse({ limit: "200" });
    }).toThrow();
  });

  it("should validate id parameter", () => {
    const result = commonSchemas.id.parse({ id: "test-id" });
    expect(result).toEqual({ id: "test-id" });
  });

  it("should validate slug parameter", () => {
    const result = commonSchemas.slug.parse({ slug: "test-slug" });
    expect(result).toEqual({ slug: "test-slug" });
  });

  it("should validate slugOrId parameter", () => {
    const result = commonSchemas.slugOrId.parse({ slugOrId: "test-123" });
    expect(result).toEqual({ slugOrId: "test-123" });
  });

  it("should validate search query", () => {
    const result = commonSchemas.search.parse({ q: "search term" });
    expect(result).toEqual({ q: "search term" });
  });

  it("should reject empty search query", () => {
    expect(() => {
      commonSchemas.search.parse({ q: "" });
    }).toThrow();
  });
});
