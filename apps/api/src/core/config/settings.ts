import { logger } from "../../lib/utils";
import prisma from "../../lib/database/prisma";

export interface UserSettings {
  tmdbApiKey?: string;
  port: number;
  jwtSecret: string;
  enableRouteGuards: boolean;
  firstRun: boolean;
}

const defaultSettings: UserSettings = {
  port: 3001,
  jwtSecret: "your-secret-key-change-in-production",
  enableRouteGuards: false,
  firstRun: true,
};

// Module-level state
let settings: UserSettings | null = null;
let initialized = false;

async function loadSettings(): Promise<UserSettings> {
  try {
    // Load settings from database
    const dbSettings = await prisma.settings.findMany();

    // Convert database rows to settings object
    const parsedSettings: Partial<UserSettings> = {};

    for (const setting of dbSettings) {
      try {
        const value = JSON.parse(setting.value);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parsedSettings as any)[setting.key] = value;
      } catch {
        // If JSON parsing fails, treat as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parsedSettings as any)[setting.key] = setting.value;
      }
    }

    const finalSettings = { ...defaultSettings, ...parsedSettings };
    logger.info("Settings loaded from database");
    return finalSettings;
  } catch (error) {
    logger.error("Failed to load settings from database:", error);
    logger.info("Using default settings");
    return { ...defaultSettings };
  }
}

async function saveSetting(key: string, value: unknown): Promise<void> {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);

    await prisma.settings.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue },
    });

    logger.debug(`Setting ${key} saved to database`);
  } catch (error) {
    logger.error(`Failed to save setting ${key}:`, error);
    throw new Error(`Failed to save setting ${key}`);
  }
}

export async function initializeSettings(): Promise<void> {
  if (!initialized) {
    settings = await loadSettings();
    initialized = true;
  }
}

export async function getSettings(): Promise<UserSettings> {
  if (!initialized) {
    await initializeSettings();
  }
  return { ...settings! };
}

// Synchronous getters for settings that need to be available immediately (fallback to defaults)
export function getDefaultSettings(): UserSettings {
  return { ...defaultSettings };
}

export async function updateSettings(
  updates: Partial<UserSettings>
): Promise<void> {
  try {
    // Update each setting individually in the database
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await saveSetting(key, value);
      }
    }

    // Refresh cached settings
    settings = await loadSettings();
    logger.info("Settings updated successfully");
  } catch (error) {
    logger.error("Failed to update settings:", error);
    throw error;
  }
}

export async function getTmdbApiKey(): Promise<string> {
  const currentSettings = await getSettings();
  return currentSettings.tmdbApiKey || "";
}

export async function setTmdbApiKey(apiKey: string): Promise<void> {
  await updateSettings({ tmdbApiKey: apiKey });
}

export async function isFirstRun(): Promise<boolean> {
  const currentSettings = await getSettings();
  return currentSettings.firstRun;
}

export async function completeFirstRun(): Promise<void> {
  await updateSettings({ firstRun: false });
}

// For backward compatibility, maintain the settingsManager object interface
export const settingsManager = {
  initialize: initializeSettings,
  getSettings,
  getDefaultSettings,
  updateSettings,
  getTmdbApiKey,
  setTmdbApiKey,
  isFirstRun,
  completeFirstRun,
};
