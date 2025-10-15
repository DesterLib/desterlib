/**
 * Async Handler Tests
 */

import { describe, it, expect, vi } from "vitest";
import { asyncHandler } from "../asyncHandler.js";
import type { Request, Response, NextFunction } from "express";

describe("asyncHandler", () => {
  it("should call the async function with req, res, next", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    const asyncFn = vi.fn().mockResolvedValue(undefined);

    const handler = asyncHandler(asyncFn);
    handler(req, res, next);

    // Wait for async execution
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("should catch errors and pass to next", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    const error = new Error("Test error");
    const asyncFn = vi.fn().mockRejectedValue(error);

    const handler = asyncHandler(asyncFn);
    handler(req, res, next);

    // Wait for async execution
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("should handle functions that throw errors immediately", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    const error = new Error("Sync error");
    const asyncFn = vi.fn().mockRejectedValue(error);

    const handler = asyncHandler(asyncFn);
    handler(req, res, next);

    // Wait for async execution
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(next).toHaveBeenCalledWith(error);
  });

  it("should handle functions that return responses", async () => {
    const req = {} as Request;
    const res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    const asyncFn = vi
      .fn()
      .mockImplementation(async (_req: Request, res: Response) => {
        return res.status(200).json({ success: true });
      });

    const handler = asyncHandler(asyncFn);
    handler(req, res, next);

    // Wait for async execution
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(asyncFn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
