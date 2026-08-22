import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const rootEnv = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env",
);
if (existsSync(rootEnv) && !process.env.DATABASE_URL) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://groxbot:groxbot@127.0.0.1:5433/groxbot",
  },
});
