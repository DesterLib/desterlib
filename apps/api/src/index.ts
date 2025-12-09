/**
 * CLI Entry Point for DesterLib API
 * Handles command-line arguments and starts the server
 */

import { readFileSync } from "fs";
import { join } from "path";
// Lazy import server to avoid loading Prisma/database for help/version commands
let startServer: (() => Promise<void>) | null = null;

interface CliArgs {
  command?: string;
  port?: number;
  databaseUrl?: string;
  metadataPath?: string;
  apiLogPath?: string;
  redisUrl?: string;
  nodeEnv?: string;
  help?: boolean;
  version?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--port" || arg === "-p") {
      const nextArg = argv[i + 1];
      if (nextArg === undefined) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      args.port = parseInt(nextArg, 10);
      i++; // Skip the next argument
    } else if (arg === "--database-url" || arg === "--db") {
      const nextArg = argv[i + 1];
      if (nextArg === undefined) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      args.databaseUrl = nextArg;
      i++; // Skip the next argument
    } else if (arg === "--metadata-path") {
      const nextArg = argv[i + 1];
      if (nextArg === undefined) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      args.metadataPath = nextArg;
      i++; // Skip the next argument
    } else if (arg === "--api-log-path" || arg === "--log-path") {
      const nextArg = argv[i + 1];
      if (nextArg === undefined) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      args.apiLogPath = nextArg;
      i++; // Skip the next argument
    } else if (arg === "--redis-url") {
      const nextArg = argv[i + 1];
      if (nextArg === undefined) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      args.redisUrl = nextArg;
      i++; // Skip the next argument
    } else if (arg === "--node-env" || arg === "--env") {
      const nextArg = argv[i + 1];
      if (nextArg === undefined) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      args.nodeEnv = nextArg;
      i++; // Skip the next argument
    } else if (!arg.startsWith("-")) {
      // Positional argument (command)
      args.command = arg;
    }
  }

  return args;
}

function showHelp() {
  console.log(`
DesterLib API Server

Usage:
  api [command] [options]

Commands:
  start              Start the API server (default)

Options:
  -h, --help         Show this help message
  -v, --version      Show version information
  -p, --port <port>  Set the server port (default: 3001)
  --database-url, --db <url>  Set the database URL
  --metadata-path <path>      Set the metadata storage path
  --api-log-path, --log-path <path>  Set the API log path
  --redis-url <url>   Set the Redis connection URL
  --node-env, --env <env>    Set the Node.js environment (production/development)

Environment Variables:
  All options can also be set via environment variables:
  - PORT
  - DATABASE_URL
  - METADATA_PATH
  - API_LOG_PATH
  - REDIS_URL
  - NODE_ENV

Examples:
  api start
  api --port 3002
  api --database-url file:./data.db --metadata-path ./metadata
`);
}

function showVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../package.json"), "utf-8")
    );
    console.log(`DesterLib API v${packageJson.version}`);
  } catch (error) {
    console.log("DesterLib API (version unknown)");
  }
}

function applyCliArgsToEnv(args: CliArgs) {
  // Override environment variables with CLI arguments if provided
  if (args.port !== undefined) {
    process.env.PORT = args.port.toString();
  }
  if (args.databaseUrl) {
    process.env.DATABASE_URL = args.databaseUrl;
  }
  if (args.metadataPath) {
    process.env.METADATA_PATH = args.metadataPath;
  }
  if (args.apiLogPath) {
    process.env.API_LOG_PATH = args.apiLogPath;
  }
  if (args.redisUrl) {
    process.env.REDIS_URL = args.redisUrl;
  }
  if (args.nodeEnv) {
    process.env.NODE_ENV = args.nodeEnv;
  }
}

async function main() {
  const args = parseArgs();

  // Handle help
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Handle version
  if (args.version) {
    showVersion();
    process.exit(0);
  }

  // Apply CLI arguments to environment variables
  applyCliArgsToEnv(args);

  // Determine command (default to 'start')
  const command = args.command || "start";

  // Execute command
  switch (command) {
    case "start":
      // Lazy load server module to avoid initializing Prisma for help/version
      if (!startServer) {
        const serverModule = await import("./server.js");
        startServer = serverModule.startServer;
      }
      // Start the server (this will run indefinitely)
      if (startServer) {
        await startServer();
      } else {
        throw new Error("Failed to load server module");
      }
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run 'api --help' for usage information");
      process.exit(1);
  }
}

// Only run main if this file is being executed directly
// (not when imported as a module)
if (require.main === module) {
  main().catch((error) => {
    console.error("Failed to start API:", error);
    process.exit(1);
  });
}

// Export server for programmatic use
export * from "./server";
