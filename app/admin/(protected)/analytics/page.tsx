import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { CC1_LABELS, CC2_LABELS, CC3_LABELS, CUSTOMER_TYPE_LABELS } from "@/lib/constants/enum-labels";
import { SERVICES } from "@/lib/constants/survey-options";
import { getPeriodLabel, getPeriodRange, getPreviousPeriod, parseAnalyticsQuery } from "@/lib/reports/constants";
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

// Rating descriptors match the CSM form's 5-point scale (SD/D/N/A/SA) plus N/A, ordered
// most positive first. See lib/i18n/translations.ts scale_* keys for the exact wording.
const RATING_DESCRIPTORS = [
  { key: "c5", label: "Strongly Agree" },
  { key: "c4", label: "Agree" },
  { key: "c3", label: "Neither Agree nor Disagree" },
  { key: "c2", label: "Disagree" },
  { key: "c1", label: "Strongly Disagree" },
  { key: "cna", label: "N/A" },
] as const;

function pct(count: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((count / total) * 1000) / 10;
}

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

  const [
    totalResponses,
    sqdAvg,
    cc1Groups,
    cc2Groups,
    cc3Groups,
    regionGroups,
    serviceGroups,
    customerTypeGroups,
    volumeRows,
    serviceRatingRows,
    [descriptorRow],
  ] = await Promise.all([
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
    // Per-service satisfaction: agree/answered/scoreSum summed across all 8 SQD dimensions,
    // same "% Agree, N/A excluded" methodology as the official ARTA report (lib/reports/aggregate.ts).
    prisma.$queryRaw<Array<{ service: string; total: bigint; agree: bigint; answered: bigint; scoreSum: bigint }>>`
      SELECT
        service,
        COUNT(*)::bigint AS total,
        SUM(
          (CASE WHEN sqd1 IN (4,5) THEN 1 ELSE 0 END) + (CASE WHEN sqd2 IN (4,5) THEN 1 ELSE 0 END) +
          (CASE WHEN sqd3 IN (4,5) THEN 1 ELSE 0 END) + (CASE WHEN sqd4 IN (4,5) THEN 1 ELSE 0 END) +
          (CASE WHEN sqd5 IN (4,5) THEN 1 ELSE 0 END) + (CASE WHEN sqd6 IN (4,5) THEN 1 ELSE 0 END) +
          (CASE WHEN sqd7 IN (4,5) THEN 1 ELSE 0 END) + (CASE WHEN sqd8 IN (4,5) THEN 1 ELSE 0 END)
        )::bigint AS agree,
        SUM(
          (CASE WHEN sqd1 IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd2 IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN sqd3 IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd4 IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN sqd5 IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd6 IS NOT NULL THEN 1 ELSE 0 END) +
          (CASE WHEN sqd7 IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd8 IS NOT NULL THEN 1 ELSE 0 END)
        )::bigint AS answered,
        SUM(
          COALESCE(sqd1,0) + COALESCE(sqd2,0) + COALESCE(sqd3,0) + COALESCE(sqd4,0) +
          COALESCE(sqd5,0) + COALESCE(sqd6,0) + COALESCE(sqd7,0) + COALESCE(sqd8,0)
        )::bigint AS "scoreSum"
      FROM "SurveyResponse"
      ${dateFilter}
      GROUP BY service
      ORDER BY total DESC
    `,
    // Rating descriptor breakdown: every SQD1-8 answer in scope, bucketed by scale value (1-5, N/A).
    prisma.$queryRaw<Array<{ c5: bigint; c4: bigint; c3: bigint; c2: bigint; c1: bigint; cna: bigint }>>`
      SELECT
        SUM((CASE WHEN sqd1 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd2 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd3 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd4 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd5 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd6 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd7 = 5 THEN 1 ELSE 0 END) + (CASE WHEN sqd8 = 5 THEN 1 ELSE 0 END))::bigint AS c5,
        SUM((CASE WHEN sqd1 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd2 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd3 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd4 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd5 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd6 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd7 = 4 THEN 1 ELSE 0 END) + (CASE WHEN sqd8 = 4 THEN 1 ELSE 0 END))::bigint AS c4,
        SUM((CASE WHEN sqd1 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd2 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd3 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd4 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd5 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd6 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd7 = 3 THEN 1 ELSE 0 END) + (CASE WHEN sqd8 = 3 THEN 1 ELSE 0 END))::bigint AS c3,
        SUM((CASE WHEN sqd1 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd2 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd3 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd4 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd5 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd6 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd7 = 2 THEN 1 ELSE 0 END) + (CASE WHEN sqd8 = 2 THEN 1 ELSE 0 END))::bigint AS c2,
        SUM((CASE WHEN sqd1 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd2 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd3 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd4 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd5 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd6 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd7 = 1 THEN 1 ELSE 0 END) + (CASE WHEN sqd8 = 1 THEN 1 ELSE 0 END))::bigint AS c1,
        SUM((CASE WHEN sqd1 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd2 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd3 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd4 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd5 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd6 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd7 IS NULL THEN 1 ELSE 0 END) + (CASE WHEN sqd8 IS NULL THEN 1 ELSE 0 END))::bigint AS cna
      FROM "SurveyResponse"
      ${dateFilter}
    `,
  ]);

  // Period-over-period trend: only meaningful when a concrete period is selected ("All time"
  // has no prior period to compare against).
  const previousPeriod =
    periodType === "ALL"
      ? null
      : await (async () => {
          const prev = getPreviousPeriod(periodType, year, period);
          const prevRange = getPeriodRange(periodType, prev.year, prev.period);
          const prevAgg = await prisma.surveyResponse.aggregate({
            where: { createdAt: { gte: prevRange.start, lt: prevRange.end } },
            _count: true,
            _avg: { sqd1: true, sqd2: true, sqd3: true, sqd4: true, sqd5: true, sqd6: true, sqd7: true, sqd8: true },
          });
          const avgValues = SQD_DIMENSIONS.map(({ key }) => prevAgg._avg[key as keyof typeof prevAgg._avg]).filter(
            (v): v is number => v != null,
          );
          return {
            total: prevAgg._count,
            avg: avgValues.length > 0 ? avgValues.reduce((a, b) => a + b, 0) / avgValues.length : null,
            label: getPeriodLabel(periodType, prev.year, prev.period),
          };
        })();

  const scopeLabel = periodType === "ALL" ? "All time" : getPeriodLabel(periodType, year, period);

  const sqdDataRaw = SQD_DIMENSIONS.map(({ key, label }) => ({
    label,
    average: sqdAvg._avg[key as keyof typeof sqdAvg._avg],
  }));
  const sqdData = sqdDataRaw.map((d) => ({ dimension: d.label, average: d.average ?? 0 }));
  const dimsWithData = sqdDataRaw.filter((d) => d.average != null) as { label: string; average: number }[];
  const strongestDim = dimsWithData.length > 0 ? dimsWithData.reduce((a, b) => (b.average > a.average ? b : a)) : null;
  const weakestDim = dimsWithData.length > 0 ? dimsWithData.reduce((a, b) => (b.average < a.average ? b : a)) : null;
  const overallAvg = dimsWithData.length > 0 ? dimsWithData.reduce((sum, d) => sum + d.average, 0) / dimsWithData.length : null;

  const descriptorCounts = {
    c5: Number(descriptorRow?.c5 ?? 0),
    c4: Number(descriptorRow?.c4 ?? 0),
    c3: Number(descriptorRow?.c3 ?? 0),
    c2: Number(descriptorRow?.c2 ?? 0),
    c1: Number(descriptorRow?.c1 ?? 0),
    cna: Number(descriptorRow?.cna ?? 0),
  };
  const descriptorData = RATING_DESCRIPTORS.map(({ key, label }) => ({ label, count: descriptorCounts[key] }));
  const answeredCount = descriptorCounts.c5 + descriptorCounts.c4 + descriptorCounts.c3 + descriptorCounts.c2 + descriptorCounts.c1;
  const overallRatingPct = pct(descriptorCounts.c5 + descriptorCounts.c4, answeredCount);

  // Union of the official service catalog and any service names actually present in the
  // data (older responses may predate a catalog change) — every offered service gets a row,
  // even ones with zero responses so far, not just the ones a GROUP BY happens to return.
  const serviceRatingMap = new Map(
    serviceRatingRows.map((row) => {
      const total = Number(row.total);
      const agree = Number(row.agree);
      const answered = Number(row.answered);
      const scoreSum = Number(row.scoreSum);
      return [
        row.service,
        { service: row.service, total, ratingPct: pct(agree, answered), avgScore: answered > 0 ? scoreSum / answered : null },
      ] as const;
    }),
  );
  const knownServices = new Set<string>(SERVICES);
  const allServiceNames = [...SERVICES, ...[...serviceRatingMap.keys()].filter((s) => !knownServices.has(s))];
  const serviceRatings = allServiceNames
    .map((service) => serviceRatingMap.get(service) ?? { service, total: 0, ratingPct: null, avgScore: null })
    .sort((a, b) => (b.ratingPct ?? -1) - (a.ratingPct ?? -1));
  const ratedServices = serviceRatings.filter((s) => s.ratingPct !== null);
  const bestService = ratedServices[0] ?? null;
  const worstService = ratedServices.length > 0 ? ratedServices[ratedServices.length - 1] : null;

  const findings: string[] = [];
  if (totalResponses > 0) {
    if (overallRatingPct !== null && overallAvg !== null) {
      findings.push(
        `Overall satisfaction rating: ${overallRatingPct}% of all SQD ratings were "Agree" or "Strongly Agree" (${overallAvg.toFixed(2)} / 5 average across ${totalResponses.toLocaleString()} response${totalResponses === 1 ? "" : "s"}).`,
      );
    }
    if (strongestDim) {
      findings.push(`Strongest dimension: ${strongestDim.label} (${strongestDim.average.toFixed(2)} / 5).`);
    }
    if (weakestDim && (!strongestDim || weakestDim.label !== strongestDim.label)) {
      findings.push(`Area requiring the most improvement: ${weakestDim.label} (${weakestDim.average.toFixed(2)} / 5).`);
    }
    if (bestService && worstService && bestService.service !== worstService.service) {
      findings.push(
        `Highest-rated service: ${bestService.service} (${bestService.ratingPct}% positive, ${bestService.total} response${bestService.total === 1 ? "" : "s"}).`,
      );
      findings.push(
        `Lowest-rated service: ${worstService.service} (${worstService.ratingPct}% positive, ${worstService.total} response${worstService.total === 1 ? "" : "s"}).`,
      );
    }
    if (previousPeriod && previousPeriod.total > 0) {
      const volumeDelta = totalResponses - previousPeriod.total;
      const volumeDir = volumeDelta > 0 ? "up" : volumeDelta < 0 ? "down" : "unchanged";
      findings.push(
        `Response volume is ${volumeDir}${volumeDelta !== 0 ? ` from ${previousPeriod.total.toLocaleString()} to ${totalResponses.toLocaleString()}` : ""} compared to ${previousPeriod.label}.`,
      );
      if (previousPeriod.avg !== null && overallAvg !== null) {
        const ratingDelta = Math.round((overallAvg - previousPeriod.avg) * 100) / 100;
        const ratingDir = ratingDelta > 0.01 ? "improved" : ratingDelta < -0.01 ? "declined" : "held steady";
        findings.push(
          `Average rating has ${ratingDir}${Math.abs(ratingDelta) > 0.01 ? ` (${previousPeriod.avg.toFixed(2)} → ${overallAvg.toFixed(2)})` : ""} compared to ${previousPeriod.label}.`,
        );
      }
    }
  }

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
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>Satisfaction summary</h2>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          Overall satisfaction level and key findings — {scopeLabel}.
        </p>
        {totalResponses === 0 ? (
          <div className="stat-tile">
            <p style={{ color: "var(--ink-400)", fontSize: "0.85rem" }}>No data yet for this period.</p>
          </div>
        ) : (
          <div className="stat-grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <div className="stat-tile">
              <p className="stat-tile__label">Overall rating (Agree + Strongly Agree)</p>
              <p className="stat-tile__value">{overallRatingPct !== null ? `${overallRatingPct}%` : "—"}</p>
              <p style={{ color: "var(--ink-500)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                {overallAvg !== null ? `${overallAvg.toFixed(2)} / 5 average across all SQD dimensions` : "No dimension data"}
              </p>
              <div style={{ marginTop: "1rem" }}>
                <BreakdownBarChart data={descriptorData} />
              </div>
            </div>
            <div className="stat-tile">
              <p className="stat-tile__label" style={{ marginBottom: "0.6rem" }}>
                Key findings
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {findings.map((finding) => (
                  <li key={finding} style={{ fontSize: "0.85rem", color: "var(--ink-700)" }}>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
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

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>Satisfaction rating by service</h2>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          Share of SQD1-8 ratings that were &quot;Agree&quot; or &quot;Strongly Agree&quot;, per service (N/A ratings excluded).
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Responses</th>
                <th>Overall rating</th>
                <th>Avg score</th>
              </tr>
            </thead>
            <tbody>
              {serviceRatings.map((row) => (
                <tr
                  key={row.service}
                  className={
                    bestService && row.service === bestService.service
                      ? "data-table__row--highlighted"
                      : undefined
                  }
                >
                  <td>{row.service}</td>
                  <td>{row.total.toLocaleString()}</td>
                  <td>{row.ratingPct !== null ? `${row.ratingPct}%` : "—"}</td>
                  <td>{row.avgScore !== null ? `${row.avgScore.toFixed(2)} / 5` : "—"}</td>
                </tr>
              ))}
              {serviceRatings.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-400)", padding: "1.5rem" }}>
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
