#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { setupWizard } from "./commands/setup.js";
import { checkDocker } from "./utils/docker.js";
import { displayBanner } from "./utils/banner.js";
import {
  getCurrentVersion,
  checkForUpdates,
  displayUpdateNotification,
} from "./utils/update-checker.js";

const program = new Command();

program
  .name("desterlib")
  .description("🎬 DesterLib CLI - Configure your personal media server")
  .version(getCurrentVersion());

/**
 * Shared logic for setup command
 */
async function runSetup(options: {
  skipDockerCheck?: boolean;
  skipUpdateCheck?: boolean;
}): Promise<void> {
  displayBanner();

  // Check for updates in the background (non-blocking)
  if (!options.skipUpdateCheck) {
    checkForUpdates()
      .then((updateInfo) => {
        displayUpdateNotification(updateInfo);
      })
      .catch(() => {
        // Silently fail - don't interrupt the user experience
      });
  }

  // Check Docker installation unless skipped
  if (!options.skipDockerCheck) {
    const dockerInstalled = await checkDocker();
    if (!dockerInstalled) {
      console.log(chalk.red("\n❌ Docker is not installed or not running."));
      console.log(chalk.yellow("\n📦 Please install Docker Desktop:"));
      console.log(
        chalk.cyan(
          "  • macOS/Windows: https://www.docker.com/products/docker-desktop",
        ),
      );
      console.log(
        chalk.cyan("  • Linux: https://docs.docker.com/engine/install/"),
      );
      console.log(
        chalk.yellow("\nAfter installing Docker, run this setup again."),
      );
      process.exit(1);
    }
  }

  await setupWizard();
}

program
  .command("setup")
  .description("Run the interactive setup wizard")
  .option("--skip-docker-check", "Skip Docker installation check")
  .option("--skip-update-check", "Skip checking for CLI updates")
  .action(async (options) => {
    await runSetup(options);
  });

program
  .command("update-check")
  .description("Check for CLI updates")
  .action(async () => {
    console.log(chalk.cyan("Checking for updates...\n"));
    const updateInfo = await checkForUpdates();

    if (updateInfo.isOutdated && updateInfo.latestVersion) {
      displayUpdateNotification(updateInfo);
    } else {
      console.log(
        chalk.green(
          `✅ You're using the latest version (${updateInfo.currentVersion})`,
        ),
      );
    }
  });

// Default command is setup
program.action(async () => {
  await runSetup({});
});

program.parse();
