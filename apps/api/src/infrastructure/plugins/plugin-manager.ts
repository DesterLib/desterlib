import { IPlugin, PluginConfig, PluginStatus } from "@dester/types";
import { logger } from "@dester/logger";

/**
 * Plugin Manager
 * Manages the lifecycle of all plugins in the system
 */
export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private initialized: boolean = false;

  /**
   * Load a plugin by name/path
   * Supports both package names (e.g., "@dester/tmdb-plugin") and direct imports
   */
  async loadPlugin(name: string, pluginPath?: string): Promise<void> {
    try {
      // If pluginPath is provided, use it; otherwise assume it's a package name
      const importPath = pluginPath || name;

      logger.info({ plugin: name, path: importPath }, "Loading plugin");

      // Dynamic import of the plugin
      const pluginModule = await import(importPath);

      // Support both default export and named export
      const moduleKeys = Object.keys(pluginModule);
      const PluginClass =
        pluginModule.default ||
        (name && pluginModule[name as keyof typeof pluginModule]) ||
        (moduleKeys.length > 0
          ? pluginModule[moduleKeys[0] as keyof typeof pluginModule]
          : null);

      if (!PluginClass) {
        throw new Error(
          `Plugin ${name} does not export a default class or named export`
        );
      }

      // Instantiate the plugin
      const plugin: IPlugin = new PluginClass();

      if (!plugin.name || !plugin.version) {
        throw new Error(`Plugin ${name} is missing required name or version`);
      }

      this.plugins.set(plugin.name, plugin);
      logger.info(
        { plugin: plugin.name, version: plugin.version },
        "Plugin loaded successfully"
      );
    } catch (error) {
      logger.error(
        { error, plugin: name, path: pluginPath },
        "Failed to load plugin"
      );
      throw error;
    }
  }

  /**
   * Initialize all loaded plugins with their configuration
   */
  async initializePlugins(
    configs: Array<{ name: string; config: PluginConfig }>
  ): Promise<void> {
    if (this.initialized) {
      logger.warn("Plugins already initialized");
      return;
    }

    logger.info({ count: this.plugins.size }, "Initializing plugins");

    for (const [pluginName, plugin] of this.plugins.entries()) {
      try {
        const pluginConfig =
          configs.find((c) => c.name === pluginName)?.config || {};
        await plugin.init(pluginConfig);
        logger.info({ plugin: pluginName }, "Plugin initialized");
      } catch (error) {
        logger.error(
          { error, plugin: pluginName },
          "Failed to initialize plugin"
        );
        // Continue with other plugins even if one fails
      }
    }

    this.initialized = true;
    logger.info("All plugins initialized");
  }

  /**
   * Start all initialized plugins
   */
  async startPlugins(): Promise<void> {
    if (!this.initialized) {
      throw new Error("Plugins must be initialized before starting");
    }

    logger.info({ count: this.plugins.size }, "Starting plugins");

    for (const [pluginName, plugin] of this.plugins.entries()) {
      try {
        await plugin.start();
        logger.info({ plugin: pluginName }, "Plugin started");
      } catch (error) {
        logger.error({ error, plugin: pluginName }, "Failed to start plugin");
        // Continue with other plugins even if one fails
      }
    }

    logger.info("All plugins started");
  }

  /**
   * Stop all plugins gracefully
   */
  async stopPlugins(): Promise<void> {
    logger.info({ count: this.plugins.size }, "Stopping plugins");

    const stopPromises = Array.from(this.plugins.values()).map(
      async (plugin) => {
        try {
          await plugin.stop();
          logger.info({ plugin: plugin.name }, "Plugin stopped");
        } catch (error) {
          logger.error({ error, plugin: plugin.name }, "Failed to stop plugin");
        }
      }
    );

    await Promise.all(stopPromises);
    logger.info("All plugins stopped");
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): IPlugin | null {
    return this.plugins.get(name) || null;
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get status of all plugins
   */
  getAllPluginStatuses(): Array<{ name: string; status: PluginStatus }> {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      name,
      status: plugin.getStatus(),
    }));
  }

  /**
   * Check if plugins are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
