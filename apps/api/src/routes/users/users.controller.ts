/**
 * User Management Controller
 *
 * Handles HTTP requests for admin user management operations
 */

import type { Request, Response } from "express";
import { userService } from "./users.service.js";
import { BadRequestError } from "../../lib/errors.js";

export class UserController {
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

export const userController = new UserController();
