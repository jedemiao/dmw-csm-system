import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "./session-cookie";

export { SESSION_COOKIE_NAME };

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h absolute lifetime
const REFRESH_THRESHOLD_MS = 2 * 60 * 60 * 1000; // slide forward once under 2h remaining

// "Keep me signed in": same session mechanism, longer lifetime, so the admin
// isn't asked to sign in again every shift on their own device.
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d absolute lifetime
const REMEMBER_REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // slide forward once under 7d remaining

function ttlFor(rememberMe: boolean) {
  return rememberMe
    ? { ttlMs: REMEMBER_TTL_MS, refreshMs: REMEMBER_REFRESH_THRESHOLD_MS }
    : { ttlMs: SESSION_TTL_MS, refreshMs: REFRESH_THRESHOLD_MS };
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ipAddress?: string; rememberMe?: boolean },
) {
  const rememberMe = meta?.rememberMe ?? false;
  const expiresAt = new Date(Date.now() + ttlFor(rememberMe).ttlMs);
  const session = await prisma.session.create({
    data: { userId, expiresAt, userAgent: meta?.userAgent, ipAddress: meta?.ipAddress, rememberMe },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, session.id, cookieOptions(expiresAt));
}

export async function getSessionUser() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session) return null;

  if (session.expiresAt < new Date() || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const { ttlMs, refreshMs } = ttlFor(session.rememberMe);
  const remainingMs = session.expiresAt.getTime() - Date.now();
  if (remainingMs < refreshMs) {
    const newExpiresAt = new Date(Date.now() + ttlMs);
    await prisma.session.update({ where: { id: session.id }, data: { expiresAt: newExpiresAt } });
    try {
      store.set(SESSION_COOKIE_NAME, session.id, cookieOptions(newExpiresAt));
    } catch {
      // Cookies can only be mutated from a Server Action or Route Handler.
      // If we're rendering a Server Component, the DB row is already
      // refreshed; the cookie itself will catch up on the next mutable request.
    }
  }

  return session.user;
}

export async function destroySession() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE_NAME);
}
