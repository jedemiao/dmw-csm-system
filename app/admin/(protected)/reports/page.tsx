import { getMonthlyAggregate } from "@/lib/reports/aggregate";
import { SERVICES } from "@/lib/constants/survey-options";
import { getReportMeta } from "./actions";
import { ReportForm } from "./report-form";
import type { ImprovementPlanRow, ServiceTransactionRow } from "./actions";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const [data, meta] = await Promise.all([getMonthlyAggregate(year, month), getReportMeta(year, month)]);

  const savedServiceTx = new Map(
    ((meta?.serviceTransactions as ServiceTransactionRow[] | undefined) ?? []).map((r) => [r.service, r.totalTransactions]),
  );
  const serviceTransactions: ServiceTransactionRow[] = SERVICES.filter((s) =>
    data.serviceCounts.some((r) => r.service === s),
  ).map((service) => ({
    service,
    totalTransactions: savedServiceTx.get(service) ?? data.serviceCounts.find((r) => r.service === service)!.responses,
  }));

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Monthly CSM Report</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem" }}>
        Fill in the fields that aren&apos;t captured by the survey, then download the print-ready ARTA CSM report.
      </p>

      <ReportForm
        year={year}
        month={month}
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
