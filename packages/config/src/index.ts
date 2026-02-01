export interface Config {
  port: number;
}

export function loadConfig(): Config {
  const isDev = process.env.NODE_ENV !== "production";

  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : isDev ? 3001 : 3000,
  };
}
