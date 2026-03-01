import { loadConfig } from "@regula/config";
import { createLogger } from "@regula/observability";
import { Language } from "@regula/shared";
import { checkDbConnection } from "./db";
import { sendError } from "./utils/http";
import { setCookieOptions } from "./utils/cookie";
import * as authRoutes from "./routes/auth";
import * as settingsRoutes from "./routes/settings";
import * as usageRoutes from "./routes/usage";
import type { AuthRequest } from "./middleware/auth";
import http from "http";

const config = loadConfig();
setCookieOptions({ secure: config.nodeEnv === "production" });
const logger = createLogger();
const PORT = config.port;

const testLanguage: Language = "sv";
logger.info("API starting", {
  language: testLanguage,
  nodeEnv: config.nodeEnv,
});

function getPathname(url: string | undefined): string {
  if (!url) return "/";
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

const server = http.createServer(async (req, res) => {
  const path = getPathname(req.url);
  const method = req.method ?? "GET";

  if (path === "/health" && method === "GET") {
    let dbStatus: "up" | "down" = "down";
    try {
      const isConnected = await checkDbConnection();
      dbStatus = isConnected ? "up" : "down";
    } catch (error) {
      logger.error("Health check DB error", { error });
      dbStatus = "down";
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, db: dbStatus }));
    return;
  }

  if (path === "/auth/register" && method === "POST") {
    await authRoutes.handleRegister(req, res);
    return;
  }
  if (path === "/auth/login" && method === "POST") {
    await authRoutes.handleLogin(req, res);
    return;
  }
  if (path === "/auth/logout" && method === "POST") {
    await authRoutes.handleLogout(req as AuthRequest, res);
    return;
  }
  if (path === "/auth/me" && method === "GET") {
    await authRoutes.handleMe(req as AuthRequest, res);
    return;
  }
  if (path === "/settings" && method === "PATCH") {
    await settingsRoutes.handlePatchSettings(req as AuthRequest, res);
    return;
  }
  if (path === "/usage/me" && method === "GET") {
    await usageRoutes.handleGetUsageMe(req as AuthRequest, res);
    return;
  }

  sendError(res, 404, "system.not_found");
});

server.listen(PORT, () => {
  logger.info(`API server listening on port ${PORT}`);
});
