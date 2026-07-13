"use client";

import { useRouter } from "next/navigation";
import {
  MONTH_NAMES,
  QUARTER_LABELS,
  SEMESTER_LABELS,
  getWeekNumberForDate,
  getWeekRangeLabel,
  getWeeksInYear,
  type AnalyticsPeriodType,
} from "@/lib/reports/constants";
import type { DivisionMeta } from "@/lib/constants/divisions";

const RANGE_LABELS: Record<AnalyticsPeriodType, string> = {
  ALL: "All time",
  WEEK: "Week",
  MONTH: "Month",
  QUARTER: "Quarter",
  SEMESTER: "Semester",
  YEAR: "Year",
};

export function AnalyticsFilters({
  periodType,
  year,
  period,
  division = "",
  divisions,
  basePath = "/admin/analytics",
}: {
  periodType: AnalyticsPeriodType;
  year: number;
  period: number;
  division?: string;
  divisions?: readonly DivisionMeta[];
  basePath?: string;
}) {
  const router = useRouter();

  function buildUrl(nextType: AnalyticsPeriodType, nextYear: number, nextPeriod: number, nextDivision: string) {
    const qs = new URLSearchParams();
    if (nextType !== "ALL") {
      qs.set("range", nextType.toLowerCase());
      qs.set("year", String(nextYear));
      qs.set("period", String(nextPeriod));
    }
    if (nextDivision) qs.set("division", nextDivision);
    const qsStr = qs.toString();
    return qsStr ? `${basePath}?${qsStr}` : basePath;
  }

  function navigate(nextType: AnalyticsPeriodType, nextYear: number, nextPeriod: number) {
    router.push(buildUrl(nextType, nextYear, nextPeriod, division));
  }

  function navigateDivision(nextDivision: string) {
    router.push(buildUrl(periodType, year, period, nextDivision));
  }

  function changeType(nextType: AnalyticsPeriodType) {
    if (nextType === periodType) return;
    const now = new Date();
    if (nextType === "WEEK") {
      const current = getWeekNumberForDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
      navigate(nextType, current.year, current.week);
      return;
    }
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
      {divisions && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="analytics-division">Division</label>
          <select id="analytics-division" value={division} onChange={(e) => navigateDivision(e.target.value)}>
            <option value="">All divisions</option>
            {divisions.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}
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
      {periodType === "WEEK" && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="analytics-week">Week</label>
          <select id="analytics-week" value={period} onChange={(e) => navigate(periodType, year, Number(e.target.value))}>
            {Array.from({ length: getWeeksInYear(year) }, (_, i) => i + 1).map((week) => (
              <option key={week} value={week}>
                Week {week} ({getWeekRangeLabel(year, week)})
              </option>
            ))}
          </select>
        </div>
      )}
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
            onChange={(e) => {
              const nextYear = Number(e.target.value) || year;
              const nextPeriod = periodType === "WEEK" ? Math.min(period, getWeeksInYear(nextYear)) : period;
              navigate(periodType, nextYear, nextPeriod);
            }}
          />
        </div>
      )}
    </div>
  );
}
