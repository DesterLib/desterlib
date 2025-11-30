import path from "path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env file from project root
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
