import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin, resolveDivisionFilter } from "@/lib/auth/dal";
import { getReportAggregate, getRolledUpServiceTransactions } from "@/lib/reports/aggregate";
import { CsmReportDocument } from "@/lib/reports/pdf-document";
import { getPeriodLabel, getPeriodSlug, parseReportQuery, DIVISION_REPORT_NAMES } from "@/lib/reports/constants";
import { prisma } from "@/lib/db";
import { DIVISIONS, getFlatServices } from "@/lib/constants/divisions";

export async function GET(req: Request) {
  const admin = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const { periodType, year, period } = parseReportQuery({
    type: searchParams.get("type") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    period: searchParams.get("period") ?? undefined,
  });
  // resolveDivisionFilter forces a scoped admin's own division regardless of what's
  // requested, so this query param can't be used to download another division's report.
  const division = resolveDivisionFilter(admin, searchParams.get("division") ?? undefined) ?? DIVISIONS[0].value;
  const services = getFlatServices(division);

  try {
    const [data, meta, rolledUp] = await Promise.all([
      getReportAggregate(periodType, year, period, division),
      prisma.report.findUnique({ where: { periodType_year_period_division: { periodType, year, period, division } } }),
      periodType === "MONTH" ? Promise.resolve(null) : getRolledUpServiceTransactions(periodType, year, period, division),
    ]);

    const savedServiceTx = new Map(
      ((meta?.serviceTransactions as { service: string; totalTransactions: number }[] | undefined) ?? []).map(
        (r) => [r.service, r.totalTransactions],
      ),
    );
    const serviceTransactions = services.map((service) => ({
      service,
      totalTransactions:
        savedServiceTx.get(service) ??
        rolledUp?.find((r) => r.service === service)?.totalTransactions ??
        data.serviceCounts.find((r) => r.service === service)?.responses ??
        0,
    }));

    const improvementPlan =
      (meta?.improvementPlan as { recommendation: string; actionPlan: string; timeline: string }[] | undefined) ?? [];

    const buffer = await renderToBuffer(
      CsmReportDocument({
        data,
        periodLabel: getPeriodLabel(periodType, year, period),
        divisionLabel: DIVISION_REPORT_NAMES[division],
        serviceTransactions,
        improvementPlan,
        summaryAnalysis: meta?.summaryAnalysis ?? "",
        ccAnalysis: meta?.ccAnalysis ?? "",
        sqdAnalysis: meta?.sqdAnalysis ?? "",
        actionPlanResults: meta?.actionPlanResults ?? "",
        csmRecommendations: meta?.csmRecommendations ?? "",
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
        division,
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
