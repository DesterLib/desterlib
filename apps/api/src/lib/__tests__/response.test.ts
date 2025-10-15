/**
 * Response Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { responseEnhancerMiddleware } from "../response.js";
import type { Request, Response, NextFunction } from "express";

describe("responseEnhancerMiddleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = {
      getHeader: vi.fn().mockReturnValue("test-request-id"),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    next = vi.fn() as NextFunction;
  });

  it("should add jsonOk method to response", () => {
    responseEnhancerMiddleware(req, res, next);

    expect(res.jsonOk).toBeDefined();
    expect(typeof res.jsonOk).toBe("function");
    expect(next).toHaveBeenCalled();
  });

  it("should send success response with 200 status by default", () => {
    responseEnhancerMiddleware(req, res, next);

    const data = { message: "Success" };
    res.jsonOk(data);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      requestId: "test-request-id",
      data,
    });
  });

  it("should send success response with custom status code", () => {
    responseEnhancerMiddleware(req, res, next);

    const data = { id: "123" };
    res.jsonOk(data, 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      requestId: "test-request-id",
      data,
    });
  });

  it("should handle array request IDs", () => {
    res.getHeader = vi.fn().mockReturnValue(["req-1", "req-2"]);
    responseEnhancerMiddleware(req, res, next);

    res.jsonOk({ test: true });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      requestId: "req-1",
      data: { test: true },
    });
  });

  it("should handle missing request ID", () => {
    res.getHeader = vi.fn().mockReturnValue(undefined);
    responseEnhancerMiddleware(req, res, next);

    res.jsonOk({ test: true });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      requestId: "unknown",
      data: { test: true },
    });
  });

  it("should handle different data types", () => {
    responseEnhancerMiddleware(req, res, next);

    // String
    res.jsonOk("success");
    expect(res.json).toHaveBeenLastCalledWith({
      success: true,
      requestId: "test-request-id",
      data: "success",
    });

    // Array
    res.jsonOk([1, 2, 3]);
    expect(res.json).toHaveBeenLastCalledWith({
      success: true,
      requestId: "test-request-id",
      data: [1, 2, 3],
    });

    // Null
    res.jsonOk(null);
    expect(res.json).toHaveBeenLastCalledWith({
      success: true,
      requestId: "test-request-id",
      data: null,
    });
  });
});
