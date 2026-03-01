import type { ServerResponse } from "http";
import { getDb } from "../db";
import { usagePeriods } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { sendJson, sendError } from "../utils/http";
import type { AuthRequest } from "../middleware/auth";
import { loadAuth } from "../middleware/auth";
import { ensureCurrentUsagePeriod } from "../usage/period";

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
  const remaining = Math.max(0, row.requestLimit - row.requestsUsed);
  sendJson(res, 200, {
    period_start: row.periodStart.toISOString(),
    period_end: row.periodEnd.toISOString(),
    request_limit: row.requestLimit,
    requests_used: row.requestsUsed,
    remaining_requests: remaining,
  });
}
