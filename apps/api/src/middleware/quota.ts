import type { ServerResponse } from "http";
import { sendError } from "../utils/http";
import { incrementRequestUsageOrFail } from "../usage/enforce";
import type { AuthRequest } from "./auth";

export interface QuotaRequest extends AuthRequest {
  quota?: {
    remainingRequests: number;
    limit: number;
    used: number;
    periodEnd: Date;
  };
}

export async function requireQuota(
  req: QuotaRequest,
  res: ServerResponse,
): Promise<boolean> {
  if (!req.user) {
    sendError(res, 401, "auth.unauthorized");
    return false;
  }

  const result = await incrementRequestUsageOrFail(req.user.id);

  if (!result.ok) {
    sendError(res, 429, "quota.exceeded", {
      limit: result.limit,
      used: result.used,
      period_end: result.periodEnd.toISOString(),
    });
    return false;
  }

  req.quota = {
    remainingRequests: result.remainingRequests,
    limit: result.limit,
    used: result.used,
    periodEnd: result.periodEnd,
  };
  return true;
}
