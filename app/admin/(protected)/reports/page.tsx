import Link from "next/link";
import { ClockCounterClockwise } from "@phosphor-icons/react/ssr";
import { getReportAggregate, getRolledUpServiceTransactions } from "@/lib/reports/aggregate";
import { DIVISIONS, getFlatServices } from "@/lib/constants/divisions";
import { requireAdmin, resolveDivisionFilter } from "@/lib/auth/dal";
import { getReportMeta } from "./actions";
import { ReportForm } from "./report-form";
import type { ImprovementPlanRow, ServiceTransactionRow } from "./actions";
import { parseReportQuery, type ReportPeriodType } from "@/lib/reports/constants";

const REPORT_TITLES: Record<ReportPeriodType, string> = {
  MONTH: "Monthly CSM Report",
  QUARTER: "Quarterly CSM Report",
  SEMESTER: "Semestral CSM Report",
  YEAR: "Annual CSM Report",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; year?: string; period?: string; division?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const { periodType, year, period } = parseReportQuery(params);
  const isOversight = user.division === null;
  const division = resolveDivisionFilter(user, params.division) ?? DIVISIONS[0].value;

  const [data, meta, rolledUp] = await Promise.all([
    getReportAggregate(periodType, year, period, division),
    getReportMeta(periodType, year, period, division),
    periodType === "MONTH" ? Promise.resolve(null) : getRolledUpServiceTransactions(periodType, year, period, division),
  ]);

  // Lists every defined service, not just ones with responses this period — the report
  // template expects zero-client services to show explicitly (see its "Zero-Client Service" note)
  // rather than being silently omitted.
  //
  // WRSD is the one exception: its service catalog is large enough (four "type of
  // service" tabs, some with their own sub-catalogs) that most periods would otherwise
  // print a mostly-empty table, so its report only lists services with at least one
  // response this period. Every other division keeps the full zero-client listing above.
  const respondedServices = new Set(data.serviceCounts.map((r) => r.service));
  const services =
    division === "WRSD" ? getFlatServices(division).filter((s) => respondedServices.has(s)) : getFlatServices(division);

  const savedServiceTx = new Map(
    ((meta?.serviceTransactions as ServiceTransactionRow[] | undefined) ?? []).map((r) => [r.service, r.totalTransactions]),
  );
  // "Auto" is the live-computed default (rolled-up figure, else survey response count) —
  // kept separate from the saved value so the form can tell "still following the live
  // total" apart from "staff typed in a different number." Only rows that actually
  // diverge from auto get persisted on save (see report-form.tsx), so an unedited field
  // keeps tracking live data indefinitely instead of freezing at whatever it was on first save.
  const autoServiceTransactions: ServiceTransactionRow[] = services.map((service) => ({
    service,
    totalTransactions:
      rolledUp?.find((r) => r.service === service)?.totalTransactions ??
      data.serviceCounts.find((r) => r.service === service)?.responses ??
      0,
  }));
  const serviceTransactions: ServiceTransactionRow[] = autoServiceTransactions.map((row) => ({
    service: row.service,
    totalTransactions: savedServiceTx.get(row.service) ?? row.totalTransactions,
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
        key={`${periodType}-${year}-${period}-${division}`}
        periodType={periodType}
        year={year}
        period={period}
        division={division}
        divisions={isOversight ? DIVISIONS : undefined}
        totalResponses={data.totalResponses}
        serviceTransactions={serviceTransactions}
        autoServiceTransactions={autoServiceTransactions}
        improvementPlan={(meta?.improvementPlan as ImprovementPlanRow[] | undefined) ?? []}
        summaryAnalysis={meta?.summaryAnalysis ?? ""}
        ccAnalysis={meta?.ccAnalysis ?? ""}
        sqdAnalysis={meta?.sqdAnalysis ?? ""}
        actionPlanResults={meta?.actionPlanResults ?? ""}
        csmRecommendations={meta?.csmRecommendations ?? ""}
        preparedByName={meta?.preparedByName ?? ""}
        preparedByTitle={meta?.preparedByTitle ?? ""}
        approvedByName={meta?.approvedByName ?? ""}
        approvedByTitle={meta?.approvedByTitle ?? ""}
      />
    </div>
  );
}
