"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";

export type ReportDownloadRow = {
  id: string;
  periodLabel: string;
  filename: string;
  downloadedByName: string;
  downloadedAt: string;
  href: string;
};

export async function getReportHistory(): Promise<ReportDownloadRow[]> {
  await requireAdmin();
  const rows = await prisma.reportDownload.findMany({ orderBy: { downloadedAt: "desc" }, take: 200 });

  return rows.map((r) => ({
    id: r.id,
    periodLabel: r.periodLabel,
    filename: r.filename,
    downloadedByName: r.downloadedByName,
    downloadedAt: r.downloadedAt.toISOString(),
    href: `/admin/reports/pdf?type=${r.periodType.toLowerCase()}&year=${r.year}&period=${r.period}`,
  }));
}

export async function deleteReportDownload(id: string) {
  await requireAdmin();
  await prisma.reportDownload.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/reports/history");
}

export async function clearReportHistory() {
  await requireAdmin();
  await prisma.reportDownload.deleteMany({});
  revalidatePath("/admin/reports/history");
}
