export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

export function createLogger(): Logger {
  return {
    info: () => {},
    error: () => {},
    warn: () => {},
  };
}
