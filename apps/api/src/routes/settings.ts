import type { ServerResponse } from "http";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Language } from "@regula/shared";
import { sendJson, sendError, parseJson } from "../utils/http";
import type { AuthRequest } from "../middleware/auth";
import { loadAuth } from "../middleware/auth";

interface PatchSettingsBody {
  preferred_language?: Language;
}

const VALID_LANGUAGES: Language[] = ["sv", "en"];

function userPayload(id: string, email: string, preferredLanguage: Language) {
  return { user: { id, email, preferred_language: preferredLanguage } };
}

export async function handlePatchSettings(
  req: AuthRequest,
  res: ServerResponse,
): Promise<void> {
  const ok = await loadAuth(req, res);
  if (!ok) return;

  let body: PatchSettingsBody;
  try {
    body = await parseJson<PatchSettingsBody>(req);
  } catch {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const preferredLanguage = body.preferred_language;
  if (
    preferredLanguage === undefined ||
    !VALID_LANGUAGES.includes(preferredLanguage)
  ) {
    sendError(res, 400, "validation.invalid_request");
    return;
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ preferredLanguage, updatedAt: new Date() })
    .where(eq(users.id, req.user!.id))
    .returning({
      id: users.id,
      email: users.email,
      preferredLanguage: users.preferredLanguage,
    });

  if (!updated) {
    sendError(res, 500, "system.internal");
    return;
  }

  sendJson(
    res,
    200,
    userPayload(
      updated.id,
      updated.email,
      updated.preferredLanguage as Language,
    ),
  );
}
