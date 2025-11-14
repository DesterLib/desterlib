import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string | null;
  isOutdated: boolean;
}

/**
 * Get the current version from package.json
 */
export function getCurrentVersion(): string {
  try {
    const packagePath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version || "0.0.0";
  } catch (error) {
    return "0.0.0";
  }
}

/**
 * Check for updates from npm registry
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();
  let latestVersion: string | null = null;

  try {
    const response = await fetch(
      "https://registry.npmjs.org/@desterlib/cli/latest",
      {
        headers: {
          Accept: "application/vnd.npm.install-v1+json",
        },
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { version?: string };
      latestVersion = data.version || null;
    }
  } catch (error) {
    // Silently fail - network issues shouldn't block the CLI
    // Only log in development/debug mode
  }

  const isOutdated = latestVersion !== null && latestVersion !== currentVersion;

  return {
    currentVersion,
    latestVersion,
    isOutdated,
  };
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Display update notification if a new version is available
 */
export function displayUpdateNotification(updateInfo: UpdateInfo): void {
  if (!updateInfo.isOutdated || !updateInfo.latestVersion) {
    return;
  }

  const isMajorUpdate =
    compareVersions(updateInfo.latestVersion, updateInfo.currentVersion) > 0;

  console.log(
    chalk.yellow(
      "\n┌─────────────────────────────────────────────────────────┐"
    )
  );
  console.log(
    chalk.yellow("│") +
      chalk.bold("  ⚠️  Update Available!") +
      " ".repeat(35) +
      chalk.yellow("│")
  );
  console.log(
    chalk.yellow("├─────────────────────────────────────────────────────────┤")
  );
  console.log(
    chalk.yellow("│") +
      `  Current version: ${chalk.gray(updateInfo.currentVersion)}` +
      " ".repeat(25 - updateInfo.currentVersion.length) +
      chalk.yellow("│")
  );
  console.log(
    chalk.yellow("│") +
      `  Latest version:  ${chalk.green(updateInfo.latestVersion)}` +
      " ".repeat(25 - updateInfo.latestVersion.length) +
      chalk.yellow("│")
  );
  console.log(
    chalk.yellow("├─────────────────────────────────────────────────────────┤")
  );
  console.log(
    chalk.yellow("│") +
      `  Run: ${chalk.cyan("npm install -g @desterlib/cli@latest")}` +
      " ".repeat(12) +
      chalk.yellow("│")
  );
  console.log(
    chalk.yellow(
      "└─────────────────────────────────────────────────────────┘\n"
    )
  );
}

/**
 * Check for updates asynchronously (non-blocking)
 * This will check in the background and display a notification if needed
 */
export async function checkForUpdatesAsync(): Promise<void> {
  // Run in background, don't await
  checkForUpdates()
    .then((updateInfo) => {
      displayUpdateNotification(updateInfo);
    })
    .catch(() => {
      // Silently fail - don't interrupt the user experience
    });
}
