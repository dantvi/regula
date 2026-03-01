import type { ServerResponse } from "http";
import { getDb } from "../db";
import { usagePeriods } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { sendJson, sendError, parseJson } from "../utils/http";
import type { AuthRequest } from "../middleware/auth";
import { loadAuth } from "../middleware/auth";
import { ensureCurrentUsagePeriod } from "../usage/period";
import { recordTokenUsageOrFail } from "../usage/enforce";

interface DebugAddTokensBody {
  inputTokens?: number;
  outputTokens?: number;
}

export async function handleGetUsageMe(
  req: AuthRequest,
  res: ServerResponse,
): Promise<void> {
  const ok = await loadAuth(req, res);
  if (!ok) return;

  const userId = req.user!.id;
  await ensureCurrentUsagePeriod(userId);

  const db = getDb();
  const now = new Date();

  const rows = await db
    .select({
      periodStart: usagePeriods.periodStart,
      periodEnd: usagePeriods.periodEnd,
      requestLimit: usagePeriods.requestLimit,
      requestsUsed: usagePeriods.requestsUsed,
      tokenLimit: usagePeriods.tokenLimit,
      tokensUsed: usagePeriods.tokensUsed,
    })
    .from(usagePeriods)
    .where(
      and(
        eq(usagePeriods.userId, userId),
        lte(usagePeriods.periodStart, now),
        gte(usagePeriods.periodEnd, now),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    sendError(res, 500, "system.internal");
    return;
  }

  const row = rows[0];
  const remainingRequests = Math.max(0, row.requestLimit - row.requestsUsed);
  const remainingTokens = Math.max(0, row.tokenLimit - row.tokensUsed);
  sendJson(res, 200, {
    period_start: row.periodStart.toISOString(),
    period_end: row.periodEnd.toISOString(),
    request_limit: row.requestLimit,
    requests_used: row.requestsUsed,
    remaining_requests: remainingRequests,
    token_limit: row.tokenLimit,
    tokens_used: row.tokensUsed,
    remaining_tokens: remainingTokens,
  });
}

export async function handleDebugAddTokens(
  req: AuthRequest,
  res: ServerResponse,
): Promise<void> {
  const ok = await loadAuth(req, res);
  if (!ok) return;

  let body: DebugAddTokensBody;
  try {
    body = await parseJson<DebugAddTokensBody>(req);
  } catch {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const inputTokens =
    typeof body.inputTokens === "number" ? body.inputTokens : 0;
  const outputTokens =
    typeof body.outputTokens === "number" ? body.outputTokens : 0;
  if (inputTokens < 0 || outputTokens < 0) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }
  if (inputTokens + outputTokens === 0) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const result = await recordTokenUsageOrFail(req.user!.id, {
    inputTokens,
    outputTokens,
  });

  if (!result.ok) {
    sendError(res, 429, "quota.exceeded", {
      resource: result.resource,
      limit: result.limit,
      used: result.used,
      period_end: result.periodEnd.toISOString(),
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    token_limit: result.limit,
    tokens_used: result.used,
    remaining_tokens: result.remainingTokens,
    period_end: result.periodEnd.toISOString(),
  });
}
