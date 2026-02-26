import type { ServerResponse } from "http";
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "../constants";

let cookieSecure = false;

export function setCookieOptions(options: { secure: boolean }): void {
  cookieSecure = options.secure;
}

export function getCookieSecure(): boolean {
  return cookieSecure;
}

export function setSessionCookie(
  res: ServerResponse,
  sessionToken: string,
  options: { secure: boolean },
): void {
  const maxAgeSeconds = SESSION_EXPIRY_DAYS * 24 * 60 * 60;
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (options.secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res: ServerResponse): void {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  res.setHeader("Set-Cookie", parts.join("; "));
}
