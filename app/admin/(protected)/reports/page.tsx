import Link from "next/link";
import { ClockCounterClockwise } from "@phosphor-icons/react/ssr";
import { getReportAggregate, getRolledUpServiceTransactions } from "@/lib/reports/aggregate";
import { SERVICES } from "@/lib/constants/survey-options";
import { getReportMeta } from "./actions";
import { ReportForm } from "./report-form";
import type { ImprovementPlanRow, ServiceTransactionRow } from "./actions";
import { parseReportQuery, type ReportPeriodType } from "@/lib/reports/constants";

const REPORT_TITLES: Record<ReportPeriodType, string> = {
  MONTH: "Monthly CSM Report",
  QUARTER: "Quarterly CSM Report",
  YEAR: "Annual CSM Report",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; year?: string; period?: string }>;
}) {
  const params = await searchParams;
  const { periodType, year, period } = parseReportQuery(params);

  const [data, meta, rolledUp] = await Promise.all([
    getReportAggregate(periodType, year, period),
    getReportMeta(periodType, year, period),
    periodType === "MONTH" ? Promise.resolve(null) : getRolledUpServiceTransactions(periodType, year, period),
  ]);

  const savedServiceTx = new Map(
    ((meta?.serviceTransactions as ServiceTransactionRow[] | undefined) ?? []).map((r) => [r.service, r.totalTransactions]),
  );
  const serviceTransactions: ServiceTransactionRow[] = SERVICES.filter((s) =>
    data.serviceCounts.some((r) => r.service === s),
  ).map((service) => ({
    service,
    totalTransactions:
      savedServiceTx.get(service) ??
      rolledUp?.find((r) => r.service === service)?.totalTransactions ??
      data.serviceCounts.find((r) => r.service === service)!.responses,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{REPORT_TITLES[periodType]}</h1>
          <p style={{ color: "var(--ink-500)" }}>
            Fill in the fields that aren&apos;t captured by the survey, then download the print-ready ARTA CSM report.
          </p>
        </div>
        <Link href="/admin/reports/history" className="btn btn-secondary" style={{ flexShrink: 0 }}>
          <ClockCounterClockwise size={16} /> Download history
        </Link>
      </div>

      <ReportForm
        key={`${periodType}-${year}-${period}`}
        periodType={periodType}
        year={year}
        period={period}
        totalResponses={data.totalResponses}
        serviceTransactions={serviceTransactions}
        improvementPlan={(meta?.improvementPlan as ImprovementPlanRow[] | undefined) ?? []}
        summaryAnalysis={meta?.summaryAnalysis ?? ""}
        ccAnalysis={meta?.ccAnalysis ?? ""}
        sqdAnalysis={meta?.sqdAnalysis ?? ""}
        preparedByName={meta?.preparedByName ?? ""}
        preparedByTitle={meta?.preparedByTitle ?? ""}
        approvedByName={meta?.approvedByName ?? ""}
        approvedByTitle={meta?.approvedByTitle ?? ""}
      />
    </div>
  );
}
