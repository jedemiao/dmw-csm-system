import { ChatCircleText, CalendarCheck, Star, ShieldCheck, ClipboardText } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/db";
import { CC1_LABELS } from "@/lib/constants/enum-labels";

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

export default async function AdminOverviewPage() {
  const [total, thisWeek, sqdAvg, cc1Groups, recent] = await Promise.all([
    prisma.surveyResponse.count(),
    prisma.surveyResponse.count({ where: { createdAt: { gte: startOfWeek() } } }),
    prisma.surveyResponse.aggregate({
      _avg: { sqd1: true, sqd2: true, sqd3: true, sqd4: true, sqd5: true, sqd6: true, sqd7: true, sqd8: true },
    }),
    prisma.surveyResponse.groupBy({ by: ["cc1"], _count: true }),
    prisma.surveyResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, region: true, service: true, customerType: true, createdAt: true },
    }),
  ]);

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

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Overview</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem" }}>
        Summary of Client Satisfaction Measurement responses collected so far.
      </p>

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
          <span className="stat-card__icon">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-card__label">Citizen&apos;s Charter awareness</p>
            <p className="stat-card__value">{awarenessRate !== null ? `${awarenessRate}%` : "—"}</p>
          </div>
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

        <div>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>CC1 awareness breakdown</h2>
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
      </div>
    </div>
  );
}
