/**
 * User Service
 *
 * Handles user management and authentication operations
 */

import { prisma } from "../prisma.js";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from "../errors.js";
import {
  hashPassword,
  verifyPassword,
  validatePin,
  validatePasswordStrength,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sanitizeUsername,
  shouldLockAccount,
  getSessionExpiration,
} from "./auth.utils.js";
import logger from "../../config/logger.js";
import type { UserRole } from "../../generated/prisma/index.js";

export interface CreateUserInput {
  username: string;
  email?: string;
  displayName?: string;
  password?: string;
  pin?: string;
  isPasswordless?: boolean;
  role?: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  displayName?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginInput {
  username: string;
  password?: string;
  pin?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string | null;
    displayName: string | null;
    avatar: string | null;
    role: UserRole;
    isPasswordless: boolean;
  };
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<AuthResponse> {
    const {
      username,
      email,
      displayName,
      password,
      pin,
      isPasswordless = false,
      role = "USER",
    } = input;

    // Validate inputs
    if (!username || username.trim() === "") {
      throw new BadRequestError("Username is required");
    }

    const sanitizedUsername = sanitizeUsername(username);
    if (sanitizedUsername !== username.toLowerCase()) {
      throw new BadRequestError(
        "Username can only contain letters, numbers, hyphens, and underscores"
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: sanitizedUsername }, ...(email ? [{ email }] : [])],
      },
    });

    if (existingUser) {
      throw new ConflictError(
        existingUser.username === sanitizedUsername
          ? "Username already exists"
          : "Email already exists"
      );
    }

    // Validate authentication method
    if (!isPasswordless && !password && !pin) {
      throw new BadRequestError(
        "Either password, PIN, or passwordless flag is required"
      );
    }

    // Validate password if provided
    let passwordHash: string | undefined;
    if (password) {
      const validation = validatePasswordStrength(password);
      if (!validation.valid) {
        throw new BadRequestError(validation.errors.join(", "));
      }
      passwordHash = await hashPassword(password);
    }

    // Validate and hash PIN if provided
    let pinHash: string | undefined;
    if (pin) {
      if (!validatePin(pin)) {
        throw new BadRequestError("PIN must be 4-8 digits");
      }
      pinHash = await hashPassword(pin);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        email,
        displayName: displayName || sanitizedUsername,
        passwordHash,
        pinHash,
        isPasswordless,
        role,
        lastLoginAt: new Date(),
      },
    });

    logger.info(`User created: ${user.username} (${user.id})`);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getSessionExpiration(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        isPasswordless: user.isPasswordless,
      },
    };
  }

  /**
   * Login user with password or PIN
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { username, password, pin, ipAddress, userAgent } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    if (user.isLocked) {
      throw new UnauthorizedError(
        "Account is locked due to too many failed login attempts"
      );
    }

    // Verify credentials
    let authenticated = false;

    if (user.isPasswordless) {
      // Passwordless auth - allow login without credentials
      authenticated = true;
    } else if (password && user.passwordHash) {
      // Password auth
      authenticated = await verifyPassword(password, user.passwordHash);
    } else if (pin && user.pinHash) {
      // PIN auth
      authenticated = await verifyPassword(pin, user.pinHash);
    }

    // Handle failed authentication
    if (!authenticated) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const isLocked = shouldLockAccount(failedAttempts);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          isLocked,
        },
      });

      logger.warn(
        `Failed login attempt for user ${user.username} (${failedAttempts} attempts)`
      );

      throw new UnauthorizedError("Invalid credentials");
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    logger.info(`User logged in: ${user.username} (${user.id})`);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getSessionExpiration(),
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        isPasswordless: user.isPasswordless,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedError("Session not found");
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedError("Session expired");
    }

    if (!session.user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    if (session.user.isLocked) {
      throw new UnauthorizedError("Account is locked");
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role,
    });

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newRefreshToken,
        lastActiveAt: new Date(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });

    logger.info("User logged out");
  }

  /**
   * Logout all sessions for a user
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });

    logger.info(`All sessions logged out for user ${userId}`);
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
   * Get user by username
   */
  async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
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
   * List all users (admin only)
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

    logger.info(`User updated: ${user.username} (${user.id})`);

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    if (user.passwordHash) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedError("Current password is incorrect");
      }
    }

    // Validate new password
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      throw new BadRequestError(validation.errors.join(", "));
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions
    await this.logoutAll(userId);

    logger.info(`Password changed for user ${user.username} (${user.id})`);
  }

  /**
   * Change PIN
   */
  async changePin(
    userId: string,
    currentPin: string,
    newPin: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current PIN
    if (user.pinHash) {
      const isValid = await verifyPassword(currentPin, user.pinHash);
      if (!isValid) {
        throw new UnauthorizedError("Current PIN is incorrect");
      }
    }

    // Validate new PIN
    if (!validatePin(newPin)) {
      throw new BadRequestError("PIN must be 4-8 digits");
    }

    // Hash and update PIN
    const pinHash = await hashPassword(newPin);
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });

    logger.info(`PIN changed for user ${user.username} (${user.id})`);
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

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`User deleted: ${user.username} (${user.id})`);
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastActiveAt: true,
        expiresAt: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });

    return sessions;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    logger.info(`Session revoked for user ${userId}`);
  }
}

// Export singleton instance
export const userService = new UserService();
