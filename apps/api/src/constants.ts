export const SESSION_COOKIE_NAME = "regula_session";
export const SESSION_EXPIRY_DAYS = 7;
export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
