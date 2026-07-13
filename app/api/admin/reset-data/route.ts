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

  // A division-scoped admin only wipes their own division's rows. Only an oversight
  // admin (division = null) can do a full wipe, including SubmissionThrottle rows —
  // those aren't division-taggable, so a scoped admin can't touch them at all.
  const divisionScope = user.division;
  const divisionWhere = divisionScope ? { division: divisionScope } : {};

  const [surveyResponses, reports, reportDownloads, submissionThrottles] = await Promise.all([
    prisma.surveyResponse.count({ where: divisionWhere }),
    prisma.report.count({ where: divisionWhere }),
    prisma.reportDownload.count({ where: divisionWhere }),
    divisionScope ? Promise.resolve(0) : prisma.submissionThrottle.count(),
  ]);
  const details = { division: divisionScope ?? "ALL", surveyResponses, reports, reportDownloads, submissionThrottles };

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
    prisma.surveyResponse.deleteMany({ where: divisionWhere }),
    prisma.report.deleteMany({ where: divisionWhere }),
    prisma.reportDownload.deleteMany({ where: divisionWhere }),
    ...(divisionScope ? [] : [prisma.submissionThrottle.deleteMany()]),
  ]);

  return NextResponse.json({ ok: true, deleted: details });
}
