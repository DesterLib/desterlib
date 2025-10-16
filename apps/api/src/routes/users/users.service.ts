/**
 * User Management Service
 *
 * Handles user management operations (admin only)
 */

import { prisma } from "../../lib/prisma.js";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../../lib/errors.js";
import type { UserRole } from "../../generated/prisma/index.js";

export interface UpdateUserInput {
  email?: string;
  displayName?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}

export class UserService {
  /**
   * List all users with pagination
   */
  async listUsers(options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatar: true,
          role: true,
          isPasswordless: true,
          isActive: true,
          isLocked: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        isPasswordless: true,
        isActive: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, input: UpdateUserInput) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Protect SUPER_ADMIN users - their role cannot be changed
    if (existingUser.role === "SUPER_ADMIN") {
      if (input.role && input.role !== "SUPER_ADMIN") {
        throw new ForbiddenError(
          "Cannot change the role of a SUPER_ADMIN user. This is the first user account with full system privileges."
        );
      }
      // Even if not explicitly changing role, prevent any updates that might affect SUPER_ADMIN
      // Allow only non-critical updates like displayName, avatar, etc.
      const allowedFields: (keyof UpdateUserInput)[] = [
        "displayName",
        "avatar",
        "email",
      ];
      const attemptedFields = Object.keys(input) as (keyof UpdateUserInput)[];
      const forbiddenFields = attemptedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (forbiddenFields.length > 0) {
        throw new ForbiddenError(
          `Cannot modify ${forbiddenFields.join(", ")} for SUPER_ADMIN users. Only displayName, avatar, and email can be updated.`
        );
      }
    }

    // Check email uniqueness if being updated
    if (input.email && input.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (emailExists) {
        throw new ConflictError("Email already in use");
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        isPasswordless: true,
        isActive: true,
        isLocked: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Protect SUPER_ADMIN users - they cannot be deleted
    if (user.role === "SUPER_ADMIN") {
      throw new ForbiddenError(
        "Cannot delete SUPER_ADMIN user. This is the first user account with full system privileges and must be protected."
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const userService = new UserService();
