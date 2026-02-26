import type { IncomingMessage, ServerResponse } from "http";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { getDb } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Language } from "@regula/shared";
import {
  normalizeEmail,
  isValidEmailFormat,
  MIN_PASSWORD_LENGTH,
  SESSION_EXPIRY_DAYS,
} from "../constants";
import { sendJson, sendError, parseJson } from "../utils/http";
import {
  setSessionCookie,
  clearSessionCookie,
  getCookieSecure,
} from "../utils/cookie";
import {
  type AuthRequest,
  loadAuth,
  getSessionTokenFromCookie,
} from "../middleware/auth";

const SALT_ROUNDS = 10;

interface RegisterBody {
  email?: string;
  password?: string;
  preferred_language?: Language;
}

interface LoginBody {
  email?: string;
  password?: string;
}

function userPayload(id: string, email: string, preferredLanguage: Language) {
  return { user: { id, email, preferred_language: preferredLanguage } };
}

function createSession(userId: string): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  return { token, expiresAt };
}

export async function handleRegister(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let body: RegisterBody;
  try {
    body = await parseJson<RegisterBody>(req);
  } catch {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const email = body.email;
  const password = body.password;
  const preferredLanguage = body.preferred_language ?? "sv";

  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmailFormat(normalizedEmail)) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    sendError(res, 409, "auth.email_taken");
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [inserted] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      preferredLanguage,
      status: "active",
    })
    .returning({
      id: users.id,
      email: users.email,
      preferredLanguage: users.preferredLanguage,
    });

  if (!inserted) {
    sendError(res, 500, "system.internal");
    return;
  }

  const { token, expiresAt } = createSession(inserted.id);
  await db.insert(sessions).values({
    userId: inserted.id,
    sessionToken: token,
    expiresAt,
  });

  setSessionCookie(res, token, { secure: getCookieSecure() });
  sendJson(
    res,
    201,
    userPayload(
      inserted.id,
      inserted.email,
      inserted.preferredLanguage as Language,
    ),
  );
}

export async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let body: LoginBody;
  try {
    body = await parseJson<LoginBody>(req);
  } catch {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const email = body.email;
  const password = body.password;

  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const db = getDb();
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!userRow) {
    sendError(res, 401, "auth.invalid_credentials");
    return;
  }

  const match = await bcrypt.compare(password, userRow.passwordHash);
  if (!match) {
    sendError(res, 401, "auth.invalid_credentials");
    return;
  }

  if (userRow.status === "disabled") {
    sendError(res, 403, "auth.unauthorized", { reason: "disabled" });
    return;
  }

  const { token, expiresAt } = createSession(userRow.id);
  await db.insert(sessions).values({
    userId: userRow.id,
    sessionToken: token,
    expiresAt,
  });

  setSessionCookie(res, token, { secure: getCookieSecure() });
  sendJson(
    res,
    200,
    userPayload(
      userRow.id,
      userRow.email,
      userRow.preferredLanguage as Language,
    ),
  );
}

export async function handleLogout(
  req: AuthRequest,
  res: ServerResponse,
): Promise<void> {
  const ok = await loadAuth(req, res);
  if (!ok) return;

  const token = getSessionTokenFromCookie(req);
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
  }
  clearSessionCookie(res);
  sendJson(res, 200, { ok: true });
}

export async function handleMe(
  req: AuthRequest,
  res: ServerResponse,
): Promise<void> {
  const ok = await loadAuth(req, res);
  if (!ok) return;

  const u = req.user!;
  sendJson(res, 200, userPayload(u.id, u.email, u.preferredLanguage));
}
