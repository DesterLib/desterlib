import { logger } from "@dester/logger";
import { prisma } from "../prisma";
import type {
  ScanOptions,
  UserSettings,
  PublicSettings,
} from "../../domain/entities/settings";

/**
 * Core setting keys
 */
const SETTING_KEYS = {
  TMDB_API_KEY: "core.tmdb.apiKey",
  PORT: "core.server.port",
  JWT_SECRET: "core.server.jwtSecret",
  ENABLE_ROUTE_GUARDS: "core.server.enableRouteGuards",
  FIRST_RUN: "core.system.firstRun",
  SCAN_SETTINGS: "core.scan.settings",
} as const;

/**
 * Provider configuration mapping
 * Maps setting keys to provider configurations
 */
const PROVIDER_CONFIGS = {
  [SETTING_KEYS.TMDB_API_KEY]: {
    providerName: "tmdb",
    config: {
      baseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
      rateLimitRps: parseFloat(process.env.METADATA_RATE_LIMIT_RPS || "4"),
    },
    enabled: true,
    priority: 0,
  },
  // Add more provider mappings here as needed
  // Example:
  // "core.omdb.apiKey": {
  //   providerName: "omdb",
  //   config: {
  //     baseUrl: "https://www.omdbapi.com",
  //   },
  //   enabled: true,
  //   priority: 1,
  // },
} as const;

/**
 * Get default scan settings
 * Uses robust regex patterns similar to Sonarr/Radarr/Plex/Jellyfin
 * Patterns are media-type specific since movies and TV shows have different naming conventions
 *
 * NOTE: This function is defined early to be used in coreSettings initialization
 */
function getDefaultScanSettings(): ScanOptions {
  // Common video file extensions (case-insensitive)
  const videoExtensions =
    "(mkv|mp4|avi|mov|wmv|flv|webm|m4v|mpg|mpeg|ts|m2ts|vob|iso|divx|xvid|MKV|MP4|AVI|MOV|WMV|FLV|WEBM|M4V|MPG|MPEG|TS|M2TS|VOB|ISO|DIVX|XVID)";

  return {
    rescan: false,
    followSymlinks: true,
    mediaTypeDepth: {
      movie: 2,
      tv: 4,
    },
    mediaTypePatterns: {
      movie: {
        // Movie filename pattern: matches files with video extensions
        // Examples: "Movie Name (2023).mkv", "Movie.2023.1080p.mkv"
        filenamePattern: `.*\\.${videoExtensions}$`,
        // Movie directory pattern: matches movie folders with optional year
        // Examples: "Movie Name (2023)", "Movie Name", "Movie (2023) [1080p]"
        directoryPattern: "^[^\\/]+(?:\\s*\\(\\d{4}\\))?(?:\\s*\\[.*\\])?$",
      },
      tv: {
        // TV filename pattern: matches files with season/episode notation
        // Examples: "Show - S01E01.mkv", "show.s01e01.mkv", "Show - 1x01.mkv"
        filenamePattern: `.*[Ss]\\d{2}[Ee]\\d{2}.*\\.${videoExtensions}$`,
        // TV directory pattern: matches show folders and season folders
        // Examples: "Show Name", "Show Name (2020)", "Season 1", "Season 01"
        directoryPattern:
          "^(?:[^\\/]+(?:\\s*\\(\\d{4}\\))?(?:\\s*\\[.*\\])?|Season\\s*\\d+)$",
      },
    },
    // Legacy global patterns for backwards compatibility
    filenamePattern: `.*\\.${videoExtensions}$`,
    directoryPattern: "^[^\\/]+(?:\\s*\\(\\d{4}\\))?(?:\\s*\\[.*\\])?$",
  };
}

/**
 * Core settings definitions
 */
const coreSettings = [
  {
    key: SETTING_KEYS.TMDB_API_KEY,
    category: "INTEGRATION" as const,
    module: "tmdb",
    type: "SECRET" as const,
    value: "",
    displayName: "TMDB API Key",
    description: "The Movie Database API key",
    isPublic: false,
  },
  {
    key: SETTING_KEYS.PORT,
    category: "CORE" as const,
    module: "server",
    type: "NUMBER" as const,
    value: "3001",
    displayName: "Server Port",
    description: "API server port",
    isPublic: true,
  },
  {
    key: SETTING_KEYS.JWT_SECRET,
    category: "CORE" as const,
    module: "server",
    type: "SECRET" as const,
    value: "change-me-in-production",
    displayName: "JWT Secret",
    description: "Secret for signing tokens",
    isPublic: false,
  },
  {
    key: SETTING_KEYS.ENABLE_ROUTE_GUARDS,
    category: "CORE" as const,
    module: "server",
    type: "BOOLEAN" as const,
    value: "false",
    displayName: "Enable Route Guards",
    description: "Enable authentication",
    isPublic: true,
  },
  {
    key: SETTING_KEYS.FIRST_RUN,
    category: "CORE" as const,
    module: "system",
    type: "BOOLEAN" as const,
    value: "true",
    displayName: "First Run",
    description: "Initial setup needed",
    isPublic: true,
  },
  {
    key: SETTING_KEYS.SCAN_SETTINGS,
    category: "LIBRARY" as const,
    module: "scan",
    type: "JSON" as const,
    value: JSON.stringify(getDefaultScanSettings()),
    displayName: "Scan Settings",
    description: "Default scan configuration options",
    isPublic: true,
  },
];

/**
 * Parse value based on type
 */
function parseValue(
  value: string,
  type: string
): string | number | boolean | object {
  switch (type) {
    case "NUMBER":
      return parseFloat(value);
    case "BOOLEAN":
      return value.toLowerCase() === "true";
    case "JSON":
      try {
        return JSON.parse(value || "{}");
      } catch {
        return {};
      }
    default:
      return value;
  }
}

/**
 * Serialize value to string
 */
function serializeValue(value: string | number | boolean | object): string {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Ensure core settings exist
 */
async function ensureCoreSettings(): Promise<void> {
  for (const setting of coreSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}

/**
 * Get setting value
 */
async function getSetting<T = string>(
  key: string,
  defaultValue?: T
): Promise<T> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return defaultValue as T;
  return parseValue(setting.value, setting.type) as T;
}

/**
 * Set setting value
 */
async function setSetting(
  key: string,
  value: string | number | boolean | object
): Promise<void> {
  const stringValue = serializeValue(value);
  await prisma.setting.upsert({
    where: { key },
    update: { value: stringValue },
    create: {
      key,
      value: stringValue,
      category: "CUSTOM",
      type:
        typeof value === "object"
          ? "JSON"
          : typeof value === "number"
            ? "NUMBER"
            : typeof value === "boolean"
              ? "BOOLEAN"
              : "STRING",
    },
  });
}

/**
 * Initialize settings
 * Ensures core settings exist and validates scan settings have all required defaults
 */
export async function initializeSettings(): Promise<void> {
  await ensureCoreSettings();

  // Validate scan settings - if any required field is missing, merge with defaults
  const scanSettings = await getSetting<ScanOptions>(
    SETTING_KEYS.SCAN_SETTINGS
  );
  const defaults = getDefaultScanSettings();

  // Check if scan settings need initialization/update (check for new mediaTypePatterns structure)
  const needsUpdate =
    !scanSettings ||
    scanSettings.mediaTypeDepth === undefined ||
    scanSettings.mediaTypePatterns === undefined;

  if (needsUpdate) {
    // Merge existing settings with defaults, including the new mediaTypePatterns structure
    const updatedScanSettings: ScanOptions = {
      ...defaults,
      ...scanSettings,
      mediaTypeDepth: {
        ...defaults.mediaTypeDepth,
        ...scanSettings?.mediaTypeDepth,
      },
      mediaTypePatterns: {
        movie: {
          ...defaults.mediaTypePatterns?.movie,
          ...scanSettings?.mediaTypePatterns?.movie,
        },
        tv: {
          ...defaults.mediaTypePatterns?.tv,
          ...scanSettings?.mediaTypePatterns?.tv,
        },
      },
    };

    await setSetting(SETTING_KEYS.SCAN_SETTINGS, updatedScanSettings);
    logger.info(
      "Scan settings initialized with defaults and media-type patterns"
    );
  }

  logger.info("Settings initialized");
}

/**
 * Get all settings
 */
export async function getSettings(): Promise<UserSettings> {
  // Get stored scan settings, if empty/null use defaults
  const storedScanSettings = await getSetting<ScanOptions>(
    SETTING_KEYS.SCAN_SETTINGS,
    getDefaultScanSettings()
  );

  return {
    tmdbApiKey:
      (await getSetting<string>(SETTING_KEYS.TMDB_API_KEY)) || undefined,
    port: await getSetting<number>(SETTING_KEYS.PORT, 3001),
    jwtSecret: await getSetting<string>(
      SETTING_KEYS.JWT_SECRET,
      "change-me-in-production"
    ),
    enableRouteGuards: await getSetting<boolean>(
      SETTING_KEYS.ENABLE_ROUTE_GUARDS,
      false
    ),
    firstRun: await getSetting<boolean>(SETTING_KEYS.FIRST_RUN, true),
    scanSettings: storedScanSettings as ScanOptions | undefined,
  };
}

/**
 * Get public settings (excludes secrets)
 * Merges stored settings with defaults to ensure all fields have values
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const allSettings = await getSettings();
  const defaults = getDefaultScanSettings();

  // Merge scan settings with defaults (user settings override defaults)
  // Handle null/undefined values explicitly - only override if value is actually set
  const mergedScanSettings: ScanOptions = {
    rescan: allSettings.scanSettings?.rescan ?? defaults.rescan,
    followSymlinks:
      allSettings.scanSettings?.followSymlinks ?? defaults.followSymlinks,
    // Legacy global patterns (for backwards compatibility)
    filenamePattern:
      allSettings.scanSettings?.filenamePattern ?? defaults.filenamePattern,
    directoryPattern:
      allSettings.scanSettings?.directoryPattern ?? defaults.directoryPattern,
    // Media type depth
    mediaTypeDepth: {
      movie:
        allSettings.scanSettings?.mediaTypeDepth?.movie ??
        defaults.mediaTypeDepth?.movie,
      tv:
        allSettings.scanSettings?.mediaTypeDepth?.tv ??
        defaults.mediaTypeDepth?.tv,
    },
    // Media type patterns (new structure)
    mediaTypePatterns: {
      movie: {
        filenamePattern:
          allSettings.scanSettings?.mediaTypePatterns?.movie?.filenamePattern ??
          defaults.mediaTypePatterns?.movie?.filenamePattern,
        directoryPattern:
          allSettings.scanSettings?.mediaTypePatterns?.movie
            ?.directoryPattern ??
          defaults.mediaTypePatterns?.movie?.directoryPattern,
      },
      tv: {
        filenamePattern:
          allSettings.scanSettings?.mediaTypePatterns?.tv?.filenamePattern ??
          defaults.mediaTypePatterns?.tv?.filenamePattern,
        directoryPattern:
          allSettings.scanSettings?.mediaTypePatterns?.tv?.directoryPattern ??
          defaults.mediaTypePatterns?.tv?.directoryPattern,
      },
    },
  };

  const { jwtSecret: _, ...publicSettings } = allSettings;
  return {
    ...publicSettings,
    scanSettings: mergedScanSettings,
  };
}

/**
 * Get default settings
 */
export function getDefaultSettings(): UserSettings {
  return {
    port: 3001,
    jwtSecret: "change-me-in-production",
    enableRouteGuards: false,
    firstRun: true,
    scanSettings: getDefaultScanSettings(),
  };
}

/**
 * Reset all settings to defaults
 */
export async function resetAllSettings(): Promise<void> {
  try {
    const defaults = getDefaultSettings();
    await updateSettings(defaults);
    logger.info("All settings reset to defaults");
  } catch (error) {
    logger.error("Failed to reset all settings:", error);
    throw error;
  }
}

/**
 * Reset scan settings to defaults
 */
export async function resetScanSettings(): Promise<void> {
  try {
    const defaultScanSettings = getDefaultScanSettings();
    await updateSettings({ scanSettings: defaultScanSettings });
    logger.info("Scan settings reset to defaults");
  } catch (error) {
    logger.error("Failed to reset scan settings:", error);
    throw error;
  }
}

/**
 * Update settings
 */
export async function updateSettings(
  updates: Partial<UserSettings>
): Promise<void> {
  try {
    if (updates.tmdbApiKey !== undefined) {
      await setSetting(SETTING_KEYS.TMDB_API_KEY, updates.tmdbApiKey);
      // Sync to MetadataProvider table (used by metadata-service)
      await syncProviderFromSetting(
        SETTING_KEYS.TMDB_API_KEY,
        updates.tmdbApiKey
      );
    }
    if (updates.port !== undefined) {
      await setSetting(SETTING_KEYS.PORT, updates.port);
    }
    if (updates.jwtSecret !== undefined) {
      await setSetting(SETTING_KEYS.JWT_SECRET, updates.jwtSecret);
    }
    if (updates.enableRouteGuards !== undefined) {
      await setSetting(
        SETTING_KEYS.ENABLE_ROUTE_GUARDS,
        updates.enableRouteGuards
      );
    }
    if (updates.firstRun !== undefined) {
      await setSetting(SETTING_KEYS.FIRST_RUN, updates.firstRun);
    }
    if (updates.scanSettings !== undefined) {
      await setSetting(SETTING_KEYS.SCAN_SETTINGS, updates.scanSettings);
    }
    logger.info("Settings updated");
  } catch (error) {
    logger.error("Failed to update settings:", error);
    throw error;
  }
}

/**
 * Sync a provider configuration from a setting key
 * This updates the MetadataProvider table which is shared with the metadata-service
 */
async function syncProviderFromSetting(
  settingKey: string,
  apiKey: string
): Promise<void> {
  const providerConfig =
    PROVIDER_CONFIGS[settingKey as keyof typeof PROVIDER_CONFIGS];

  if (!providerConfig) {
    // No provider mapping for this setting key
    return;
  }

  try {
    const { providerService } = await import("../../app/providers/index.js");
    await providerService.syncProvider(providerConfig.providerName, {
      apiKey,
      enabled: providerConfig.enabled,
      priority: providerConfig.priority,
      ...providerConfig.config,
    });

    // Reload providers in metadata service to pick up the synced provider
    // Import the reload function from the provider controller
    const { reloadProvidersInMetadataService } = await import(
      "../../interfaces/http/controllers/provider.controller.js"
    );
    await reloadProvidersInMetadataService();
  } catch (error) {
    logger.warn(
      { error, settingKey, providerName: providerConfig.providerName },
      "Failed to sync provider configuration"
    );
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Get TMDB API key
 */
export async function getTmdbApiKey(): Promise<string> {
  return await getSetting<string>(SETTING_KEYS.TMDB_API_KEY, "");
}

/**
 * Set TMDB API key
 */
export async function setTmdbApiKey(apiKey: string): Promise<void> {
  await setSetting(SETTING_KEYS.TMDB_API_KEY, apiKey);
}

/**
 * Check if first run
 */
export async function isFirstRun(): Promise<boolean> {
  return await getSetting<boolean>(SETTING_KEYS.FIRST_RUN, true);
}

/**
 * Complete first run
 */
export async function completeFirstRun(): Promise<void> {
  await setSetting(SETTING_KEYS.FIRST_RUN, false);
}

/**
 * Settings manager - centralized access to all settings operations
 */
export const settingsManager = {
  initialize: initializeSettings,
  getSettings,
  getPublicSettings,
  getDefaultSettings,
  getDefaultScanSettings, // Export the function for external use
  updateSettings,
  resetAllSettings,
  resetScanSettings,
  getTmdbApiKey,
  setTmdbApiKey,
  isFirstRun,
  completeFirstRun,
};

// Export getDefaultScanSettings as a named export for direct use
export { getDefaultScanSettings };
