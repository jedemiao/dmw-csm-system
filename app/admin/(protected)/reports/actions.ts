"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";

export type ServiceTransactionRow = { service: string; totalTransactions: number };
export type ImprovementPlanRow = { details: string; when: string };

export type ReportMetaInput = {
  year: number;
  month: number;
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

export async function getReportMeta(year: number, month: number) {
  await requireAdmin();
  return prisma.monthlyReport.findUnique({ where: { year_month: { year, month } } });
}

export async function saveReportMeta(input: ReportMetaInput) {
  await requireAdmin();
  const { year, month, ...data } = input;

  await prisma.monthlyReport.upsert({
    where: { year_month: { year, month } },
    create: { year, month, ...data },
    update: data,
  });

  revalidatePath("/admin/reports");
}
