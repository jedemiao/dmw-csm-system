import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { getSiteOrigin } from "@/lib/site-url";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await destroySession();
  const siteOrigin = await getSiteOrigin();
  return NextResponse.redirect(new URL("/admin/login", siteOrigin));
}
