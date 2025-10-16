import { MediaType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { webSocketService, WS_EVENTS } from "../../lib/websocket.js";
import logger from "../../config/logger.js";

export interface LibraryInput {
  name: string;
  type: MediaType;
  path: string;
}

export interface SetupConfig {
  tmdbApiKey: string;
  libraries: LibraryInput[];
}

export class SettingsService {
  /**
   * Get current settings with libraries
   */
  async getSettings() {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
      include: {
        libraries: {
          where: {
            isLibrary: true,
          },
        },
      },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          isSetupComplete: false,
        },
        include: {
          libraries: {
            where: {
              isLibrary: true,
            },
          },
        },
      });
    }

    return settings;
  }

  /**
   * Check if initial setup is complete
   */
  async isSetupComplete() {
    const settings = await this.getSettings();
    return settings.isSetupComplete;
  }

  /**
   * Complete initial setup with provided configuration
   */
  async completeSetup(config: SetupConfig, userId?: string) {
    // First, delete any existing settings and their libraries
    const existingSettings = await prisma.settings.findUnique({
      where: { id: "default" },
      include: {
        libraries: {
          where: { isLibrary: true },
        },
      },
    });

    // Delete existing library collections if any
    if (existingSettings?.libraries) {
      await prisma.collection.deleteMany({
        where: {
          id: { in: existingSettings.libraries.map((lib) => lib.id) },
        },
      });
    }

    // Delete settings
    await prisma.settings.deleteMany({});

    // Create new settings with libraries (as collections)
    const settings = await prisma.settings.create({
      data: {
        id: "default",
        isSetupComplete: true,
        tmdbApiKey: config.tmdbApiKey,
        libraries: {
          create: config.libraries.map((lib) => ({
            name: lib.name,
            slug: this.generateSlug(lib.name),
            isLibrary: true,
            libraryPath: lib.path,
            libraryType: lib.type,
            createdById: userId,
            visibility: "EVERYONE" as const,
          })),
        },
      },
      include: {
        libraries: {
          where: {
            isLibrary: true,
          },
        },
      },
    });

    // Broadcast setup completion via WebSocket
    if (webSocketService.isInitialized()) {
      webSocketService.broadcast(WS_EVENTS.SETTINGS_SETUP_COMPLETED, {
        settings,
        timestamp: new Date().toISOString(),
      });
      logger.info("Setup completed - broadcasted via WebSocket");
    }

    return settings;
  }

  /**
   * Update settings
   */
  async updateSettings(config: Partial<SetupConfig>, userId?: string) {
    // If libraries are provided, replace them all
    if (config.libraries) {
      // Get existing library collections
      const existingSettings = await prisma.settings.findUnique({
        where: { id: "default" },
        include: {
          libraries: {
            where: { isLibrary: true },
          },
        },
      });

      // Delete existing library collections
      if (existingSettings?.libraries) {
        await prisma.collection.deleteMany({
          where: {
            id: { in: existingSettings.libraries.map((lib) => lib.id) },
          },
        });
      }

      // Create new library collections
      const settings = await prisma.settings.update({
        where: { id: "default" },
        data: {
          tmdbApiKey: config.tmdbApiKey,
          libraries: {
            create: config.libraries.map((lib) => ({
              name: lib.name,
              slug: this.generateSlug(lib.name),
              isLibrary: true,
              libraryPath: lib.path,
              libraryType: lib.type,
              createdById: userId,
              visibility: "EVERYONE" as const,
            })),
          },
        },
        include: {
          libraries: {
            where: {
              isLibrary: true,
            },
          },
        },
      });

      // Broadcast settings update via WebSocket
      if (webSocketService.isInitialized()) {
        webSocketService.broadcast(WS_EVENTS.SETTINGS_UPDATED, {
          settings,
          timestamp: new Date().toISOString(),
        });
        logger.info("Settings updated - broadcasted via WebSocket");
      }

      return settings;
    } else {
      // Just update tmdbApiKey
      const settings = await prisma.settings.update({
        where: { id: "default" },
        data: {
          tmdbApiKey: config.tmdbApiKey,
        },
        include: {
          libraries: {
            where: {
              isLibrary: true,
            },
          },
        },
      });

      // Broadcast settings update via WebSocket
      if (webSocketService.isInitialized()) {
        webSocketService.broadcast(WS_EVENTS.SETTINGS_UPDATED, {
          settings,
          timestamp: new Date().toISOString(),
        });
        logger.info("Settings updated - broadcasted via WebSocket");
      }

      return settings;
    }
  }

  /**
   * Generate a URL-safe slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
