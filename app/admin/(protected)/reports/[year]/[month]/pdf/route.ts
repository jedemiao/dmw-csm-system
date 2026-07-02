import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin } from "@/lib/auth/dal";
import { getMonthlyAggregate } from "@/lib/reports/aggregate";
import { MonthlyReportDocument } from "@/lib/reports/pdf-document";
import { MONTH_NAMES } from "@/lib/reports/constants";
import { prisma } from "@/lib/db";
import { SERVICES } from "@/lib/constants/survey-options";

export async function GET(_req: Request, { params }: { params: Promise<{ year: string; month: string }> }) {
  await requireAdmin();

  const { year: yearParam, month: monthParam } = await params;
  const year = Number(yearParam);
  const month = Number(monthParam);

  const [data, meta] = await Promise.all([
    getMonthlyAggregate(year, month),
    prisma.monthlyReport.findUnique({ where: { year_month: { year, month } } }),
  ]);

  const savedServiceTx = new Map(
    ((meta?.serviceTransactions as { service: string; totalTransactions: number }[] | undefined) ?? []).map((r) => [
      r.service,
      r.totalTransactions,
    ]),
  );
  const serviceTransactions = SERVICES.filter((s) => data.serviceCounts.some((r) => r.service === s)).map(
    (service) => ({
      service,
      totalTransactions: savedServiceTx.get(service) ?? data.serviceCounts.find((r) => r.service === service)!.responses,
    }),
  );

  const improvementPlan = (meta?.improvementPlan as { details: string; when: string }[] | undefined) ?? [];

  const buffer = await renderToBuffer(
    MonthlyReportDocument({
      data,
      serviceTransactions,
      improvementPlan,
      summaryAnalysis: meta?.summaryAnalysis ?? "",
      ccAnalysis: meta?.ccAnalysis ?? "",
      sqdAnalysis: meta?.sqdAnalysis ?? "",
      preparedByName: meta?.preparedByName ?? "",
      preparedByTitle: meta?.preparedByTitle ?? "",
      approvedByName: meta?.approvedByName ?? "",
      approvedByTitle: meta?.approvedByTitle ?? "",
    }),
  );

  const filename = `CSM-Report-${MONTH_NAMES[month - 1]}-${year}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
