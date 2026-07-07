import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only administrators can reset data." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const [surveyResponses, reports, reportDownloads, submissionThrottles] = await Promise.all([
    prisma.surveyResponse.count(),
    prisma.report.count(),
    prisma.reportDownload.count(),
    prisma.submissionThrottle.count(),
  ]);
  const details = { surveyResponses, reports, reportDownloads, submissionThrottles };

  // Logged before the delete so a record of the attempt survives even if the
  // deletion below fails partway through.
  await prisma.auditLog.create({
    data: {
      action: "RESET_ALL_DATA",
      performedByUsername: user.username,
      performedByName: user.name,
      details,
    },
  });

  await prisma.$transaction([
    prisma.surveyResponse.deleteMany(),
    prisma.report.deleteMany(),
    prisma.reportDownload.deleteMany(),
    prisma.submissionThrottle.deleteMany(),
  ]);

  return NextResponse.json({ ok: true, deleted: details });
}
