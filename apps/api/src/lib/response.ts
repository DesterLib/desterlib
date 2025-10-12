import type { NextFunction, Request, Response } from "express";

export type SuccessEnvelope<T> = {
  success: true;
  requestId: string;
  data: T;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Augment Response with jsonOk helper
    interface Response {
      jsonOk: <T>(data: T, statusCode?: number) => void;
    }
  }
}

export function responseEnhancerMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.jsonOk = function jsonOk<T>(data: T, statusCode = 200): void {
    const requestIdHeader = res.getHeader("x-request-id");
    const requestId =
      (Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader) ??
      "unknown";
    const payload: SuccessEnvelope<T> = {
      success: true,
      requestId: String(requestId),
      data,
    };
    res.status(statusCode).json(payload);
  };
  next();
}
