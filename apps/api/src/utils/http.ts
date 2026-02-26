import type { ServerResponse } from "http";
import type { ErrorCode, ErrorResponse } from "@regula/shared";

export function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function sendError(
  res: ServerResponse,
  status: number,
  code: ErrorCode,
  params?: Record<string, unknown>,
): void {
  const body: ErrorResponse = { error: { code, ...(params && { params }) } };
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export async function parseJson<T = unknown>(
  stream: NodeJS.ReadableStream,
): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString("utf-8");
  if (!body.trim()) {
    return {} as T;
  }
  return JSON.parse(body) as T;
}
