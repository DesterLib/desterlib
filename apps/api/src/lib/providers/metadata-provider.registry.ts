/**
 * Metadata Provider Registry
 *
 * Centralized registry for managing metadata provider plugins
 */

import type {
  IMetadataProvider,
  MetadataProviderConfig,
} from "./metadata-provider.types";
import { logger } from "@/lib/utils";

class MetadataProviderRegistry {
  private providers: Map<string, IMetadataProvider> = new Map();
  private defaultProvider: string | null = null;

  /**
   * Register a metadata provider plugin
   */
  register(provider: IMetadataProvider): void {
    if (this.providers.has(provider.name)) {
      logger.warn(
        `Metadata provider "${provider.name}" is already registered. Overwriting...`
      );
    }

    this.providers.set(provider.name, provider);
    logger.info(
      `Registered metadata provider: ${provider.displayName} (${provider.name})`
    );
  }

  /**
   * Get a provider by name
   */
  get(name: string): IMetadataProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Get the default provider
   */
  getDefault(): IMetadataProvider | null {
    if (this.defaultProvider) {
      return this.get(this.defaultProvider);
    }
    // If no default set, return the first registered provider
    const firstProvider = Array.from(this.providers.values())[0];
    return firstProvider || null;
  }

  /**
   * Set the default provider
   */
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Metadata provider "${name}" is not registered`);
    }
    this.defaultProvider = name;
    logger.info(`Set default metadata provider to: ${name}`);
  }

  /**
   * Get all registered providers
   */
  getAll(): IMetadataProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Unregister a provider
   */
  unregister(name: string): void {
    if (this.providers.has(name)) {
      this.providers.delete(name);
      if (this.defaultProvider === name) {
        this.defaultProvider = null;
      }
      logger.info(`Unregistered metadata provider: ${name}`);
    }
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.defaultProvider = null;
  }
}

// Singleton instance
export const metadataProviderRegistry = new MetadataProviderRegistry();
