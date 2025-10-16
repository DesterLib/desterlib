/**
 * Authentication Middleware
 *
 * Provides middleware for protecting routes with better-auth sessions, API keys, and role-based access
 */

import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../errors.js";
import { verifyApiKey, validateApiKeyFormat } from "./auth.utils.js";
import { prisma } from "../prisma.js";
import logger from "../../config/logger.js";
import type { UserRole } from "../../generated/prisma/index.js";

// Extend Express Request to include user info
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: UserRole;
        isPasswordless: boolean;
      };
      apiKey?: {
        id: string;
        name: string;
        userId: string;
        scopes: string[];
      };
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Better-Auth Session Authentication
// ────────────────────────────────────────────────────────────────────────────

/**
 * Require better-auth session authentication
 * Validates session cookie and attaches user to request
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let userId: string | undefined;

    // Extract session token from cookies - try multiple possible cookie names
    const sessionTokenCookie =
      req.cookies?.["better-auth.session_token"] ||
      req.cookies?.["session-token"] ||
      req.cookies?.["session"] ||
      req.cookies?.["better_auth.session_token"];

    if (sessionTokenCookie) {
      // Better-auth cookies contain {token}.{signature}
      // Extract just the token part (before the dot)
      const sessionToken = sessionTokenCookie.split(".")[0];

      // Find session in database
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: {
          userId: true,
          expiresAt: true,
        },
      });

      if (session && session.expiresAt > new Date()) {
        userId = session.userId;
      }
    }

    if (!userId) {
      throw new UnauthorizedError("No valid session found");
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        isLocked: true,
        isPasswordless: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    if (user.isLocked) {
      throw new UnauthorizedError("Account is locked");
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      isPasswordless: user.isPasswordless,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// API Key Authentication
// ────────────────────────────────────────────────────────────────────────────

/**
 * Require API key authentication
 * Validates API key from header and attaches key info to request
 */
export async function requireApiKey(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract API key from X-API-Key header
    const apiKey = req.headers["x-api-key"] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedError("No API key provided");
    }

    // Validate format
    if (!validateApiKeyFormat(apiKey)) {
      throw new UnauthorizedError("Invalid API key format");
    }

    // Find all active API keys and verify
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            isLocked: true,
            isPasswordless: true,
          },
        },
      },
    });

    let matchedKey: (typeof apiKeys)[0] | null = null;

    // Check each key (we can't query by hash, so we need to verify each)
    for (const key of apiKeys) {
      const isValid = await verifyApiKey(apiKey, key.keyHash);
      if (isValid) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      throw new UnauthorizedError("Invalid API key");
    }

    // Check if key is expired
    if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
      throw new UnauthorizedError("API key has expired");
    }

    // Check if user is active
    if (!matchedKey.user.isActive) {
      throw new UnauthorizedError("User account is deactivated");
    }

    if (matchedKey.user.isLocked) {
      throw new UnauthorizedError("User account is locked");
    }

    // Parse scopes
    let scopes: string[] = [];
    try {
      scopes = JSON.parse(matchedKey.scopes) as string[];
    } catch {
      scopes = ["*"];
    }

    // Attach API key info to request
    req.apiKey = {
      id: matchedKey.id,
      name: matchedKey.name,
      userId: matchedKey.userId,
      scopes,
    };

    // Also attach user info for consistency
    req.user = {
      id: matchedKey.user.id,
      username: matchedKey.user.username,
      role: matchedKey.user.role,
      isPasswordless: matchedKey.user.isPasswordless,
    };

    // Update last used timestamp (async, don't wait)
    prisma.apiKey
      .update({
        where: { id: matchedKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((error) => {
        logger.error("Failed to update API key last used timestamp:", error);
      });

    next();
  } catch (error) {
    next(error);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Combined Authentication (Session or API Key)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Allow authentication via better-auth session or API key
 */
export async function requireAuthOrApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check if API key is provided
  const apiKey = req.headers["x-api-key"];
  if (apiKey) {
    return requireApiKey(req, res, next);
  }

  // Otherwise, check for session
  return requireAuth(req, res, next);
}

// ────────────────────────────────────────────────────────────────────────────
// Optional Authentication
// ────────────────────────────────────────────────────────────────────────────

/**
 * Optional authentication - attaches user if session or API key is valid, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let userId: string | undefined;

    // Try better-auth session
    const sessionTokenCookie =
      req.cookies?.["better-auth.session_token"] ||
      req.cookies?.["session-token"] ||
      req.cookies?.["session"] ||
      req.cookies?.["better_auth.session_token"];

    if (sessionTokenCookie) {
      // Better-auth cookies contain {token}.{signature}
      // Extract just the token part (before the dot)
      const sessionToken = sessionTokenCookie.split(".")[0];

      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: {
          userId: true,
          expiresAt: true,
        },
      });

      if (session && session.expiresAt > new Date()) {
        userId = session.userId;
      }
    }

    // If we have a userId, fetch the user
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          isLocked: true,
          isPasswordless: true,
        },
      });

      if (user && user.isActive && !user.isLocked) {
        req.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          isPasswordless: user.isPasswordless,
        };
      }
    }

    // Try API key if still no user
    if (!req.user) {
      const apiKey = req.headers["x-api-key"] as string | undefined;
      if (apiKey && validateApiKeyFormat(apiKey)) {
        // Similar logic to requireApiKey but non-throwing
        const apiKeys = await prisma.apiKey.findMany({
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                isActive: true,
                isLocked: true,
                isPasswordless: true,
              },
            },
          },
        });

        for (const key of apiKeys) {
          const isValid = await verifyApiKey(apiKey, key.keyHash);
          if (
            isValid &&
            key.user.isActive &&
            !key.user.isLocked &&
            (!key.expiresAt || key.expiresAt > new Date())
          ) {
            req.user = {
              id: key.user.id,
              username: key.user.username,
              role: key.user.role,
              isPasswordless: key.user.isPasswordless,
            };
            break;
          }
        }
      }
    }

    next();
  } catch {
    // Don't throw error for optional auth
    next();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control
// ────────────────────────────────────────────────────────────────────────────

/**
 * Require specific role(s)
 * Must be used after requireAuth or requireApiKey
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new UnauthorizedError("Authentication required before role check")
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Required role: ${roles.join(" or ")}`
        )
      );
    }

    next();
  };
}

/**
 * Require admin role (includes SUPER_ADMIN)
 */
export const requireAdmin = requireRole("SUPER_ADMIN", "ADMIN");

/**
 * Require user or admin role (includes SUPER_ADMIN)
 */
export const requireUserOrAdmin = requireRole("SUPER_ADMIN", "ADMIN", "USER");

// ────────────────────────────────────────────────────────────────────────────
// Scope-Based Access Control (for API keys)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Require specific scope(s) for API key
 * Must be used after requireApiKey
 */
export function requireScope(...scopes: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Skip scope check if authenticated via JWT (not API key)
    if (!req.apiKey) {
      return next();
    }

    const apiKeyScopes = req.apiKey.scopes;

    // Check for wildcard scope
    if (apiKeyScopes.includes("*")) {
      return next();
    }

    // Check if any required scope is present
    const hasScope = scopes.some((scope) => apiKeyScopes.includes(scope));

    if (!hasScope) {
      return next(
        new ForbiddenError(
          `API key missing required scope: ${scopes.join(" or ")}`
        )
      );
    }

    next();
  };
}
