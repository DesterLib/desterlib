import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "src/generated/**",
        "src/__tests__/**",
        "**/*.config.{ts,js}",
        "**/*.d.ts",
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "dist", "src/generated"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
