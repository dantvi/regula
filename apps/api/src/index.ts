import { loadConfig } from "@regula/config";
import { createLogger } from "@regula/observability";
import { Language } from "@regula/shared";
import http from "http";

const config = loadConfig();
const logger = createLogger();
const PORT = config.port;

// Verify imports work
const testLanguage: Language = "sv";
logger.info("API starting", { language: testLanguage });

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  logger.info(`API server listening on port ${PORT}`);
});
