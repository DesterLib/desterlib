#!/usr/bin/env node

/**
 * Changelog Sync Script
 *
 * This script syncs the root CHANGELOG.md to the docs site.
 * It reads the CHANGELOG.md and updates the docs changelog page.
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

// Paths
const rootChangelogPath = path.join(__dirname, "../CHANGELOG.md");
const docsChangelogPath = path.join(
  __dirname,
  "../apps/docs/src/content/docs/changelog.md"
);

try {
  // Read root CHANGELOG.md
  if (!fs.existsSync(rootChangelogPath)) {
    log(`❌ Error: CHANGELOG.md not found at ${rootChangelogPath}`, "red");
    process.exit(1);
  }

  let changelogContent = fs.readFileSync(rootChangelogPath, "utf8");

  // Remove the first heading (# Changelog) to avoid duplication with frontmatter title
  // This handles both "# Changelog" and "# Changelog\n" patterns
  changelogContent = changelogContent
    .replace(/^# Changelog\s*\n?/i, "")
    .trimStart();

  // Create the docs changelog content
  // The frontmatter is separated from the content
  const docsChangelogContent = `---
title: Changelog
description: All notable changes to DesterLib
---

${changelogContent}
`;

  // Ensure docs directory exists
  const docsDir = path.dirname(docsChangelogPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Write to docs
  fs.writeFileSync(docsChangelogPath, docsChangelogContent);

  log("\n📝 Syncing CHANGELOG.md to docs", "blue");
  log("─".repeat(50), "blue");
  log(`✅ Updated ${docsChangelogPath}`, "green");
  log("");

  // Verify the root changelog is readable
  const lines = changelogContent.split("\n").length;
  log(`✓  Root CHANGELOG.md has ${lines} lines`, "yellow");
  log("");
} catch (error) {
  log(`❌ Error syncing changelog: ${error.message}`, "red");
  log(error.stack, "red");
  process.exit(1);
}
