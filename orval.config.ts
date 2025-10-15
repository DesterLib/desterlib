import { defineConfig } from "orval";

export default defineConfig({
  dester: {
    input: {
      target: "http://localhost:3000/api-docs.json",
    },
    output: {
      target: "./packages/api-client/src/generated/api.ts",
      client: "fetch",
      mode: "single",
      prettier: true,
      clean: true,
      override: {
        mutator: {
          path: "./packages/api-client/src/core/fetcher.ts",
          name: "customFetcher",
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
});
