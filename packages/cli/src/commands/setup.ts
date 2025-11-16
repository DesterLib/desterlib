import inquirer from "inquirer";
import chalk from "chalk";
import path from "path";
import os from "os";
import { createConfigFiles, type EnvConfig } from "../utils/env.js";
import {
  startDockerContainers,
  checkContainersStatus,
  checkDockerCompose,
} from "../utils/docker.js";
import {
  getInstallationDir,
  isInstalled,
  validatePath,
  removeDirectory,
  ensureDirectory,
} from "../utils/paths.js";

/**
 * Main setup wizard
 */
export async function setupWizard(): Promise<void> {
  try {
    const installDir = getInstallationDir();
    console.log(chalk.gray(`📁 Installation directory: ${installDir}\n`));

    // Check if Docker Compose is available
    const hasCompose = await checkDockerCompose();
    if (!hasCompose) {
      console.log(chalk.red("❌ Docker Compose is not available"));
      console.log(chalk.yellow("\nPlease install Docker Compose:"));
      console.log(chalk.cyan("  https://docs.docker.com/compose/install/"));
      process.exit(1);
    }

    // Check if already installed
    const alreadyInstalled = isInstalled();
    if (alreadyInstalled) {
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: chalk.yellow(
            "⚠️  DesterLib configuration already exists. What would you like to do?"
          ),
          choices: [
            { name: "Reconfigure (update settings)", value: "reconfigure" },
            { name: "Remove and start fresh", value: "reinstall" },
            { name: "Cancel", value: "cancel" },
          ],
        },
      ]);

      if (action === "cancel") {
        console.log(chalk.yellow("\n👋 Setup cancelled."));
        return;
      }

      if (action === "reinstall") {
        console.log(chalk.yellow("\n🗑️  Removing existing configuration..."));
        const removed = await removeDirectory(installDir);
        if (!removed) {
          console.log(chalk.red("❌ Failed to remove existing configuration"));
          process.exit(1);
        }
      }
      // For 'reconfigure', we just overwrite the files
    }

    // Ensure installation directory exists
    await ensureDirectory(installDir);

    console.log(chalk.cyan.bold("📋 Configuration Setup\n"));
    console.log(chalk.gray("Please provide the following information:\n"));

    // Gather configuration
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "mediaPath",
        message: "📚 Path to your media library:",
        default: path.join(os.homedir(), "Media"),
        validate: (input: string) => {
          const validation = validatePath(input);
          if (!validation.valid) {
            return validation.message || "Invalid path";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "port",
        message: "🔌 API server port:",
        default: "3001",
        validate: (input: string) => {
          const port = parseInt(input, 10);
          if (isNaN(port) || port < 1024 || port > 65535) {
            return "Please enter a valid port number (1024-65535)";
          }
          return true;
        },
      },
    ]);

    console.log(chalk.cyan.bold("\n🔒 Database Configuration\n"));
    console.log(chalk.gray("Configure PostgreSQL database credentials:\n"));

    const dbAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "postgresUser",
        message: "👤 Database username:",
        default: "desterlib",
      },
      {
        type: "password",
        name: "postgresPassword",
        message: "🔐 Database password:",
        mask: "*",
        validate: (input: string) => {
          if (input.length < 8) {
            return "Password must be at least 8 characters";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "postgresDb",
        message: "🗄️  Database name:",
        default: "desterlib",
      },
    ]);

    // Build configuration
    const config: EnvConfig = {
      mediaPath: answers.mediaPath,
      port: parseInt(answers.port, 10),
      postgresUser: dbAnswers.postgresUser,
      postgresPassword: dbAnswers.postgresPassword,
      postgresDb: dbAnswers.postgresDb,
      databaseUrl: `postgresql://${dbAnswers.postgresUser}:${dbAnswers.postgresPassword}@postgres:5432/${dbAnswers.postgresDb}?schema=public`,
    };

    // Display configuration review
    console.log(chalk.cyan.bold("\n📋 Configuration Review\n"));
    console.log(chalk.gray("Please review your configuration:\n"));
    console.log(
      chalk.white("  Media Path:       ") + chalk.cyan(config.mediaPath)
    );
    console.log(
      chalk.white("  API Port:         ") + chalk.cyan(config.port.toString())
    );
    console.log(
      chalk.white("  Database User:    ") + chalk.cyan(config.postgresUser)
    );
    console.log(
      chalk.white("  Database Name:    ") + chalk.cyan(config.postgresDb)
    );
    console.log(
      chalk.white("  Database Password:") + chalk.cyan("***hidden***")
    );
    console.log("");
    console.log(
      chalk.gray(
        "Note: TMDB API key and JWT secret are configured in-app, not here."
      )
    );
    console.log("");

    // Confirm before proceeding
    const { confirmConfig } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmConfig",
        message: chalk.yellow("📝 Proceed with this configuration?"),
        default: true,
      },
    ]);

    if (!confirmConfig) {
      console.log(chalk.yellow("\n👋 Setup cancelled. No changes were made."));
      return;
    }

    console.log(chalk.cyan.bold("\n⚙️  Applying Configuration\n"));

    // Create all configuration files
    const configCreated = await createConfigFiles(config, installDir);
    if (!configCreated) {
      console.log(
        chalk.red("\n❌ Failed to create configuration. Setup aborted.")
      );
      process.exit(1);
    }

    // Ask if user wants to start containers now
    const { startNow } = await inquirer.prompt([
      {
        type: "confirm",
        name: "startNow",
        message: chalk.cyan.bold("\n🚀 Start Docker containers now?"),
        default: true,
      },
    ]);

    if (startNow) {
      console.log("");
      const started = await startDockerContainers(installDir);

      if (started) {
        // Wait a moment for containers to initialize
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check status
        await checkContainersStatus(installDir);

        // Display success message
        displaySuccessMessage(config.port, installDir);
      } else {
        console.log(chalk.red("\n❌ Failed to start containers."));
        console.log(chalk.yellow("\nYou can start them manually with:"));
        console.log(chalk.cyan(`  cd ${installDir}`));
        console.log(chalk.cyan("  docker-compose up -d"));
      }
    } else {
      console.log(chalk.yellow("\n⏸️  Containers not started."));
      console.log(chalk.gray("\nTo start them later, run:"));
      console.log(chalk.cyan(`  cd ${installDir}`));
      console.log(chalk.cyan("  docker-compose up -d"));
      console.log("");
    }
  } catch (error: any) {
    if (error.isTtyError) {
      console.error(
        chalk.red("\n❌ Interactive prompts not supported in this environment")
      );
    } else if (error.message === "User force closed the prompt") {
      console.log(chalk.yellow("\n\n👋 Setup cancelled by user."));
    } else {
      console.error(
        chalk.red("\n❌ An error occurred during setup:"),
        error.message
      );
    }
    process.exit(1);
  }
}

/**
 * Display success message with next steps
 */
function displaySuccessMessage(port: number, installDir: string): void {
  console.log(chalk.green.bold("\n✅ Setup Complete!\n"));
  console.log(chalk.cyan("📚 Your DesterLib server is now running!\n"));

  console.log(chalk.bold("🔗 Quick Links:"));
  console.log(
    chalk.gray("  ├─") +
      chalk.cyan(` API Server:      http://localhost:${port}`)
  );
  console.log(
    chalk.gray("  ├─") +
      chalk.cyan(` API Docs:        http://localhost:${port}/api/docs`)
  );
  console.log(
    chalk.gray("  ├─") +
      chalk.cyan(` Health Check:    http://localhost:${port}/health`)
  );
  console.log(
    chalk.gray("  └─") +
      chalk.cyan(` WebSocket:       ws://localhost:${port}/ws`)
  );

  console.log(chalk.bold("\n📱 Next Steps:"));
  console.log(
    chalk.gray("  1.") +
      chalk.white(" Open the API docs and configure your media library")
  );
  console.log(
    chalk.gray("  2.") +
      chalk.white(" Download the DesterLib mobile/desktop app")
  );
  console.log(
    chalk.gray("  3.") + chalk.white(` Connect to: http://localhost:${port}`)
  );

  console.log(chalk.bold("\n📂 Installation Location:"));
  console.log(chalk.gray("  ") + chalk.white(installDir));

  console.log(chalk.bold("\n🛠️  Useful Commands:"));
  console.log(
    chalk.gray("  ├─") +
      chalk.white(" Stop:    ") +
      chalk.cyan(`cd ${installDir} && docker-compose down`)
  );
  console.log(
    chalk.gray("  ├─") +
      chalk.white(" Restart: ") +
      chalk.cyan(`cd ${installDir} && docker-compose restart`)
  );
  console.log(
    chalk.gray("  ├─") +
      chalk.white(" Logs:    ") +
      chalk.cyan(`cd ${installDir} && docker-compose logs -f`)
  );
  console.log(
    chalk.gray("  └─") +
      chalk.white(" Status:  ") +
      chalk.cyan(`cd ${installDir} && docker-compose ps`)
  );

  console.log(
    chalk.gray("\n📖 Documentation: ") + chalk.cyan("https://docs.dester.in")
  );
  console.log("");
}
