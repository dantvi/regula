import type { IncomingMessage, ServerResponse } from "http";
import type { AuthUser } from "@regula/shared";
import { getDb } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "../constants";
import { sendError } from "../utils/http";

export interface AuthRequest extends IncomingMessage {
  user?: AuthUser;
}

const COOKIE_REGEX = new RegExp(
  `${SESSION_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`,
);

export function getSessionTokenFromCookie(req: IncomingMessage): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(COOKIE_REGEX);
  return match ? decodeURIComponent(match[1].trim()) : null;
}

export async function loadAuth(
  req: AuthRequest,
  res: ServerResponse,
): Promise<boolean> {
  const token = getSessionTokenFromCookie(req);
  if (!token) {
    sendError(res, 401, "auth.unauthorized");
    return false;
  }

  const db = getDb();
  const now = new Date();
  const [sessionRow] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionToken, token))
    .limit(1);

  if (!sessionRow) {
    sendError(res, 401, "auth.unauthorized");
    return false;
  }

  if (sessionRow.expiresAt <= now) {
    sendError(res, 401, "auth.session_expired");
    return false;
  }

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      preferredLanguage: users.preferredLanguage,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, sessionRow.userId))
    .limit(1);

  if (!userRow) {
    sendError(res, 401, "auth.unauthorized");
    return false;
  }

  if (userRow.status === "disabled") {
    sendError(res, 403, "auth.unauthorized", { reason: "disabled" });
    return false;
  }

  req.user = {
    id: userRow.id,
    email: userRow.email,
    preferredLanguage: userRow.preferredLanguage as "sv" | "en",
    status: userRow.status as "active" | "disabled",
  };
  return true;
}
