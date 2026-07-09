import { ChatCircleText, CalendarCheck, Star, ShieldCheck, ClipboardText } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/db";
import { CC1_LABELS, CC2_LABELS, CC3_LABELS } from "@/lib/constants/enum-labels";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { getPeriodLabel, getPeriodRange, parseAnalyticsQuery } from "@/lib/reports/constants";
import { AnalyticsFilters } from "./analytics/analytics-filters";
import { BreakdownBarChart } from "./analytics/analytics-charts";

const SQD_FIELDS = ["sqd1", "sqd2", "sqd3", "sqd4", "sqd5", "sqd6", "sqd7", "sqd8"] as const;

// Order mirrors the CSM form's rating scale, most positive first, N/A last.
const RATING_CATEGORIES = [
  { value: 5, label: "Strongly Agree" },
  { value: 4, label: "Agree" },
  { value: 3, label: "Neither Agree nor Disagree" },
  { value: 2, label: "Disagree" },
  { value: 1, label: "Strongly Disagree" },
  { value: null, label: "N/A" },
] as const;

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diff);
  return monday;
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; year?: string; period?: string }>;
}) {
  const params = await searchParams;
  const { periodType, year, period } = parseAnalyticsQuery(params);
  const range = periodType === "ALL" ? null : getPeriodRange(periodType, year, period);
  const where = range ? { createdAt: { gte: range.start, lt: range.end } } : {};
  const scopeLabel = periodType === "ALL" ? "All time" : getPeriodLabel(periodType, year, period);

  const [total, thisWeek, sqdAvg, sqd0Avg, cc1Groups, cc2Groups, cc3Groups, recent, sqd0Groups, ...sqdGroups] =
    await Promise.all([
      prisma.surveyResponse.count({ where }),
      prisma.surveyResponse.count({ where: { createdAt: { gte: startOfWeek() } } }),
      prisma.surveyResponse.aggregate({
        where,
        _avg: { sqd1: true, sqd2: true, sqd3: true, sqd4: true, sqd5: true, sqd6: true, sqd7: true, sqd8: true },
      }),
      prisma.surveyResponse.aggregate({ where, _avg: { sqd0: true } }),
      prisma.surveyResponse.groupBy({ where, by: ["cc1"], _count: true }),
      prisma.surveyResponse.groupBy({ where, by: ["cc2"], _count: true }),
      prisma.surveyResponse.groupBy({ where, by: ["cc3"], _count: true }),
      prisma.surveyResponse.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, region: true, service: true, customerType: true, createdAt: true },
      }),
      prisma.surveyResponse.groupBy({ where, by: ["sqd0"], _count: true }),
      ...SQD_FIELDS.map((field) => prisma.surveyResponse.groupBy({ where, by: [field as "sqd1"], _count: true })),
    ]);

  const ratingBreakdown = RATING_CATEGORIES.map(({ value, label }) => {
    const count = SQD_FIELDS.reduce((sum, field, i) => {
      const groups = sqdGroups[i] as Array<{ [k: string]: unknown; _count: number }>;
      const match = groups.find((g) => g[field] === value);
      return sum + (match?._count ?? 0);
    }, 0);
    return { label, count };
  });

  const sqd0Breakdown = RATING_CATEGORIES.map(({ value, label }) => ({
    label,
    count: sqd0Groups.find((g) => g.sqd0 === value)?._count ?? 0,
  }));

  const avgValues = [
    sqdAvg._avg.sqd1,
    sqdAvg._avg.sqd2,
    sqdAvg._avg.sqd3,
    sqdAvg._avg.sqd4,
    sqdAvg._avg.sqd5,
    sqdAvg._avg.sqd6,
    sqdAvg._avg.sqd7,
    sqdAvg._avg.sqd8,
  ].filter((v): v is number => v !== null);
  const compositeAvg = avgValues.length > 0 ? avgValues.reduce((a, b) => a + b, 0) / avgValues.length : null;

  const awareCount = cc1Groups
    .filter((g) => g.cc1 === "AWARE_BEFORE" || g.cc1 === "AWARE_ON_SITE")
    .reduce((sum, g) => sum + g._count, 0);
  const awarenessRate = total > 0 ? Math.round((awareCount / total) * 100) : null;

  const cc1Breakdown = cc1Groups
    .map((g) => ({ label: CC1_LABELS[g.cc1] ?? g.cc1, count: g._count, pct: total > 0 ? Math.round((g._count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // CC2/CC3 are conditional follow-ups (asked only if the respondent saw/used the
  // Charter), so their percentages are of their own answered total, not all responses.
  const cc2Total = cc2Groups.filter((g) => g.cc2 !== null).reduce((sum, g) => sum + g._count, 0);
  const cc2Breakdown = cc2Groups
    .filter((g) => g.cc2 !== null)
    .map((g) => ({ label: CC2_LABELS[g.cc2!] ?? g.cc2!, count: g._count, pct: cc2Total > 0 ? Math.round((g._count / cc2Total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  const cc3Total = cc3Groups.filter((g) => g.cc3 !== null).reduce((sum, g) => sum + g._count, 0);
  const cc3Breakdown = cc3Groups
    .filter((g) => g.cc3 !== null)
    .map((g) => ({ label: CC3_LABELS[g.cc3!] ?? g.cc3!, count: g._count, pct: cc3Total > 0 ? Math.round((g._count / cc3Total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <AutoRefresh />
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Overview</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1rem" }}>
        Summary of Client Satisfaction Measurement responses collected so far.
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <AnalyticsFilters periodType={periodType} year={year} period={period} basePath="/admin" />
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginTop: "0.6rem" }}>
          {scopeLabel} — {total.toLocaleString()} response{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <span className="stat-card__icon">
            <ChatCircleText size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-card__label">Total responses</p>
            <p className="stat-card__value">{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon stat-card__icon--success">
            <CalendarCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-card__label">Responses this week</p>
            <p className="stat-card__value">{thisWeek.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon stat-card__icon--gold">
            <Star size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-card__label">Avg. SQD composite score</p>
            <p className="stat-card__value">
              {compositeAvg !== null ? compositeAvg.toFixed(2) : "—"} <span style={{ fontSize: "1rem", color: "var(--ink-400)", fontWeight: 600 }}>/ 5</span>
            </p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon stat-card__icon--gold">
            <Star size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-card__label">Avg. SQD0 (Overall satisfaction)</p>
            <p className="stat-card__value">
              {sqd0Avg._avg.sqd0 !== null ? sqd0Avg._avg.sqd0.toFixed(2) : "—"}{" "}
              <span style={{ fontSize: "1rem", color: "var(--ink-400)", fontWeight: 600 }}>/ 5</span>
            </p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-card__label">Citizen&apos;s Charter awareness</p>
            <p className="stat-card__value">{awarenessRate !== null ? `${awarenessRate}%` : "—"}</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>SQD0 rating breakdown</h2>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          Overall satisfaction ratings across responses in this period, by rating category.
        </p>
        <div className="stat-tile">
          {total === 0 ? (
            <p style={{ color: "var(--ink-400)", fontSize: "0.85rem" }}>No data yet.</p>
          ) : (
            <BreakdownBarChart data={sqd0Breakdown} />
          )}
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>SQD rating breakdown</h2>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          All SQD1-8 ratings across responses in this period, by rating category.
        </p>
        <div className="stat-tile">
          {total === 0 ? (
            <p style={{ color: "var(--ink-400)", fontSize: "0.85rem" }}>No data yet.</p>
          ) : (
            <BreakdownBarChart data={ratingBreakdown} />
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Recent responses</h2>
          <div className="activity-list">
            {recent.length === 0 && <p className="activity-empty">No responses yet.</p>}
            {recent.map((r) => (
              <div className="activity-item" key={r.id}>
                <span className="activity-item__icon">
                  <ClipboardText size={17} aria-hidden="true" />
                </span>
                <div className="activity-item__body">
                  <p className="activity-item__title">{r.service}</p>
                  <p className="activity-item__desc">
                    {r.region} · {r.customerType.charAt(0) + r.customerType.slice(1).toLowerCase()}
                  </p>
                </div>
                <span className="activity-item__time">{timeAgo(r.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>CC1: Awareness</h2>
            <div className="stat-tile">
              {cc1Breakdown.length === 0 && <p style={{ color: "var(--ink-400)", fontSize: "0.85rem" }}>No data yet.</p>}
              {cc1Breakdown.map((row) => (
                <div className="progress-row" key={row.label}>
                  <div className="progress-row__label">
                    <span>{row.label}</span>
                    <span>{row.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-track__fill" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>CC2: Saw the Charter</h2>
            <div className="stat-tile">
              {cc2Breakdown.length === 0 && <p style={{ color: "var(--ink-400)", fontSize: "0.85rem" }}>No data yet.</p>}
              {cc2Breakdown.map((row) => (
                <div className="progress-row" key={row.label}>
                  <div className="progress-row__label">
                    <span>{row.label}</span>
                    <span>{row.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-track__fill" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>CC3: Used the Charter</h2>
            <div className="stat-tile">
              {cc3Breakdown.length === 0 && <p style={{ color: "var(--ink-400)", fontSize: "0.85rem" }}>No data yet.</p>}
              {cc3Breakdown.map((row) => (
                <div className="progress-row" key={row.label}>
                  <div className="progress-row__label">
                    <span>{row.label}</span>
                    <span>{row.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-track__fill" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
