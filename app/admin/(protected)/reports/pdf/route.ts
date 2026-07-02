import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin } from "@/lib/auth/dal";
import { getReportAggregate, getRolledUpServiceTransactions } from "@/lib/reports/aggregate";
import { CsmReportDocument } from "@/lib/reports/pdf-document";
import { getPeriodLabel, getPeriodSlug, parseReportQuery } from "@/lib/reports/constants";
import { prisma } from "@/lib/db";
import { SERVICES } from "@/lib/constants/survey-options";

export async function GET(req: Request) {
  const admin = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const { periodType, year, period } = parseReportQuery({
    type: searchParams.get("type") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    period: searchParams.get("period") ?? undefined,
  });

  try {
    const [data, meta, rolledUp] = await Promise.all([
      getReportAggregate(periodType, year, period),
      prisma.report.findUnique({ where: { periodType_year_period: { periodType, year, period } } }),
      periodType === "MONTH" ? Promise.resolve(null) : getRolledUpServiceTransactions(periodType, year, period),
    ]);

    const savedServiceTx = new Map(
      ((meta?.serviceTransactions as { service: string; totalTransactions: number }[] | undefined) ?? []).map(
        (r) => [r.service, r.totalTransactions],
      ),
    );
    const serviceTransactions = SERVICES.filter((s) => data.serviceCounts.some((r) => r.service === s)).map(
      (service) => ({
        service,
        totalTransactions:
          savedServiceTx.get(service) ??
          rolledUp?.find((r) => r.service === service)?.totalTransactions ??
          data.serviceCounts.find((r) => r.service === service)!.responses,
      }),
    );

    const improvementPlan = (meta?.improvementPlan as { details: string; when: string }[] | undefined) ?? [];

    const buffer = await renderToBuffer(
      CsmReportDocument({
        data,
        periodLabel: getPeriodLabel(periodType, year, period),
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

    const filename = `CSM-Report-${getPeriodSlug(periodType, year, period)}.pdf`;

    await prisma.reportDownload.create({
      data: {
        periodType,
        year,
        period,
        periodLabel: getPeriodLabel(periodType, year, period),
        filename,
        downloadedByName: admin.name,
      },
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Failed to generate CSM report PDF:", err);
    return new Response("Failed to generate report. Please try again.", { status: 500 });
  }
}
