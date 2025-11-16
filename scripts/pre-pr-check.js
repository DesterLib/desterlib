#!/usr/bin/env node

/**
 * Pre-PR Check Script
 * Runs essential checks: lint, types, format (warn), versioning
 */

const { execSync } = require("child_process");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rootDir = path.join(__dirname, "..");
let failed = false;

function run(name, command, required = true) {
  try {
    log(`\n▶ ${name}...`, "blue");
    execSync(command, { cwd: rootDir, stdio: "inherit" });
    log(`✓ ${name}`, "green");
    return true;
  } catch (error) {
    if (required) {
      log(`✗ ${name}`, "red");
      failed = true;
    } else {
      log(`⚠ ${name} (warning)`, "yellow");
      log("  💡 Run 'pnpm format' to fix", "yellow");
    }
    return false;
  }
}

log("\n🔍 Pre-PR Checks", "blue");
log("=".repeat(50), "blue");

run("Lint", "pnpm lint");
run("Types", "pnpm check-types");
run("Format", "pnpm format:check", false); // Warning only
run("Versioning", "pnpm verify:versioning");

log("\n" + "=".repeat(50), "blue");

if (failed) {
  log("\n❌ Checks failed - fix issues above", "red");
  process.exit(1);
} else {
  log("\n✅ All checks passed!", "green");
  process.exit(0);
}
