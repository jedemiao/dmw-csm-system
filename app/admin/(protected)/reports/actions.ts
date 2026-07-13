"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, canAccessDivision } from "@/lib/auth/dal";
import type { Division } from "@/lib/constants/divisions";
import type { ReportPeriodType } from "@/lib/reports/constants";

export type ServiceTransactionRow = { service: string; totalTransactions: number };
export type ImprovementPlanRow = { recommendation: string; actionPlan: string; timeline: string };

export type ReportMetaInput = {
  periodType: ReportPeriodType;
  year: number;
  period: number;
  serviceTransactions: ServiceTransactionRow[];
  improvementPlan: ImprovementPlanRow[];
  summaryAnalysis: string;
  ccAnalysis: string;
  sqdAnalysis: string;
  actionPlanResults: string;
  csmRecommendations: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
};

export async function getReportMeta(periodType: ReportPeriodType, year: number, period: number, division: Division) {
  const user = await requireAdmin();
  if (!canAccessDivision(user, division)) throw new Error("Forbidden: division mismatch.");
  return prisma.report.findUnique({ where: { periodType_year_period_division: { periodType, year, period, division } } });
}

export async function saveReportMeta(input: ReportMetaInput & { division: Division }) {
  const user = await requireAdmin();
  const { periodType, year, period, division, ...data } = input;
  if (!canAccessDivision(user, division)) throw new Error("Forbidden: division mismatch.");

  await prisma.report.upsert({
    where: { periodType_year_period_division: { periodType, year, period, division } },
    create: { periodType, year, period, division, ...data },
    update: data,
  });

  revalidatePath("/admin/reports");
}
