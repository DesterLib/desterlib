/**
 * Authentication Utilities
 *
 * Provides utilities for password hashing, token generation, and verification
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

const SALT_ROUNDS = 12;
const API_KEY_LENGTH = 32; // 32 bytes = 256 bits

// ────────────────────────────────────────────────────────────────────────────
// Password & PIN Hashing
// ────────────────────────────────────────────────────────────────────────────

/**
 * Hash a password or PIN using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password or PIN against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error("Password verification error:", error);
    return false;
  }
}

/**
 * Validate PIN format (4-8 digits)
 */
export function validatePin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one letter and one number
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// JWT Token Management
// ────────────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  type: "access" | "refresh";
}

/**
 * Generate an access token (JWT)
 */
export function generateAccessToken(payload: Omit<JwtPayload, "type">): string {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: "dester-api",
      audience: "dester-client",
    } as jwt.SignOptions
  );
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(
  payload: Omit<JwtPayload, "type">
): string {
  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
      issuer: "dester-api",
      audience: "dester-client",
    } as jwt.SignOptions
  );
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "dester-api",
      audience: "dester-client",
    }) as JwtPayload;

    if (decoded.type !== "access") {
      logger.warn("Invalid token type for access token");
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug("Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid access token:", error.message);
    } else {
      logger.error(
        "Access token verification error:",
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET, {
      issuer: "dester-api",
      audience: "dester-client",
    }) as JwtPayload;

    if (decoded.type !== "refresh") {
      logger.warn("Invalid token type for refresh token");
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug("Refresh token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid refresh token:", error.message);
    } else {
      logger.error(
        "Refresh token verification error:",
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return null;
  }
}

/**
 * Decode a JWT without verification (for inspecting expired tokens)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    logger.error("Token decode error:", error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// API Key Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new API key
 * Returns both the raw key (to show user once) and the hash (to store)
 */
export async function generateApiKey(): Promise<{
  key: string; // Full key to show user
  keyHash: string; // Hash to store in database
  keyPrefix: string; // Prefix for identification
}> {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const rawKey = randomBytes.toString("base64url");

  // Create the full key with prefix
  const key = `${env.API_KEY_PREFIX}_${rawKey}`;

  // Hash the full key for storage
  const keyHash = await bcrypt.hash(key, SALT_ROUNDS);

  // Extract prefix for identification (first 12 chars after prefix)
  const keyPrefix = `${env.API_KEY_PREFIX}_${rawKey.substring(0, 12)}`;

  return {
    key,
    keyHash,
    keyPrefix,
  };
}

/**
 * Verify an API key against a hash
 */
export async function verifyApiKey(
  key: string,
  keyHash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(key, keyHash);
  } catch (error) {
    logger.error("API key verification error:", error);
    return false;
  }
}

/**
 * Extract the prefix from an API key
 */
export function extractApiKeyPrefix(key: string): string {
  const parts = key.split("_");
  if (parts.length < 2) {
    return key.substring(0, 12);
  }

  return `${parts[0]}_${parts[1]?.substring(0, 12) || ""}`;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(key: string): boolean {
  // Should start with prefix and have sufficient length
  return key.startsWith(`${env.API_KEY_PREFIX}_`) && key.length > 20;
}

// ────────────────────────────────────────────────────────────────────────────
// Session Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Calculate session expiration date
 */
export function getSessionExpiration(durationSeconds?: number): Date {
  const duration = durationSeconds || 604800; // Default 7 days
  return new Date(Date.now() + duration * 1000);
}

// ────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1] || null;
}

/**
 * Sanitize username (lowercase, alphanumeric + underscore/hyphen)
 */
export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .substring(0, 50);
}

/**
 * Check if a user account should be locked (too many failed attempts)
 */
export function shouldLockAccount(failedAttempts: number): boolean {
  return failedAttempts >= 5;
}

/**
 * Generate a temporary verification code (for passwordless auth)
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}
