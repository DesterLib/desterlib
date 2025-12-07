/**
 * Dependency Injection Container
 * Simple container for complex dependencies (plugins, queues)
 * Services now handle their own repository dependencies
 */

import { config } from "../config/env";
import { PluginManager } from "./plugins/plugin-manager";
import { MetadataQueueService } from "./queue/metadata-queue.service";

class Container {
  private pluginManager: PluginManager | null = null;
  private metadataQueueService: MetadataQueueService | null = null;

  /**
   * Initialize container
   */
  initialize() {
    this.pluginManager = new PluginManager();
  }

  /**
   * Get plugin manager
   */
  getPluginManager(): PluginManager {
    if (!this.pluginManager) {
      this.initialize();
    }
    if (!this.pluginManager) {
      throw new Error("Failed to initialize plugin manager");
    }
    return this.pluginManager;
  }

  /**
   * Get metadata queue service
   */
  getMetadataQueueService(): MetadataQueueService {
    if (!this.metadataQueueService) {
      this.metadataQueueService = new MetadataQueueService(
        config.redisUrl,
        config.pluginConfig.queueName as string
      );
    }
    return this.metadataQueueService;
  }
}

// Export singleton instance
export const container = new Container();
