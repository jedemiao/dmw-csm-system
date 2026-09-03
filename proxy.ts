import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

// Coarse gate only: the Edge runtime can't safely run Prisma, so this just
// checks that a session cookie is present. The real check (session exists,
// isn't expired, user is active) lives in lib/auth/dal.ts's requireAdmin(),
// called from every admin Server Component and Server Action.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) {
    // Someone who still holds a session doesn't need the form — send them
    // through, so a bookmark to the login page never asks them to type again.
    //
    // Two constraints shape this. It checks the method because the login
    // Server Action POSTs to this same path (without a session cookie, since
    // the cookie is only set in its response) and must not be redirected. And
    // it lives here rather than in the page's render because a redirect during
    // that render is applied to the Action's response as a client-side
    // navigation, which changes how sign-in completes.
    //
    // ?expired is requireAdmin's marker for a cookie whose session is gone
    // server-side (revoked, or the account deactivated). Without honouring it,
    // that cookie would bounce /admin -> /admin/login -> /admin forever.
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const isExpiredBounce = request.nextUrl.searchParams.has("expired");
    if (request.method === "GET" && hasSession && !isExpiredBounce) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!hasSessionCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
