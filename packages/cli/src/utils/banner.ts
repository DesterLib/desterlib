import chalk from "chalk";
import { getApiVersion } from "./update-checker.js";

export function displayBanner(): void {
  const version = getApiVersion();
  console.clear();
  console.log(
    chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎬  DesterLib Setup                                        ║
║                                                              ║
║   Your Personal Media Server                                 ║
║   Version: ${version.padEnd(48)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `)
  );
  console.log(chalk.gray("  Welcome! Let's set up your DesterLib server.\n"));
}
