import execa from "execa";
import chalk from "chalk";
import ora from "ora";

/**
 * Check if Docker is installed and running
 */
export async function checkDocker(): Promise<boolean> {
  const spinner = ora("Checking Docker installation...").start();

  try {
    // Check if docker command exists
    await execa("docker", ["--version"]);

    // Check if Docker daemon is running
    await execa("docker", ["ps"]);

    spinner.succeed(chalk.green("Docker is installed and running"));
    return true;
  } catch (error) {
    spinner.fail(chalk.red("Docker check failed"));
    return false;
  }
}

/**
 * Check if Docker Compose is available
 */
export async function checkDockerCompose(): Promise<boolean> {
  try {
    // Try docker compose (v2)
    await execa("docker", ["compose", "version"]);
    return true;
  } catch {
    try {
      // Try docker-compose (v1)
      await execa("docker-compose", ["--version"]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get the appropriate docker compose command
 */
export async function getDockerComposeCommand(): Promise<string[]> {
  try {
    await execa("docker", ["compose", "version"]);
    return ["docker", "compose"];
  } catch {
    return ["docker-compose"];
  }
}

/**
 * Start Docker containers
 */
export async function startDockerContainers(
  installDir: string
): Promise<boolean> {
  const spinner = ora("Starting Docker containers...").start();

  try {
    const composeCmd = await getDockerComposeCommand();
    const command = composeCmd[0];
    const baseArgs = composeCmd.slice(1);

    if (!command) {
      throw new Error("No docker compose command found");
    }

    spinner.text =
      "Building and starting containers (this may take a few minutes)...";

    await execa(command, [...baseArgs, "up", "-d", "--build"], {
      cwd: installDir,
      stdio: "pipe",
    });

    spinner.succeed(chalk.green("Docker containers started successfully"));
    return true;
  } catch (error: any) {
    spinner.fail(chalk.red("Failed to start Docker containers"));
    console.error(chalk.red("\nError details:"), error.message);
    return false;
  }
}

/**
 * Stop Docker containers
 * Note: Currently unused, reserved for future stop/restart commands
 */
export async function stopDockerContainers(
  installDir: string
): Promise<boolean> {
  const spinner = ora("Stopping Docker containers...").start();

  try {
    const composeCmd = await getDockerComposeCommand();
    const command = composeCmd[0];
    const baseArgs = composeCmd.slice(1);

    if (!command) {
      throw new Error("No docker compose command found");
    }

    await execa(command, [...baseArgs, "down"], {
      cwd: installDir,
      stdio: "pipe",
    });

    spinner.succeed(chalk.green("Docker containers stopped"));
    return true;
  } catch (error: any) {
    spinner.fail(chalk.red("Failed to stop Docker containers"));
    console.error(chalk.red("\nError details:"), error.message);
    return false;
  }
}

/**
 * Check Docker containers status
 */
export async function checkContainersStatus(installDir: string): Promise<void> {
  const spinner = ora("Checking container status...").start();

  try {
    const composeCmd = await getDockerComposeCommand();
    const command = composeCmd[0];
    const baseArgs = composeCmd.slice(1);

    if (!command) {
      throw new Error("No docker compose command found");
    }

    const { stdout } = await execa(command, [...baseArgs, "ps"], {
      cwd: installDir,
    });

    spinner.stop();
    console.log(chalk.cyan("\n📊 Container Status:"));
    console.log(stdout);
  } catch (error) {
    spinner.fail(chalk.red("Failed to check container status"));
  }
}
