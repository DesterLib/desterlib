import type { Request, Response, NextFunction } from "express";

export type RequestContext = {
  requestId: string;
  startTimeMs: number;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

function generateRequestId(): string {
  // Simple, deterministic-enough request id for small services
  // Format: epochMs-rand36
  const epochMs = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${epochMs}-${rand}`;
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const existingId = req.header("x-request-id");
  const requestId =
    existingId && existingId.trim() !== "" ? existingId : generateRequestId();
  req.context = { requestId, startTimeMs: Date.now() };
  res.setHeader("x-request-id", requestId);
  next();
}
