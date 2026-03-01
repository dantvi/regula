import { getDb } from "../db";
import { usagePeriods } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { loadConfig } from "@regula/config";

export async function ensureCurrentUsagePeriod(userId: string): Promise<void> {
  const config = loadConfig();
  const db = getDb();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + config.quotaPeriodDays);

  const existing = await db
    .select()
    .from(usagePeriods)
    .where(
      and(
        eq(usagePeriods.userId, userId),
        lte(usagePeriods.periodStart, now),
        gte(usagePeriods.periodEnd, now),
      ),
    )
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(usagePeriods).values({
    userId,
    periodStart: now,
    periodEnd,
    requestLimit: config.demoRequestLimit,
    requestsUsed: 0,
  });
}
