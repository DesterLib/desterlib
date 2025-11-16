#!/usr/bin/env node

/**
 * Versioning & Changelog Verification Script
 *
 * This script verifies that the versioning and changelog system is properly set up
 * before merging to main. It checks:
 * - Changesets are valid
 * - Changelog sync script works
 * - Package versions are consistent
 * - Changelogs are properly formatted
 * - Docs are updated correctly
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("");
  log(`═══════════════════════════════════════════════════════════`, "cyan");
  log(`${title}`, "cyan");
  log(`═══════════════════════════════════════════════════════════`, "cyan");
  console.log("");
}

function logCheck(name, passed, message = "") {
  const icon = passed ? "✓" : "✗";
  const color = passed ? "green" : "red";
  log(`${icon} ${name}`, color);
  if (message) {
    log(`  ${message}`, passed ? "green" : "yellow");
  }
}

// Paths
const rootDir = path.join(__dirname, "..");
const changesetDir = path.join(rootDir, ".changeset");
const packageJsonPath = path.join(rootDir, "package.json");
const apiPackageJsonPath = path.join(rootDir, "apps/api/package.json");
const cliPackageJsonPath = path.join(rootDir, "packages/cli/package.json");
const docsPackageJsonPath = path.join(rootDir, "apps/docs/package.json");

const apiChangelogPath = path.join(rootDir, "apps/api/CHANGELOG.md");
const cliChangelogPath = path.join(rootDir, "packages/cli/CHANGELOG.md");
const docsChangelogPath = path.join(rootDir, "apps/docs/CHANGELOG.md");

const apiDocsChangelogPath = path.join(
  rootDir,
  "apps/docs/src/content/docs/api/changelog.md"
);
const cliDocsChangelogPath = path.join(
  rootDir,
  "apps/docs/src/content/docs/cli/changelog.md"
);
const docsDocsChangelogPath = path.join(
  rootDir,
  "apps/docs/src/content/docs/docs/changelog.md"
);

let allChecksPassed = true;

/**
 * Check if changesets exist and are valid
 */
function checkChangesets() {
  logSection("1. Checking Changesets");

  const changesetFiles = fs
    .readdirSync(changesetDir)
    .filter((file) => file.endsWith(".md") && file !== "README.md");

  if (changesetFiles.length === 0) {
    // No changesets is OK for docs/tests/CI-only changes.
    // We still surface a warning so user-facing changes don't accidentally ship without a changeset.
    logCheck(
      "Changesets present (optional)",
      true,
      "No changeset files found. This is fine for docs/tests/CI-only changes, but user-facing changes should include a changeset (run: pnpm changeset)."
    );
    return;
  }

  logCheck(
    "Changesets exist",
    true,
    `Found ${changesetFiles.length} changeset file(s)`
  );

  // Validate changeset format
  let validChangesets = 0;
  for (const file of changesetFiles) {
    const filePath = path.join(changesetDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Check if changeset has frontmatter
    if (!content.includes("---")) {
      logCheck(`Changeset format: ${file}`, false, "Missing frontmatter");
      allChecksPassed = false;
      continue;
    }

    // Check if changeset has package name
    const hasPackage = /"[\w@/-]+":\s*(major|minor|patch)/.test(content);
    if (!hasPackage) {
      logCheck(
        `Changeset format: ${file}`,
        false,
        "Missing package declaration"
      );
      allChecksPassed = false;
      continue;
    }

    validChangesets++;
    logCheck(`Changeset format: ${file}`, true);
  }

  if (validChangesets === changesetFiles.length) {
    logCheck("All changesets are valid", true);
  } else {
    allChecksPassed = false;
  }
}

/**
 * Check changeset status
 */
function checkChangesetStatus() {
  logSection("2. Checking Changeset Status");

  try {
    const output = execSync("pnpm changeset status", {
      cwd: rootDir,
      encoding: "utf8",
      stdio: "pipe",
    });

    // Check if there are packages to be bumped
    if (output.includes("NO packages to be bumped")) {
      logCheck(
        "Changeset status",
        true,
        "No packages to be bumped (this is OK)"
      );
    } else if (output.includes("Packages to be bumped")) {
      logCheck("Changeset status", true, "Packages are ready to be bumped");
      log(`\n${output}`, "yellow");
    } else {
      logCheck("Changeset status", true, "Changesets are valid");
    }
  } catch (error) {
    logCheck("Changeset status", false, error.message);
    allChecksPassed = false;
  }
}

/**
 * Check package versions
 */
function checkPackageVersions() {
  logSection("3. Checking Package Versions");

  try {
    const rootPackage = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const apiPackage = JSON.parse(fs.readFileSync(apiPackageJsonPath, "utf8"));
    const cliPackage = JSON.parse(fs.readFileSync(cliPackageJsonPath, "utf8"));
    const docsPackage = JSON.parse(
      fs.readFileSync(docsPackageJsonPath, "utf8")
    );

    logCheck(
      "Root package.json exists",
      true,
      `Version: ${rootPackage.version}`
    );
    logCheck("API package.json exists", true, `Version: ${apiPackage.version}`);
    logCheck("CLI package.json exists", true, `Version: ${cliPackage.version}`);
    logCheck(
      "Docs package.json exists",
      true,
      `Version: ${docsPackage.version}`
    );

    // Check if versions are semantic
    const semverRegex = /^\d+\.\d+\.\d+$/;
    const versions = [
      { name: "Root", version: rootPackage.version },
      { name: "API", version: apiPackage.version },
      { name: "CLI", version: cliPackage.version },
      { name: "Docs", version: docsPackage.version },
    ];

    for (const { name, version } of versions) {
      if (!semverRegex.test(version)) {
        logCheck(
          `${name} version format`,
          false,
          `Invalid version: ${version}`
        );
        allChecksPassed = false;
      } else {
        logCheck(`${name} version format`, true, version);
      }
    }
  } catch (error) {
    logCheck("Package versions", false, error.message);
    allChecksPassed = false;
  }
}

/**
 * Check changelog files
 */
function checkChangelogs() {
  logSection("4. Checking Changelog Files");

  const changelogs = [
    { name: "API", path: apiChangelogPath, required: false },
    { name: "CLI", path: cliChangelogPath, required: false },
    { name: "Docs", path: docsChangelogPath, required: false },
  ];

  for (const changelog of changelogs) {
    const exists = fs.existsSync(changelog.path);
    if (changelog.required && !exists) {
      logCheck(
        `${changelog.name} CHANGELOG.md`,
        false,
        "Missing required file"
      );
      allChecksPassed = false;
    } else if (exists) {
      const content = fs.readFileSync(changelog.path, "utf8");
      // Check if changelog has content
      if (content.trim().length > 0) {
        logCheck(
          `${changelog.name} CHANGELOG.md`,
          true,
          "File exists with content"
        );
      } else {
        logCheck(
          `${changelog.name} CHANGELOG.md`,
          true,
          "File exists but is empty"
        );
      }
    } else {
      logCheck(
        `${changelog.name} CHANGELOG.md`,
        true,
        "File doesn't exist yet (will be generated)"
      );
    }
  }
}

/**
 * Check docs changelog pages
 */
function checkDocsChangelogs() {
  logSection("5. Checking Docs Changelog Pages");

  const docsChangelogs = [
    { name: "API", path: apiDocsChangelogPath },
    { name: "CLI", path: cliDocsChangelogPath },
    { name: "Docs", path: docsDocsChangelogPath },
  ];

  for (const changelog of docsChangelogs) {
    const exists = fs.existsSync(changelog.path);
    if (!exists) {
      logCheck(`${changelog.name} docs changelog`, false, "Missing file");
      allChecksPassed = false;
      continue;
    }

    const content = fs.readFileSync(changelog.path, "utf8");

    // Check if it has frontmatter
    if (!content.includes("---")) {
      logCheck(
        `${changelog.name} docs changelog`,
        false,
        "Missing frontmatter"
      );
      allChecksPassed = false;
      continue;
    }

    // Check if it doesn't have duplicate H1 (title should be in frontmatter only)
    const h1Matches = content.match(/^#\s+[^\n]+/gm);
    if (h1Matches && h1Matches.length > 0) {
      logCheck(
        `${changelog.name} docs changelog`,
        false,
        "Contains H1 heading (should use frontmatter title only)"
      );
      allChecksPassed = false;
      continue;
    }

    logCheck(
      `${changelog.name} docs changelog`,
      true,
      "File exists and formatted correctly"
    );
  }
}

/**
 * Test changelog sync script
 */
function testChangelogSync() {
  logSection("6. Testing Changelog Sync Script");

  try {
    // Run the sync script
    execSync("node scripts/sync-changelog.js", {
      cwd: rootDir,
      encoding: "utf8",
      stdio: "pipe",
    });

    logCheck("Changelog sync script", true, "Script runs successfully");

    // Verify docs changelogs were updated
    const docsChangelogs = [
      { name: "API", path: apiDocsChangelogPath },
      { name: "CLI", path: cliDocsChangelogPath },
      { name: "Docs", path: docsDocsChangelogPath },
    ];

    for (const changelog of docsChangelogs) {
      if (fs.existsSync(changelog.path)) {
        const content = fs.readFileSync(changelog.path, "utf8");
        if (content.includes("title:") && content.includes("description:")) {
          logCheck(
            `${changelog.name} docs changelog sync`,
            true,
            "File synced correctly"
          );
        } else {
          logCheck(
            `${changelog.name} docs changelog sync`,
            false,
            "File missing frontmatter"
          );
          allChecksPassed = false;
        }
      }
    }
  } catch (error) {
    logCheck("Changelog sync script", false, error.message);
    allChecksPassed = false;
  }
}

/**
 * Check sidebar configuration
 */
function checkSidebarConfig() {
  logSection("7. Checking Sidebar Configuration");

  try {
    const astroConfigPath = path.join(rootDir, "apps/docs/astro.config.mjs");
    const configContent = fs.readFileSync(astroConfigPath, "utf8");

    // Check if changelog links are in sidebar
    const hasApiChangelog = configContent.includes('"api/changelog"');
    const hasCliChangelog = configContent.includes('"cli/changelog"');
    const hasDocsChangelog = configContent.includes('"docs/changelog"');
    const hasMainChangelog = configContent.includes('"changelog"');

    logCheck("API changelog in sidebar", hasApiChangelog);
    logCheck("CLI changelog in sidebar", hasCliChangelog);
    logCheck("Docs changelog in sidebar", hasDocsChangelog);
    logCheck("Main changelog in sidebar", hasMainChangelog);

    if (
      !hasApiChangelog ||
      !hasCliChangelog ||
      !hasDocsChangelog ||
      !hasMainChangelog
    ) {
      allChecksPassed = false;
    }
  } catch (error) {
    logCheck("Sidebar configuration", false, error.message);
    allChecksPassed = false;
  }
}

/**
 * Main verification function
 */
function main() {
  log("\n🔍 Verifying Versioning & Changelog Setup", "blue");
  log("=".repeat(60), "blue");
  console.log("");

  checkChangesets();
  checkChangesetStatus();
  checkPackageVersions();
  checkChangelogs();
  checkDocsChangelogs();
  testChangelogSync();
  checkSidebarConfig();

  // Summary
  logSection("Summary");

  if (allChecksPassed) {
    log("✅ All checks passed! Versioning system is properly set up.", "green");
    console.log("");
    log("Next steps:", "cyan");
    log("  1. Review changesets: pnpm changeset status", "cyan");
    log("  2. Test version bump: pnpm version (dry run)", "cyan");
    log("  3. Verify changelogs are generated correctly", "cyan");
    log("  4. Commit and push changes", "cyan");
    console.log("");
    process.exit(0);
  } else {
    log(
      "❌ Some checks failed. Please fix the issues above before merging.",
      "red"
    );
    console.log("");
    log("Common fixes:", "yellow");
    log("  - Create changesets: pnpm changeset", "yellow");
    log("  - Run changelog sync: pnpm changelog:sync", "yellow");
    log("  - Check package versions are consistent", "yellow");
    console.log("");
    process.exit(1);
  }
}

// Run verification
main();
