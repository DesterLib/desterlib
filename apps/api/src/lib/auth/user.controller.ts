/**
 * User Controller
 *
 * Handles HTTP requests for user authentication and management
 */

import type { Request, Response } from "express";
import { userService } from "./user.service.js";
import { apiKeyService } from "./apikey.service.js";
import { BadRequestError } from "../errors.js";

export class UserController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const result = await userService.createUser(req.body);
    res.jsonOk(result, 201);
  }

  /**
   * POST /api/v1/auth/login
   * Login with username and password/PIN
   */
  async login(req: Request, res: Response): Promise<void> {
    const { username, password, pin } = req.body;

    const result = await userService.login({
      username,
      password,
      pin,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.jsonOk(result);
  }

  /**
   * POST /api/v1/auth/login/passwordless
   * Login without password (for passwordless accounts)
   */
  async loginPasswordless(req: Request, res: Response): Promise<void> {
    const { username } = req.body;

    const result = await userService.login({
      username,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.jsonOk(result);
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const result = await userService.refreshToken(refreshToken);
    res.jsonOk(result);
  }

  /**
   * POST /api/v1/auth/logout
   * Logout current session
   */
  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    await userService.logout(refreshToken);
    res.jsonOk({ message: "Logged out successfully" });
  }

  /**
   * POST /api/v1/auth/logout-all
   * Logout all sessions for current user
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    await userService.logoutAll(userId);
    res.jsonOk({ message: "All sessions logged out successfully" });
  }

  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const user = await userService.getUserById(userId);
    res.jsonOk(user);
  }

  /**
   * PUT /api/v1/auth/me
   * Update current user
   */
  async updateCurrentUser(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const user = await userService.updateUser(userId, req.body);
    res.jsonOk(user);
  }

  /**
   * POST /api/v1/auth/change-password
   * Change password for current user
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(userId, currentPassword, newPassword);
    res.jsonOk({ message: "Password changed successfully" });
  }

  /**
   * POST /api/v1/auth/change-pin
   * Change PIN for current user
   */
  async changePin(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { currentPin, newPin } = req.body;
    await userService.changePin(userId, currentPin, newPin);
    res.jsonOk({ message: "PIN changed successfully" });
  }

  /**
   * GET /api/v1/auth/sessions
   * Get all active sessions for current user
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const sessions = await userService.getUserSessions(userId);
    res.jsonOk({ sessions });
  }

  /**
   * DELETE /api/v1/auth/sessions/:sessionId
   * Revoke a specific session
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new BadRequestError("Session ID is required");
    }

    await userService.revokeSession(userId, sessionId);
    res.jsonOk({ message: "Session revoked successfully" });
  }

  // ──────────────────────────────────────────────────────────────
  // API Key Management
  // ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/auth/api-keys
   * List all API keys for current user
   */
  async listApiKeys(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const apiKeys = await apiKeyService.listApiKeys(userId);
    res.jsonOk({ apiKeys });
  }

  /**
   * POST /api/v1/auth/api-keys
   * Create a new API key
   */
  async createApiKey(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { name, scopes, expiresAt } = req.body;

    const apiKey = await apiKeyService.createApiKey({
      userId,
      name,
      scopes,
      expiresAt,
    });

    res.jsonOk(
      {
        apiKey,
        warning:
          "This is the only time you will see the full API key. Please save it securely.",
      },
      201
    );
  }

  /**
   * GET /api/v1/auth/api-keys/:keyId
   * Get a specific API key
   */
  async getApiKey(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { keyId } = req.params;

    if (!keyId) {
      throw new BadRequestError("Key ID is required");
    }

    const apiKey = await apiKeyService.getApiKey(userId, keyId);
    res.jsonOk({ apiKey });
  }

  /**
   * PUT /api/v1/auth/api-keys/:keyId
   * Update an API key
   */
  async updateApiKey(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { keyId } = req.params;

    if (!keyId) {
      throw new BadRequestError("Key ID is required");
    }

    const apiKey = await apiKeyService.updateApiKey(userId, keyId, req.body);
    res.jsonOk({ apiKey });
  }

  /**
   * DELETE /api/v1/auth/api-keys/:keyId
   * Delete an API key
   */
  async deleteApiKey(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { keyId } = req.params;

    if (!keyId) {
      throw new BadRequestError("Key ID is required");
    }

    await apiKeyService.deleteApiKey(userId, keyId);
    res.jsonOk({ message: "API key deleted successfully" });
  }

  /**
   * POST /api/v1/auth/api-keys/:keyId/revoke
   * Revoke an API key (set to inactive)
   */
  async revokeApiKey(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { keyId } = req.params;

    if (!keyId) {
      throw new BadRequestError("Key ID is required");
    }

    const apiKey = await apiKeyService.revokeApiKey(userId, keyId);
    res.jsonOk({ apiKey, message: "API key revoked successfully" });
  }

  // ──────────────────────────────────────────────────────────────
  // User Management (Admin Only)
  // ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/users
   * List all users (admin only)
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await userService.listUsers({ limit, offset });
    res.jsonOk(result);
  }

  /**
   * GET /api/v1/users/:userId
   * Get user by ID (admin only)
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const user = await userService.getUserById(userId);
    res.jsonOk({ user });
  }

  /**
   * PUT /api/v1/users/:userId
   * Update user (admin only)
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const user = await userService.updateUser(userId, req.body);
    res.jsonOk({ user });
  }

  /**
   * DELETE /api/v1/users/:userId
   * Delete user (admin only)
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    await userService.deleteUser(userId);
    res.jsonOk({ message: "User deleted successfully" });
  }
}

// Export singleton instance
export const userController = new UserController();
