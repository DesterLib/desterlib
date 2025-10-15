/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 * This is a modern, token-based approach that doesn't require server-side session storage.
 *
 * How it works:
 * 1. Server generates a random CSRF token and sends it in a cookie
 * 2. Client reads the cookie and includes the token in a header (X-CSRF-Token)
 * 3. Server validates that the cookie matches the header
 *
 * Note: This only protects cookie-based sessions. JWT Bearer tokens in
 * Authorization header are already protected from CSRF by same-origin policy.
 */

import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "./errors.js";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

// HTTP methods that require CSRF protection (state-changing operations)
const PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Routes that don't need CSRF protection
const CSRF_EXEMPT_ROUTES = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/login/passwordless",
  "/health",
  "/metrics",
  "/api-docs",
];

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Verify CSRF token matches between cookie and header
 */
function verifyCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    // Length mismatch or other error
    return false;
  }
}

/**
 * Check if route is exempt from CSRF protection
 */
function isExemptRoute(path: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Check if request uses JWT Bearer authentication
 * JWT in Authorization header is already protected from CSRF
 */
function usesJwtAuth(req: Request): boolean {
  const authHeader = req.headers.authorization;
  return !!authHeader && authHeader.startsWith("Bearer ");
}

/**
 * Check if request uses API Key authentication
 * API keys in headers are already protected from CSRF
 */
function usesApiKeyAuth(req: Request): boolean {
  return !!req.headers["x-api-key"];
}

/**
 * Middleware to generate and set CSRF token cookie
 * Should be applied early in the middleware chain
 */
export function csrfCookieMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only set cookie if it doesn't exist or is invalid
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME];

  if (!existingToken || existingToken.length !== CSRF_TOKEN_LENGTH * 2) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Strict same-site policy
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  next();
}

/**
 * Middleware to validate CSRF token
 * Should be applied to routes that need protection
 */
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (!PROTECTED_METHODS.includes(req.method)) {
      return next();
    }

    // Skip CSRF check for exempt routes
    if (isExemptRoute(req.path)) {
      return next();
    }

    // Skip CSRF check if using JWT or API Key authentication
    // These are already protected from CSRF attacks
    if (usesJwtAuth(req) || usesApiKeyAuth(req)) {
      return next();
    }

    // Get tokens from cookie and header
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

    // Validate tokens
    if (!verifyCsrfToken(cookieToken, headerToken)) {
      logger.warn("CSRF token validation failed", {
        method: req.method,
        path: req.path,
        ip: req.ip,
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
      });

      throw new ForbiddenError("Invalid CSRF token");
    }

    // Token is valid
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Endpoint to get CSRF token for clients
 * Clients can call this to get the token before making authenticated requests
 */
export function csrfTokenHandler(req: Request, res: Response): void {
  const token = req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();

  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  res.jsonOk({
    csrfToken: token,
    headerName: CSRF_HEADER_NAME,
  });
}

/**
 * Optional: Middleware that requires CSRF token for ALL requests
 * Use this for stricter protection on specific routes
 */
export function strictCsrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Always require CSRF for state-changing methods, even with JWT/API Key
    if (!PROTECTED_METHODS.includes(req.method)) {
      return next();
    }

    // Skip only for truly exempt routes
    if (isExemptRoute(req.path)) {
      return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

    if (!verifyCsrfToken(cookieToken, headerToken)) {
      throw new ForbiddenError("Invalid CSRF token");
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Add CSRF token to response for API responses
 * Useful for SPAs that need to get the token
 */
export function addCsrfTokenToResponse(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const originalJsonOk = _res.jsonOk;

  _res.jsonOk = function <T>(data: T, statusCode = 200): void {
    const token = req.cookies?.[CSRF_COOKIE_NAME];
    const responseData = {
      ...data,
      _csrf: token,
    } as T;

    return originalJsonOk.call(this, responseData, statusCode);
  };

  next();
}
