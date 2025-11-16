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
 * Get the API version from the root package.json
 * The API version is synced with the root package.json version
 * Falls back to CLI version if root package.json is not accessible
 */
export function getApiVersion(): string {
  try {
    // Navigate from packages/cli/dist/utils to root package.json
    const rootPackagePath = join(__dirname, "../../../../package.json");
    const packageJson = JSON.parse(readFileSync(rootPackagePath, "utf-8"));
    return packageJson.version || getCurrentVersion();
  } catch (error) {
    // Fallback: try to read from apps/api/package.json
    try {
      const apiPackagePath = join(
        __dirname,
        "../../../../apps/api/package.json"
      );
      const packageJson = JSON.parse(readFileSync(apiPackagePath, "utf-8"));
      return packageJson.version || getCurrentVersion();
    } catch (fallbackError) {
      // Final fallback: use CLI version (versions are synced)
      return getCurrentVersion();
    }
  }
}

/**
 * Check for updates from GitHub releases
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();
  let latestVersion: string | null = null;

  try {
    const response = await fetch(
      "https://api.github.com/repos/DesterLib/desterlib/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { tag_name?: string };
      // Extract version from tag (e.g., "v0.2.0" -> "0.2.0")
      if (data.tag_name) {
        latestVersion = data.tag_name.replace(/^v/, "");
      }
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
 * Display update notification if a new version is available
 */
export function displayUpdateNotification(updateInfo: UpdateInfo): void {
  if (!updateInfo.isOutdated || !updateInfo.latestVersion) {
    return;
  }

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

  const updateCommand =
    process.platform === "win32"
      ? "iwr -useb https://raw.githubusercontent.com/DesterLib/desterlib/main/packages/cli/install.ps1 | iex"
      : "curl -fsSL https://raw.githubusercontent.com/DesterLib/desterlib/main/packages/cli/install.sh | bash";

  // Split long commands across multiple lines if needed
  const maxLineLength = 55;
  if (updateCommand.length <= maxLineLength) {
    console.log(
      chalk.yellow("│") +
        `  Run: ${chalk.cyan(updateCommand)}` +
        " ".repeat(Math.max(0, maxLineLength - updateCommand.length - 6)) +
        chalk.yellow("│")
    );
  } else {
    // Show instruction on one line, command on next
    console.log(
      chalk.yellow("│") +
        "  Run the installer script:" +
        " ".repeat(32) +
        chalk.yellow("│")
    );
    console.log(
      chalk.yellow("│") +
        `  ${chalk.cyan(updateCommand)}` +
        " ".repeat(Math.max(0, maxLineLength - updateCommand.length - 2)) +
        chalk.yellow("│")
    );
  }

  console.log(
    chalk.yellow(
      "└─────────────────────────────────────────────────────────┘\n"
    )
  );
}
