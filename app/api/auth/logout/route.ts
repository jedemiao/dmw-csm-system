import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await destroySession();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
