"use client";

import { useRouter } from "next/navigation";
import { MONTH_NAMES, QUARTER_LABELS, SEMESTER_LABELS, type AnalyticsPeriodType } from "@/lib/reports/constants";

const RANGE_LABELS: Record<AnalyticsPeriodType, string> = {
  ALL: "All time",
  MONTH: "Month",
  QUARTER: "Quarter",
  SEMESTER: "Semester",
  YEAR: "Year",
};

export function AnalyticsFilters({
  periodType,
  year,
  period,
}: {
  periodType: AnalyticsPeriodType;
  year: number;
  period: number;
}) {
  const router = useRouter();

  function navigate(nextType: AnalyticsPeriodType, nextYear: number, nextPeriod: number) {
    if (nextType === "ALL") {
      router.push("/admin/analytics");
      return;
    }
    router.push(`/admin/analytics?range=${nextType.toLowerCase()}&year=${nextYear}&period=${nextPeriod}`);
  }

  function changeType(nextType: AnalyticsPeriodType) {
    if (nextType === periodType) return;
    const now = new Date();
    const defaultPeriod =
      nextType === "MONTH"
        ? now.getMonth() + 1
        : nextType === "QUARTER"
          ? Math.floor(now.getMonth() / 3) + 1
          : nextType === "SEMESTER"
            ? Math.floor(now.getMonth() / 6) + 1
            : 0;
    navigate(nextType, year, defaultPeriod);
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="analytics-range">Range</label>
        <select id="analytics-range" value={periodType} onChange={(e) => changeType(e.target.value as AnalyticsPeriodType)}>
          {(Object.keys(RANGE_LABELS) as AnalyticsPeriodType[]).map((type) => (
            <option key={type} value={type}>
              {RANGE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      {periodType === "MONTH" && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="analytics-month">Month</label>
          <select id="analytics-month" value={period} onChange={(e) => navigate(periodType, year, Number(e.target.value))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      {periodType === "QUARTER" && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="analytics-quarter">Quarter</label>
          <select id="analytics-quarter" value={period} onChange={(e) => navigate(periodType, year, Number(e.target.value))}>
            {QUARTER_LABELS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      {periodType === "SEMESTER" && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="analytics-semester">Semester</label>
          <select id="analytics-semester" value={period} onChange={(e) => navigate(periodType, year, Number(e.target.value))}>
            {SEMESTER_LABELS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      {periodType !== "ALL" && (
        <div className="field" style={{ marginBottom: 0, maxWidth: "8rem" }}>
          <label htmlFor="analytics-year">Year</label>
          <input
            id="analytics-year"
            type="number"
            value={year}
            onChange={(e) => navigate(periodType, Number(e.target.value) || year, period)}
          />
        </div>
      )}
    </div>
  );
}
