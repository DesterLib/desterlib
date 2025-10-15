/**
 * API Key Service
 *
 * Handles API key management operations
 */

import { prisma } from "../prisma.js";
import { NotFoundError, BadRequestError } from "../errors.js";
import { generateApiKey } from "./auth.utils.js";
import logger from "../../config/logger.js";

export interface CreateApiKeyInput {
  userId: string;
  name: string;
  scopes?: string[]; // Array of scope strings
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key?: string; // Only returned on creation
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export class ApiKeyService {
  /**
   * Create a new API key for a user
   */
  async createApiKey(input: CreateApiKeyInput): Promise<ApiKeyResponse> {
    const { userId, name, scopes = ["*"], expiresAt } = input;

    // Validate inputs
    if (!name || name.trim() === "") {
      throw new BadRequestError("API key name is required");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate API key
    const { key, keyHash, keyPrefix } = await generateApiKey();

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        scopes: JSON.stringify(scopes),
        expiresAt,
      },
    });

    logger.info(
      `API key created for user ${user.username} (${userId}): ${apiKey.name}`
    );

    return {
      id: apiKey.id,
      name: apiKey.name,
      key, // Return the raw key only on creation
      keyPrefix: apiKey.keyPrefix,
      scopes,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * List API keys for a user
   */
  async listApiKeys(userId: string): Promise<ApiKeyResponse[]> {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: this.parseScopes(key.scopes),
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));
  }

  /**
   * Get a specific API key
   */
  async getApiKey(userId: string, keyId: string): Promise<ApiKeyResponse> {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!apiKey) {
      throw new NotFoundError("API key not found");
    }

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: this.parseScopes(apiKey.scopes),
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Update API key (name, scopes, active status)
   */
  async updateApiKey(
    userId: string,
    keyId: string,
    updates: {
      name?: string;
      scopes?: string[];
      isActive?: boolean;
      expiresAt?: Date | null;
    }
  ): Promise<ApiKeyResponse> {
    // Check if key exists and belongs to user
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!existingKey) {
      throw new NotFoundError("API key not found");
    }

    // Build update data
    const updateData: {
      name?: string;
      scopes?: string;
      isActive?: boolean;
      expiresAt?: Date | null;
    } = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }

    if (updates.scopes !== undefined) {
      updateData.scopes = JSON.stringify(updates.scopes);
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt;
    }

    // Update key
    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
    });

    logger.info(`API key updated: ${apiKey.name} (${keyId})`);

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: this.parseScopes(apiKey.scopes),
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(userId: string, keyId: string): Promise<void> {
    // Check if key exists and belongs to user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!apiKey) {
      throw new NotFoundError("API key not found");
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    logger.info(`API key deleted: ${apiKey.name} (${keyId})`);
  }

  /**
   * Revoke an API key (set to inactive)
   */
  async revokeApiKey(userId: string, keyId: string): Promise<ApiKeyResponse> {
    return this.updateApiKey(userId, keyId, { isActive: false });
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await prisma.apiKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired API keys`);
    }

    return result.count;
  }

  /**
   * Parse scopes from JSON string
   */
  private parseScopes(scopesJson: string): string[] {
    try {
      return JSON.parse(scopesJson) as string[];
    } catch {
      return ["*"];
    }
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();
