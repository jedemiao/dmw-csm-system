"use server";

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "./password";
import { createSession } from "./session";
import { REMEMBERED_USERNAME_COOKIE, rememberedUsernameCookieOptions } from "./remember-cookie";

// `success` rather than a server-side redirect(): React intercepts the submit
// on a server-action form, so the browser never sees a form submission followed
// by a navigation — which is exactly the signal Chrome and Edge use to offer
// "Save password?". The client turns this into a full page load instead, so the
// password manager notices the sign-in and can fill both fields next time.
export type LoginState = { error: string | null; success?: boolean };

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember") === "on";

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const genericError = { error: "Invalid username or password." };
  const lockedError = { error: "Too many failed attempts. Try again in 15 minutes." };

  const attempt = await prisma.loginAttempt.findUnique({ where: { username } });
  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    return lockedError;
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  const valid = user?.isActive ? await verifyPassword(password, user.passwordHash) : false;

  if (!valid) {
    const failedCount = (attempt?.failedCount ?? 0) + 1;
    const lockedUntil = failedCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await prisma.loginAttempt.upsert({
      where: { username },
      create: { username, failedCount, lockedUntil },
      update: { failedCount, lockedUntil },
    });
    return lockedUntil ? lockedError : genericError;
  }

  if (attempt) {
    await prisma.loginAttempt.delete({ where: { username } }).catch(() => {});
  }

  const headerStore = await headers();
  await createSession(user!.id, {
    userAgent: headerStore.get("user-agent") ?? undefined,
    ipAddress: headerStore.get("x-forwarded-for") ?? undefined,
    rememberMe,
  });

  const cookieStore = await cookies();
  if (rememberMe) {
    cookieStore.set(REMEMBERED_USERNAME_COOKIE, username, rememberedUsernameCookieOptions());
  } else {
    cookieStore.delete({ name: REMEMBERED_USERNAME_COOKIE, path: "/admin/login" });
  }

  return { error: null, success: true };
}
