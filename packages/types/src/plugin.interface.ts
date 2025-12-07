/**
 * Plugin Interface
 * Defines the contract for all plugins in the DesterLib system
 */

export interface PluginConfig {
  [key: string]: any; // Plugin-specific configuration
}

export interface PluginStatus {
  status: "initialized" | "running" | "stopped" | "error";
  message?: string;
  [key: string]: any; // Additional plugin-specific status information
}

/**
 * Base interface that all plugins must implement
 */
export interface IPlugin {
  /**
   * Unique plugin identifier (e.g., "tmdb", "omdb")
   */
  name: string;

  /**
   * Plugin version
   */
  version: string;

  /**
   * Initialize the plugin with configuration
   * Called once during plugin loading
   */
  init(config: PluginConfig): Promise<void>;

  /**
   * Start the plugin (e.g., start queue consumers, background workers)
   * Called after initialization
   */
  start(): Promise<void>;

  /**
   * Stop the plugin gracefully
   * Called during shutdown
   */
  stop(): Promise<void>;

  /**
   * Get the current status of the plugin
   */
  getStatus(): PluginStatus;
}
