import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const envFile = process.env.ENV_FILE ?? resolve(__dirname, "../../../.env");
dotenvConfig({ path: envFile });

export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  quotaPeriodDays: number;
  demoRequestLimit: number;
}

export function loadConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isDev = nodeEnv !== "production";

  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : isDev
      ? 3001
      : 3000;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Set it in your .env file or environment variables.",
    );
  }

  const quotaPeriodDays = process.env.QUOTA_PERIOD_DAYS
    ? parseInt(process.env.QUOTA_PERIOD_DAYS, 10)
    : 30;
  const demoRequestLimit = process.env.DEMO_REQUEST_LIMIT
    ? parseInt(process.env.DEMO_REQUEST_LIMIT, 10)
    : 200;

  return {
    nodeEnv,
    port,
    databaseUrl,
    quotaPeriodDays,
    demoRequestLimit,
  };
}
