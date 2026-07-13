"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, canAccessDivision } from "@/lib/auth/dal";
import { getDivisionLabel } from "@/lib/constants/divisions";

export type ReportDownloadRow = {
  id: string;
  periodLabel: string;
  divisionLabel: string;
  filename: string;
  downloadedByName: string;
  downloadedAt: string;
  href: string;
};

export async function getReportHistory(): Promise<ReportDownloadRow[]> {
  const user = await requireAdmin();
  const rows = await prisma.reportDownload.findMany({
    where: user.division ? { division: user.division } : {},
    orderBy: { downloadedAt: "desc" },
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    periodLabel: r.periodLabel,
    divisionLabel: getDivisionLabel(r.division),
    filename: r.filename,
    downloadedByName: r.downloadedByName,
    downloadedAt: r.downloadedAt.toISOString(),
    href: `/admin/reports/pdf?type=${r.periodType.toLowerCase()}&year=${r.year}&period=${r.period}&division=${r.division.toLowerCase()}`,
  }));
}

export async function deleteReportDownload(id: string) {
  const user = await requireAdmin();
  const row = await prisma.reportDownload.findUnique({ where: { id }, select: { division: true } });
  if (row && !canAccessDivision(user, row.division)) throw new Error("Forbidden: division mismatch.");
  await prisma.reportDownload.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/reports/history");
}

export async function clearReportHistory() {
  const user = await requireAdmin();
  await prisma.reportDownload.deleteMany({ where: user.division ? { division: user.division } : {} });
  revalidatePath("/admin/reports/history");
}
