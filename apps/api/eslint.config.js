import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    files: ["**/*.ts"],
    rules: {
      // API-specific overrides
      "no-console": "off", // Allow console.log in API
    },
  },
  {
    ignores: ["generated/**", "dist/**", "node_modules/**"],
  },
];
