import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "maximize_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sessionToken(code: string): string {
  return createHmac("sha256", code).update("maximize-admin-session").digest("hex");
}

export async function verifyAdminCode(code: string): Promise<boolean> {
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected || !code) return false;
  return code === expected;
}

export async function startAdminSession() {
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) return;
  const jar = await cookies();
  jar.set(COOKIE_NAME, sessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) return false;

  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const a = Buffer.from(value);
  const b = Buffer.from(sessionToken(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
