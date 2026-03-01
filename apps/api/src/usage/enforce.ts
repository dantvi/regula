import { getDb } from "../db";
import { usagePeriods } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { loadConfig } from "@regula/config";

export type IncrementResult =
  | {
      ok: true;
      remainingRequests: number;
      limit: number;
      used: number;
      periodEnd: Date;
    }
  | {
      ok: false;
      reason: "quota_exceeded";
      limit: number;
      used: number;
      periodEnd: Date;
    };

export async function incrementRequestUsageOrFail(
  userId: string,
): Promise<IncrementResult> {
  const config = loadConfig();
  const db = getDb();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + config.quotaPeriodDays);

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(usagePeriods)
      .where(
        and(
          eq(usagePeriods.userId, userId),
          lte(usagePeriods.periodStart, now),
          gte(usagePeriods.periodEnd, now),
        ),
      )
      .limit(1)
      .for("update");

    let row: typeof usagePeriods.$inferSelect;
    if (existing.length > 0) {
      row = existing[0];
    } else {
      const [inserted] = await tx
        .insert(usagePeriods)
        .values({
          userId,
          periodStart: now,
          periodEnd,
          requestLimit: config.demoRequestLimit,
          requestsUsed: 0,
        })
        .returning();
      if (!inserted) throw new Error("Failed to create usage period");
      row = inserted;
    }

    const limit = row.requestLimit;
    const used = row.requestsUsed;
    const periodEndDate = row.periodEnd;

    if (used >= limit) {
      return {
        ok: false as const,
        reason: "quota_exceeded" as const,
        limit,
        used,
        periodEnd: periodEndDate,
      };
    }

    const [updated] = await tx
      .update(usagePeriods)
      .set({
        requestsUsed: used + 1,
        updatedAt: new Date(),
      })
      .where(eq(usagePeriods.id, row.id))
      .returning({ requestsUsed: usagePeriods.requestsUsed });

    if (!updated) throw new Error("Failed to increment usage");
    const newUsed = updated.requestsUsed;
    return {
      ok: true as const,
      remainingRequests: limit - newUsed,
      limit,
      used: newUsed,
      periodEnd: periodEndDate,
    };
  });

  return result;
}
