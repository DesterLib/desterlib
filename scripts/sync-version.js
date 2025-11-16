#!/usr/bin/env node

/**
 * Version Sync Script
 *
 * This script ensures all version numbers across the monorepo are in sync.
 * It reads the version from the root package.json and updates:
 * - apps/api/package.json
 * - apps/docs/package.json
 * - packages/cli/package.json
 * - desterlib-flutter/pubspec.yaml
 * - desterlib-flutter/lib/api/pubspec.yaml
 * - desterlib-flutter/lib/core/config/api_config.dart
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for terminal output
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

// Read root version
const rootPackagePath = path.join(__dirname, "../package.json");
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
const version = rootPackage.version;

if (!version) {
  log("❌ Error: No version found in root package.json", "red");
  process.exit(1);
}

log(`\n📦 Syncing version: ${version}`, "blue");
log("─".repeat(50), "blue");

let errors = 0;
let updates = 0;

// Update API package.json
try {
  const apiPackagePath = path.join(__dirname, "../apps/api/package.json");
  const apiPackage = JSON.parse(fs.readFileSync(apiPackagePath, "utf8"));

  if (apiPackage.version !== version) {
    apiPackage.version = version;
    fs.writeFileSync(
      apiPackagePath,
      JSON.stringify(apiPackage, null, 2) + "\n"
    );
    log(`✅ Updated apps/api/package.json: ${version}`, "green");
    updates++;
  } else {
    log(`✓  apps/api/package.json already at ${version}`, "yellow");
  }
} catch (error) {
  log(`❌ Error updating apps/api/package.json: ${error.message}`, "red");
  errors++;
}

// Update Docs package.json
try {
  const docsPackagePath = path.join(__dirname, "../apps/docs/package.json");
  const docsPackage = JSON.parse(fs.readFileSync(docsPackagePath, "utf8"));

  if (docsPackage.version !== version) {
    docsPackage.version = version;
    fs.writeFileSync(
      docsPackagePath,
      JSON.stringify(docsPackage, null, 2) + "\n"
    );
    log(`✅ Updated apps/docs/package.json: ${version}`, "green");
    updates++;
  } else {
    log(`✓  apps/docs/package.json already at ${version}`, "yellow");
  }
} catch (error) {
  log(`❌ Error updating apps/docs/package.json: ${error.message}`, "red");
  errors++;
}

// Update CLI package.json
try {
  const cliPackagePath = path.join(__dirname, "../packages/cli/package.json");
  const cliPackage = JSON.parse(fs.readFileSync(cliPackagePath, "utf8"));

  if (cliPackage.version !== version) {
    cliPackage.version = version;
    fs.writeFileSync(
      cliPackagePath,
      JSON.stringify(cliPackage, null, 2) + "\n"
    );
    log(`✅ Updated packages/cli/package.json: ${version}`, "green");
    updates++;
  } else {
    log(`✓  packages/cli/package.json already at ${version}`, "yellow");
  }
} catch (error) {
  log(`❌ Error updating packages/cli/package.json: ${error.message}`, "red");
  errors++;
}

// Update Flutter pubspec.yaml
try {
  const flutterPubspecPath = path.join(
    __dirname,
    "../../desterlib-flutter/pubspec.yaml"
  );
  let pubspecContent = fs.readFileSync(flutterPubspecPath, "utf8");

  const versionRegex = /^version:\s*[\d.]+$/m;
  if (versionRegex.test(pubspecContent)) {
    const newContent = pubspecContent.replace(
      versionRegex,
      `version: ${version}`
    );
    if (newContent !== pubspecContent) {
      fs.writeFileSync(flutterPubspecPath, newContent);
      log(`✅ Updated desterlib-flutter/pubspec.yaml: ${version}`, "green");
      updates++;
    } else {
      log(`✓  desterlib-flutter/pubspec.yaml already at ${version}`, "yellow");
    }
  } else {
    log(`❌ Could not find version in desterlib-flutter/pubspec.yaml`, "red");
    errors++;
  }
} catch (error) {
  log(
    `❌ Error updating desterlib-flutter/pubspec.yaml: ${error.message}`,
    "red"
  );
  errors++;
}

// Update Flutter API client pubspec.yaml
try {
  const apiClientPubspecPath = path.join(
    __dirname,
    "../../desterlib-flutter/lib/api/pubspec.yaml"
  );
  let pubspecContent = fs.readFileSync(apiClientPubspecPath, "utf8");

  const versionRegex = /^version:\s*[\d.]+$/m;
  if (versionRegex.test(pubspecContent)) {
    const newContent = pubspecContent.replace(
      versionRegex,
      `version: ${version}`
    );
    if (newContent !== pubspecContent) {
      fs.writeFileSync(apiClientPubspecPath, newContent);
      log(
        `✅ Updated desterlib-flutter/lib/api/pubspec.yaml: ${version}`,
        "green"
      );
      updates++;
    } else {
      log(
        `✓  desterlib-flutter/lib/api/pubspec.yaml already at ${version}`,
        "yellow"
      );
    }
  } else {
    log(
      `❌ Could not find version in desterlib-flutter/lib/api/pubspec.yaml`,
      "red"
    );
    errors++;
  }
} catch (error) {
  log(
    `❌ Error updating desterlib-flutter/lib/api/pubspec.yaml: ${error.message}`,
    "red"
  );
  errors++;
}

// Update Flutter API config
try {
  const apiConfigPath = path.join(
    __dirname,
    "../../desterlib-flutter/lib/core/config/api_config.dart"
  );
  let configContent = fs.readFileSync(apiConfigPath, "utf8");

  const versionRegex = /static const String clientVersion = '[^']+';/;
  if (versionRegex.test(configContent)) {
    const newContent = configContent.replace(
      versionRegex,
      `static const String clientVersion = '${version}'; // Synced from root package.json`
    );
    if (newContent !== configContent) {
      fs.writeFileSync(apiConfigPath, newContent);
      log(
        `✅ Updated desterlib-flutter/lib/core/config/api_config.dart: ${version}`,
        "green"
      );
      updates++;
    } else {
      log(
        `✓  desterlib-flutter/lib/core/config/api_config.dart already at ${version}`,
        "yellow"
      );
    }
  } else {
    log(`❌ Could not find clientVersion in api_config.dart`, "red");
    errors++;
  }
} catch (error) {
  log(`❌ Error updating api_config.dart: ${error.message}`, "red");
  errors++;
}

// Summary
log("\n" + "─".repeat(50), "blue");
if (errors > 0) {
  log(`❌ Completed with ${errors} error(s) and ${updates} update(s)`, "red");
  process.exit(1);
} else if (updates > 0) {
  log(`✅ Successfully updated ${updates} file(s)`, "green");
} else {
  log(`✓  All files already at version ${version}`, "yellow");
}
log("");
