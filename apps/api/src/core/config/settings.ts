import { logger } from "../../lib/utils";
import prisma from "../../lib/database/prisma";

export interface UserSettings {
  tmdbApiKey?: string;
  port: number;
  jwtSecret: string;
  enableRouteGuards: boolean;
  firstRun: boolean;
}

export interface PublicSettings {
  tmdbApiKey?: string;
  port: number;
  enableRouteGuards: boolean;
  firstRun: boolean;
}

/**
 * Core setting keys
 */
const SETTING_KEYS = {
  TMDB_API_KEY: "core.tmdb.apiKey",
  PORT: "core.server.port",
  JWT_SECRET: "core.server.jwtSecret",
  ENABLE_ROUTE_GUARDS: "core.server.enableRouteGuards",
  FIRST_RUN: "core.system.firstRun",
} as const;

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
];

/**
 * Parse value based on type
 */
function parseValue(value: string, type: string): string | number | boolean {
  switch (type) {
    case "NUMBER":
      return parseFloat(value);
    case "BOOLEAN":
      return value.toLowerCase() === "true";
    default:
      return value;
  }
}

/**
 * Serialize value to string
 */
function serializeValue(value: string | number | boolean): string {
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
async function getSetting<T = string>(key: string, defaultValue?: T): Promise<T> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return defaultValue as T;
  return parseValue(setting.value, setting.type) as T;
}

/**
 * Set setting value
 */
async function setSetting(key: string, value: string | number | boolean): Promise<void> {
  const stringValue = serializeValue(value);
  await prisma.setting.update({
    where: { key },
    data: { value: stringValue },
  });
}

/**
 * Initialize settings
 */
export async function initializeSettings(): Promise<void> {
  await ensureCoreSettings();
  logger.info("Settings initialized");
}

/**
 * Get all settings
 */
export async function getSettings(): Promise<UserSettings> {
  return {
    tmdbApiKey: await getSetting<string>(SETTING_KEYS.TMDB_API_KEY) || undefined,
    port: await getSetting<number>(SETTING_KEYS.PORT, 3001),
    jwtSecret: await getSetting<string>(SETTING_KEYS.JWT_SECRET, "change-me-in-production"),
    enableRouteGuards: await getSetting<boolean>(SETTING_KEYS.ENABLE_ROUTE_GUARDS, false),
    firstRun: await getSetting<boolean>(SETTING_KEYS.FIRST_RUN, true),
  };
}

/**
 * Get public settings (excludes secrets)
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const allSettings = await getSettings();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { jwtSecret: _, ...publicSettings } = allSettings;
  return publicSettings;
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
  };
}

/**
 * Update settings
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  try {
    if (updates.tmdbApiKey !== undefined) {
      await setSetting(SETTING_KEYS.TMDB_API_KEY, updates.tmdbApiKey);
    }
    if (updates.port !== undefined) {
      await setSetting(SETTING_KEYS.PORT, updates.port);
    }
    if (updates.jwtSecret !== undefined) {
      await setSetting(SETTING_KEYS.JWT_SECRET, updates.jwtSecret);
    }
    if (updates.enableRouteGuards !== undefined) {
      await setSetting(SETTING_KEYS.ENABLE_ROUTE_GUARDS, updates.enableRouteGuards);
    }
    if (updates.firstRun !== undefined) {
      await setSetting(SETTING_KEYS.FIRST_RUN, updates.firstRun);
    }
    logger.info("Settings updated");
  } catch (error) {
    logger.error("Failed to update settings:", error);
    throw error;
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
 * Settings manager
 */
export const settingsManager = {
  initialize: initializeSettings,
  getSettings,
  getPublicSettings,
  getDefaultSettings,
  updateSettings,
  getTmdbApiKey,
  setTmdbApiKey,
  isFirstRun,
  completeFirstRun,
};
