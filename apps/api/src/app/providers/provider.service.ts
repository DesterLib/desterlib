import { PrismaClient, MetadataProvider, Prisma } from "@prisma/client";
import { logger } from "@dester/logger";

export type MetadataProviderConfig = MetadataProvider;

export class ProviderService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all providers
   */
  async getProviders(): Promise<MetadataProviderConfig[]> {
    return await this.prisma.metadataProvider.findMany({
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Get enabled providers
   */
  async getEnabledProviders(): Promise<MetadataProviderConfig[]> {
    return await this.prisma.metadataProvider.findMany({
      where: {
        enabled: true,
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Get a specific provider by name
   */
  async getProvider(name: string): Promise<MetadataProviderConfig | null> {
    return await this.prisma.metadataProvider.findUnique({
      where: {
        name,
      },
    });
  }

  /**
   * Create or update a provider configuration
   */
  async upsertProvider(
    name: string,
    enabled: boolean,
    priority: number,
    config: Prisma.InputJsonValue
  ): Promise<MetadataProviderConfig> {
    return await this.prisma.metadataProvider.upsert({
      where: {
        name,
      },
      create: {
        id: crypto.randomUUID(),
        name,
        enabled,
        priority,
        config: config as Prisma.InputJsonValue,
      },
      update: {
        enabled,
        priority,
        config: config as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Update provider configuration
   */
  async updateProvider(
    name: string,
    providerUpdates: {
      enabled?: boolean;
      priority?: number;
      config?: Prisma.InputJsonValue;
    }
  ): Promise<MetadataProviderConfig | null> {
    // Build update object, only including defined fields
    const updateData: {
      enabled?: boolean;
      priority?: number;
      config?: Prisma.InputJsonValue;
    } = {};

    if (providerUpdates.enabled !== undefined) {
      updateData.enabled = providerUpdates.enabled;
    }
    if (providerUpdates.priority !== undefined) {
      updateData.priority = providerUpdates.priority;
    }
    if (providerUpdates.config !== undefined) {
      updateData.config = providerUpdates.config as Prisma.InputJsonValue;
    }

    // If no updates, just return the existing provider
    if (Object.keys(updateData).length === 0) {
      return this.getProvider(name);
    }

    try {
      return await this.prisma.metadataProvider.update({
        where: {
          name,
        },
        data: updateData,
      });
    } catch (error: unknown) {
      // If provider doesn't exist, Prisma throws P2025
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a provider
   */
  async deleteProvider(name: string): Promise<boolean> {
    try {
      await this.prisma.metadataProvider.delete({
        where: {
          name,
        },
      });
      return true;
    } catch (error: unknown) {
      // If provider doesn't exist, Prisma throws P2025
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Sync a provider configuration from settings
   * @param providerName - Provider name (e.g., "tmdb", "omdb")
   * @param config - Provider configuration
   */
  async syncProvider(
    providerName: string,
    config: {
      apiKey?: string;
      enabled?: boolean;
      priority?: number;
      baseUrl?: string;
      rateLimitRps?: number;
      [key: string]: Prisma.InputJsonValue | undefined; // Allow additional provider-specific config
    }
  ): Promise<void> {
    const {
      apiKey,
      enabled = true,
      priority = 0,
      baseUrl,
      rateLimitRps,
      ...additionalConfig
    } = config;

    const providerConfig: Record<string, Prisma.InputJsonValue> = {};

    // Copy additional config, filtering out undefined values
    for (const [key, value] of Object.entries(additionalConfig)) {
      if (value !== undefined) {
        providerConfig[key] = value;
      }
    }

    if (apiKey) {
      providerConfig.apiKey = apiKey;
    }
    if (baseUrl) {
      providerConfig.baseUrl = baseUrl;
    }
    if (rateLimitRps !== undefined) {
      providerConfig.rateLimitRps = rateLimitRps;
    }

    // If no API key provided or empty, disable the provider
    if (!apiKey || apiKey.length === 0) {
      const existing = await this.getProvider(providerName);
      if (existing) {
        await this.updateProvider(providerName, { enabled: false });
        logger.info(`Provider "${providerName}" disabled (no API key)`);
      }
      return;
    }

    await this.upsertProvider(providerName, enabled, priority, providerConfig);
    logger.info(`Provider "${providerName}" synced from settings`);
  }
}
