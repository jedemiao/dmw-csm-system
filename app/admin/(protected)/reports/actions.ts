"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import type { ReportPeriodType } from "@/lib/reports/constants";

export type ServiceTransactionRow = { service: string; totalTransactions: number };
export type ImprovementPlanRow = { details: string; when: string };

export type ReportMetaInput = {
  periodType: ReportPeriodType;
  year: number;
  period: number;
  serviceTransactions: ServiceTransactionRow[];
  improvementPlan: ImprovementPlanRow[];
  summaryAnalysis: string;
  ccAnalysis: string;
  sqdAnalysis: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
};

export async function getReportMeta(periodType: ReportPeriodType, year: number, period: number) {
  await requireAdmin();
  return prisma.report.findUnique({ where: { periodType_year_period: { periodType, year, period } } });
}

export async function saveReportMeta(input: ReportMetaInput) {
  await requireAdmin();
  const { periodType, year, period, ...data } = input;

  await prisma.report.upsert({
    where: { periodType_year_period: { periodType, year, period } },
    create: { periodType, year, period, ...data },
    update: data,
  });

  revalidatePath("/admin/reports");
}
