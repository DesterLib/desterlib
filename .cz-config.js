const { execSync } = require("child_process");
const path = require("path");

// Function to detect which package/app has changes
function detectScope() {
  try {
    const stagedFiles = execSync("git diff --cached --name-only", {
      encoding: "utf8",
    })
      .split("\n")
      .filter((file) => file.trim());

    if (stagedFiles.length === 0) {
      return [];
    }

    const scopes = new Set();

    stagedFiles.forEach((file) => {
      // Check if file is in apps/
      if (file.startsWith("apps/")) {
        const parts = file.split("/");
        if (parts.length > 1) {
          scopes.add(parts[1]); // e.g., 'web', 'docs'
        }
      }

      // Check if file is in packages/
      if (file.startsWith("packages/")) {
        const parts = file.split("/");
        if (parts.length > 1) {
          // Get package name from package.json
          const packageJsonPath = path.join(
            "packages",
            parts[1],
            "package.json"
          );
          try {
            const packageJson = require(path.resolve(packageJsonPath));
            const packageName = packageJson.name;
            // Extract simple name from @repo/ui -> ui
            const simpleName = packageName.replace("@repo/", "");
            scopes.add(simpleName);
          } catch (e) {
            // Fallback to directory name
            scopes.add(parts[1]);
          }
        }
      }

      // Root level changes (package.json, turbo.json, etc.)
      if (!file.includes("/") || file.split("/").length === 1) {
        scopes.add("root");
      }
    });

    return Array.from(scopes).sort();
  } catch (error) {
    console.warn("Could not detect scope:", error.message);
    return [];
  }
}

const availableScopes = detectScope();

// Define hardcoded scopes that should always be available
const hardcodedScopes = [
  { name: "web", value: "web" },
  { name: "api", value: "api" },
  { name: "ui", value: "ui" },
  { name: "eslint-config", value: "eslint-config" },
  { name: "typescript-config", value: "typescript-config" },
  { name: "root", value: "root" },
];

// Merge detected scopes with hardcoded ones, removing duplicates
function mergeScopes(detectedScopes, hardcodedScopes) {
  const scopeMap = new Map();

  // Add detected scopes first
  detectedScopes.forEach((scope) => {
    scopeMap.set(scope, { name: scope, value: scope });
  });

  // Add hardcoded scopes (won't overwrite existing keys)
  hardcodedScopes.forEach((scope) => {
    if (!scopeMap.has(scope.value)) {
      scopeMap.set(scope.value, scope);
    }
  });

  return Array.from(scopeMap.values());
}

const allScopes = mergeScopes(availableScopes, hardcodedScopes);

module.exports = {
  types: [
    { value: "feat", name: "feat:     ✨  A new feature" },
    { value: "fix", name: "fix:      🐛  A bug fix" },
    { value: "docs", name: "docs:     📝  Documentation only changes" },
    {
      value: "style",
      name: "style:    💄  Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)",
    },
    {
      value: "refactor",
      name: "refactor: ♻️   A code change that neither fixes a bug nor adds a feature",
    },
    {
      value: "perf",
      name: "perf:     ⚡️  A code change that improves performance",
    },
    {
      value: "test",
      name: "test:     ✅  Adding missing tests or correcting existing tests",
    },
    {
      value: "chore",
      name: "chore:    🔧  Changes to the build process or auxiliary tools and libraries such as documentation generation",
    },
    {
      value: "ci",
      name: "ci:       👷  Changes to our CI configuration files and scripts",
    },
    {
      value: "build",
      name: "build:    📦  Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
    },
    { value: "revert", name: "revert:   ⏪️  Reverts a previous commit" },
  ],

  scopes: allScopes,

  scopeOverrides: {
    feat: allScopes,
    fix: allScopes,
  },

  messages: {
    type: "Select the type of change that you're committing:",
    scope: "\nWhat is the scope of this change (e.g. component or file name):",
    // used if allowCustomScopes is true
    customScope: "Denote the custom scope:",
    subject: "Write a short, imperative tense description of the change:\n",
    body: "Provide a longer description of the change:\n",
    breaking: "List any BREAKING CHANGES (optional):\n",
    footer: "Issues this commit closes, e.g #123:",
    confirmCommit: "Are you sure you want to proceed with the commit above?",
  },

  allowCustomScopes: true,
  allowBreakingChanges: ["feat", "fix"],
  skipQuestions: ["body"],
  subjectLimit: 100,
};
