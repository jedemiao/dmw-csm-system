import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";

// Temporary one-off endpoint: production's ReportPeriodType enum is missing the
// SEMESTER value because migration 20260706050646_add_semester_report_period never
// ran against prod. Visit this route once while logged in as admin, then delete it.
export async function GET() {
  await requireAdmin();
  await prisma.$executeRawUnsafe(`ALTER TYPE "ReportPeriodType" ADD VALUE IF NOT EXISTS 'SEMESTER'`);
  return NextResponse.json({ ok: true, message: "SEMESTER enum value added (or already present)." });
}
