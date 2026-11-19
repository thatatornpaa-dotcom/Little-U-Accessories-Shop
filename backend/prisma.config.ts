import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env relative to this config file
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "bun ./prisma/seed.js",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
