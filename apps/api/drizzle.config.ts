import { defineConfig } from "drizzle-kit";
import { loadConfig } from "@regula/config";

const config = loadConfig();

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: config.databaseUrl,
  },
  verbose: true,
  strict: true,
});
