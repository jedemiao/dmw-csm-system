import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { CC1_LABELS, CC2_LABELS, CC3_LABELS, CUSTOMER_TYPE_LABELS } from "@/lib/constants/enum-labels";
import { getPeriodLabel, getPeriodRange, parseAnalyticsQuery } from "@/lib/reports/constants";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { BreakdownBarChart, SqdBarChart, VolumeLineChart } from "./analytics-charts";
import { AnalyticsFilters } from "./analytics-filters";

const SQD_DIMENSIONS = [
  { key: "sqd1", label: "Responsiveness" },
  { key: "sqd2", label: "Reliability" },
  { key: "sqd3", label: "Access and Facilities" },
  { key: "sqd4", label: "Communication" },
  { key: "sqd5", label: "Costs" },
  { key: "sqd6", label: "Integrity" },
  { key: "sqd7", label: "Assurance" },
  { key: "sqd8", label: "Outcome" },
] as const;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; year?: string; period?: string }>;
}) {
  const params = await searchParams;
  const { periodType, year, period } = parseAnalyticsQuery(params);
  const range = periodType === "ALL" ? null : getPeriodRange(periodType, year, period);
  const where = range ? { createdAt: { gte: range.start, lt: range.end } } : {};
  const dateFilter = range ? Prisma.sql`WHERE "createdAt" >= ${range.start} AND "createdAt" < ${range.end}` : Prisma.empty;

  const [totalResponses, sqdAvg, cc1Groups, cc2Groups, cc3Groups, regionGroups, serviceGroups, customerTypeGroups, volumeRows] =
    await Promise.all([
      prisma.surveyResponse.count({ where }),
      prisma.surveyResponse.aggregate({
        where,
        _avg: { sqd1: true, sqd2: true, sqd3: true, sqd4: true, sqd5: true, sqd6: true, sqd7: true, sqd8: true },
      }),
      prisma.surveyResponse.groupBy({ where, by: ["cc1"], _count: true }),
      prisma.surveyResponse.groupBy({ where, by: ["cc2"], _count: true }),
      prisma.surveyResponse.groupBy({ where, by: ["cc3"], _count: true }),
      prisma.surveyResponse.groupBy({ where, by: ["region"], _count: true, orderBy: { _count: { region: "desc" } } }),
      prisma.surveyResponse.groupBy({ where, by: ["service"], _count: true, orderBy: { _count: { service: "desc" } } }),
      prisma.surveyResponse.groupBy({ where, by: ["customerType"], _count: true }),
      prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "SurveyResponse"
        ${dateFilter}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

  const scopeLabel = periodType === "ALL" ? "All time" : getPeriodLabel(periodType, year, period);

  const sqdData = SQD_DIMENSIONS.map(({ key, label }) => ({
    dimension: label,
    average: sqdAvg._avg[key as keyof typeof sqdAvg._avg] ?? 0,
  }));

  const volumeData = volumeRows.map((row) => ({
    date: row.day.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    count: Number(row.count),
  }));

  const regionData = regionGroups.map((g) => ({ label: g.region, count: g._count }));
  const serviceData = serviceGroups.map((g) => ({ label: g.service, count: g._count }));
  const customerTypeData = customerTypeGroups.map((g) => ({
    label: CUSTOMER_TYPE_LABELS[g.customerType] ?? g.customerType,
    count: g._count,
  }));
  const cc1Data = cc1Groups.map((g) => ({ label: CC1_LABELS[g.cc1] ?? g.cc1, count: g._count }));
  const cc2Data = cc2Groups
    .filter((g) => g.cc2 !== null)
    .map((g) => ({ label: CC2_LABELS[g.cc2 as string] ?? String(g.cc2), count: g._count }));
  const cc3Data = cc3Groups
    .filter((g) => g.cc3 !== null)
    .map((g) => ({ label: CC3_LABELS[g.cc3 as string] ?? String(g.cc3), count: g._count }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <AutoRefresh />
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Analytics</h1>
        <p style={{ color: "var(--ink-500)" }}>Aggregate scores computed from collected responses.</p>
      </div>

      <section>
        <AnalyticsFilters periodType={periodType} year={year} period={period} />
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginTop: "0.6rem" }}>
          {scopeLabel} — {totalResponses} response{totalResponses === 1 ? "" : "s"}
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Average SQD score by dimension</h2>
        <div className="stat-tile">
          <SqdBarChart data={sqdData} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Response volume over time</h2>
        <div className="stat-tile">
          <VolumeLineChart data={volumeData} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Citizen&apos;s Charter funnel</h2>
        <div className="stat-grid">
          <div className="stat-tile">
            <p className="stat-tile__label" style={{ marginBottom: "0.75rem" }}>
              CC1: Awareness
            </p>
            <BreakdownBarChart data={cc1Data} />
          </div>
          <div className="stat-tile">
            <p className="stat-tile__label" style={{ marginBottom: "0.75rem" }}>
              CC2: Saw the Charter
            </p>
            <BreakdownBarChart data={cc2Data} />
          </div>
          <div className="stat-tile">
            <p className="stat-tile__label" style={{ marginBottom: "0.75rem" }}>
              CC3: Used the Charter
            </p>
            <BreakdownBarChart data={cc3Data} />
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Breakdown by customer type</h2>
        <div className="stat-tile">
          <BreakdownBarChart data={customerTypeData} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Breakdown by region</h2>
        <div className="stat-tile">
          <BreakdownBarChart data={regionData} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Breakdown by service</h2>
        <div className="stat-tile">
          <BreakdownBarChart data={serviceData} />
        </div>
      </section>
    </div>
  );
}
