/**
 * Metadata Services
 * Exports metadata-related services with dependencies injected
 *
 * Note: Service instance is created after plugins are initialized in server.ts
 * This ensures the plugin is available when the service is used.
 */

import { ScanJobRepository } from "../../infrastructure/repositories/scan/scan-job.repository";
import { container } from "../../infrastructure/container";
import { config } from "../../config/env";
import { MetadataProcessorService } from "./metadata-processor.service";

// Initialize repository
const scanJobRepository = new ScanJobRepository();

// Factory function to create service instance with plugin from container
// This should be called after plugins are initialized in server.ts
export function createMetadataProcessorService(): MetadataProcessorService {
  const pluginManager = container.getPluginManager();
  const tmdbPlugin = pluginManager.getPlugin("tmdb");

  return new MetadataProcessorService(
    scanJobRepository,
    tmdbPlugin,
    config.metadataPath
  );
}

// Export service class and other services
export { MetadataProcessorService } from "./metadata-processor.service";
export * from "./metadata-validator.service";
export * from "./metadata-fetcher.service";
export * from "./metadata-updater.service";
