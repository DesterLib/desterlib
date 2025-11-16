import chalk from "chalk";

export function displayBanner(): void {
  console.clear();
  console.log(
    chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎬  DesterLib Setup                                        ║
║                                                              ║
║   Your Personal Media Server                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `),
  );
  console.log(chalk.gray("  Welcome! Let's set up your DesterLib server.\n"));
}
