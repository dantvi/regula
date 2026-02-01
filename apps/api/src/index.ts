import { loadConfig } from "@regula/config";
import { createLogger } from "@regula/observability";
import { Language } from "@regula/shared";
import { checkDbConnection } from "./db";
import http from "http";

const config = loadConfig();
const logger = createLogger();
const PORT = config.port;

// Verify imports work
const testLanguage: Language = "sv";
logger.info("API starting", { language: testLanguage, nodeEnv: config.nodeEnv });

const server = http.createServer(async (req, res) => {
  if (req.url === "/health" && req.method === "GET") {
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

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  logger.info(`API server listening on port ${PORT}`);
});
