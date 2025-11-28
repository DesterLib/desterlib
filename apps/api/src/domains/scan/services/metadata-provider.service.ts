/**
 * Metadata Provider Service
 *
 * Handles metadata provider configuration and retrieval
 */

import { ValidationError } from "@/lib/utils";
import { metadataProviderRegistry } from "@/lib/providers";
import type { IMetadataProvider } from "@/lib/providers/metadata-provider.types";

export interface MetadataProviderConfig {
  provider: IMetadataProvider;
}

export class MetadataProviderService {
  /**
   * Get configured metadata provider
   */
  async getConfiguredProvider(): Promise<MetadataProviderConfig> {
    const provider = metadataProviderRegistry.getDefault();

    if (!provider || !provider.isConfigured()) {
      throw new ValidationError(
        "No metadata provider configured. Please configure a metadata provider (e.g., TMDB) in settings."
      );
    }

    return {
      provider,
    };
  }
}

export const metadataProviderService = new MetadataProviderService();
