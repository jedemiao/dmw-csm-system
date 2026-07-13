import type { Division } from "@/lib/constants/divisions";

export const BUREAU_NAME = "DEPARTMENT OF MIGRANT WORKERS";
export const OFFICE_NAME = "REGIONAL OFFICE XIII";
// All-caps to match this report header's existing style (BUREAU_NAME/OFFICE_NAME above).
export const DIVISION_REPORT_NAMES: Record<Division, string> = {
  FAD: "FINANCE AND ADMINISTRATIVE DIVISION",
  MWPTD: "MIGRANT WORKERS PROTECTION DIVISION",
  MWPSD: "MIGRANT WORKERS PROCESSING DIVISION",
  WRSD: "WELFARE AND REINTEGRATION SERVICES DIVISION",
};
export const OFFICE_LOCATION = "3RD FLOOR ESQUINA DOS BLDG.";
export const OFFICE_ADDRESS = "3rd floor, Esquina Dos Building, J.C. Aquino Avenue cor. Doongan Road, Butuan City, Agusan del Norte, 8600";
export const OFFICE_WEBSITE = "www.dmw.gov.ph";
export const OFFICE_EMAIL = "butuan@dmw.gov.ph";
export const OFFICE_PHONE = "(085)815-1708";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Report demographic order follows the ARTA CSM report template.
export const REPORT_REGION_ORDER = [
  "Region I – Ilocos Region",
  "Region II – Cagayan Valley",
  "Region III – Central Luzon",
  "Region IV-A – CALABARZON",
  "MIMAROPA Region",
  "Region V – Bicol Region",
  "Region VI – Western Visayas",
  "Region VII – Central Visayas",
  "Region VIII – Eastern Visayas",
  "Region IX – Zamboanga Peninsula",
  "Region X – Northern Mindanao",
  "Region XI – Davao Region",
  "Region XII – SOCCSKSARGEN",
  "Region XIII – Caraga",
  "BARMM – Bangsamoro Autonomous Region",
  "CAR – Cordillera Administrative Region",
  "NCR – National Capital Region",
  "Outside the Philippines",
] as const;

export const AGE_BUCKETS = [
  { label: "19 or lower", min: 0, max: 19 },
  { label: "20-34", min: 20, max: 34 },
  { label: "35-49", min: 35, max: 49 },
  { label: "50-64", min: 50, max: 64 },
  { label: "65 or higher", min: 65, max: Infinity },
] as const;

export type ReportPeriodType = "MONTH" | "QUARTER" | "SEMESTER" | "YEAR";

// Superset used by the analytics/overview dashboards, which additionally support a
// "Week" range. Official ARTA report generation (lib/reports/aggregate.ts,
// app/admin/(protected)/reports) stays on ReportPeriodType only — weekly is not a
// recognized ARTA reporting period.
export type DateRangePeriodType = ReportPeriodType | "WEEK";

const QUARTER_ORDINALS = ["1st", "2nd", "3rd", "4th"] as const;
const SEMESTER_ORDINALS = ["1st", "2nd"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

// Monday on or before Jan 1 of `year` (UTC). Anchors this file's Monday-start week
// numbering: week 1 is the week containing Jan 1, so it can start in December.
function startOfYearMonday(year: number): Date {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const daysSinceMonday = (jan1.getUTCDay() + 6) % 7;
  return new Date(jan1.getTime() - daysSinceMonday * MS_PER_DAY);
}

// Number of weeks in `year` under this file's week numbering (52 or 53).
export function getWeeksInYear(year: number): number {
  return Math.round((startOfYearMonday(year + 1).getTime() - startOfYearMonday(year).getTime()) / MS_PER_WEEK);
}

// The (year, week) pair containing `date`, under this file's week numbering. `date`'s
// own year is used unless `date` already falls in the following year's week 1 (which
// can start a few days before Dec 31).
export function getWeekNumberForDate(date: Date): { year: number; week: number } {
  const calendarYear = date.getUTCFullYear();
  const year = date.getTime() >= startOfYearMonday(calendarYear + 1).getTime() ? calendarYear + 1 : calendarYear;
  const week = Math.floor((date.getTime() - startOfYearMonday(year).getTime()) / MS_PER_WEEK) + 1;
  return { year, week };
}

// period: WEEK -> 1-53, Monday-Sunday.
function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  const start = new Date(startOfYearMonday(year).getTime() + (week - 1) * MS_PER_WEEK);
  return { start, end: new Date(start.getTime() + MS_PER_WEEK) };
}

// Human-readable date span for a week, e.g. "Jun 29–Jul 5, 2026" or, across a year
// boundary, "Dec 29, 2025–Jan 4, 2026".
export function getWeekRangeLabel(year: number, week: number): string {
  const { start } = getWeekRange(year, week);
  const end = new Date(start.getTime() + 6 * MS_PER_DAY);
  const fmt = (d: Date) => `${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
  return start.getUTCFullYear() === end.getUTCFullYear()
    ? `${fmt(start)}–${fmt(end)}, ${end.getUTCFullYear()}`
    : `${fmt(start)}, ${start.getUTCFullYear()}–${fmt(end)}, ${end.getUTCFullYear()}`;
}

// Calendar quarters: Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec.
export const QUARTER_LABELS = ["Q1 (Jan–Mar)", "Q2 (Apr–Jun)", "Q3 (Jul–Sep)", "Q4 (Oct–Dec)"] as const;

// Calendar semesters (PH government convention): S1 Jan-Jun, S2 Jul-Dec.
export const SEMESTER_LABELS = ["S1 (Jan–Jun)", "S2 (Jul–Dec)"] as const;

export function getQuarterMonths(quarter: number): [number, number, number] {
  const start = (quarter - 1) * 3 + 1;
  return [start, start + 1, start + 2];
}

export function getSemesterMonths(semester: number): [number, number, number, number, number, number] {
  const start = (semester - 1) * 6 + 1;
  return [start, start + 1, start + 2, start + 3, start + 4, start + 5];
}

// period: WEEK -> 1-53, MONTH -> 1-12, QUARTER -> 1-4, SEMESTER -> 1-2, YEAR -> ignored (always the full year).
export function getPeriodRange(periodType: DateRangePeriodType, year: number, period: number): { start: Date; end: Date } {
  if (periodType === "WEEK") {
    return getWeekRange(year, period);
  }
  if (periodType === "MONTH") {
    return { start: new Date(Date.UTC(year, period - 1, 1)), end: new Date(Date.UTC(year, period, 1)) };
  }
  if (periodType === "QUARTER") {
    const [startMonth] = getQuarterMonths(period);
    return { start: new Date(Date.UTC(year, startMonth - 1, 1)), end: new Date(Date.UTC(year, startMonth + 2, 1)) };
  }
  if (periodType === "SEMESTER") {
    const [startMonth] = getSemesterMonths(period);
    return { start: new Date(Date.UTC(year, startMonth - 1, 1)), end: new Date(Date.UTC(year, startMonth + 5, 1)) };
  }
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}

// period: WEEK -> 1-53, MONTH -> 1-12, QUARTER -> 1-4, SEMESTER -> 1-2, YEAR -> ignored (always the full year).
export function getPeriodLabel(periodType: DateRangePeriodType, year: number, period: number): string {
  if (periodType === "WEEK") return `For the Week of ${getWeekRangeLabel(year, period)}`;
  if (periodType === "MONTH") return `For the Month of ${MONTH_NAMES[period - 1]} ${year}`;
  if (periodType === "QUARTER") {
    const [startMonth, , endMonth] = getQuarterMonths(period);
    return `For the ${QUARTER_ORDINALS[period - 1]} Quarter (${MONTH_NAMES[startMonth - 1]}–${MONTH_NAMES[endMonth - 1]}) ${year}`;
  }
  if (periodType === "SEMESTER") {
    const months = getSemesterMonths(period);
    const startMonth = months[0];
    const endMonth = months[months.length - 1];
    return `For the ${SEMESTER_ORDINALS[period - 1]} Semester (${MONTH_NAMES[startMonth - 1]}–${MONTH_NAMES[endMonth - 1]}) ${year}`;
  }
  return `For the Year ${year}`;
}

// The period immediately before the given one, wrapping into the prior year (period: WEEK ->
// 1-53, MONTH -> 1-12, QUARTER -> 1-4, SEMESTER -> 1-2, YEAR -> ignored). Used for
// period-over-period trends.
export function getPreviousPeriod(periodType: DateRangePeriodType, year: number, period: number): { year: number; period: number } {
  if (periodType === "YEAR") return { year: year - 1, period: 0 };
  if (periodType === "WEEK") {
    if (period > 1) return { year, period: period - 1 };
    const prevYear = year - 1;
    return { year: prevYear, period: getWeeksInYear(prevYear) };
  }
  const max = periodType === "QUARTER" ? 4 : periodType === "SEMESTER" ? 2 : 12;
  return period <= 1 ? { year: year - 1, period: max } : { year, period: period - 1 };
}

// Short, filesystem-safe slug for report filenames, e.g. "July-2026", "Q3-2026", "S1-2026", "2026".
export function getPeriodSlug(periodType: ReportPeriodType, year: number, period: number): string {
  if (periodType === "MONTH") return `${MONTH_NAMES[period - 1]}-${year}`;
  if (periodType === "QUARTER") return `Q${period}-${year}`;
  if (periodType === "SEMESTER") return `S${period}-${year}`;
  return `${year}`;
}

// Parses `?type=&year=&period=` query params into a bounded, always-valid report
// period. Unrecognized/out-of-range input falls back to the current period instead
// of reaching Prisma as an invalid enum value or NaN (see security audit finding 4.1).
export function parseReportQuery(
  raw: { type?: string; year?: string; period?: string },
  now: Date = new Date(),
): { periodType: ReportPeriodType; year: number; period: number } {
  const upperType = raw.type?.toUpperCase();
  const periodType: ReportPeriodType =
    upperType === "QUARTER" ? "QUARTER" : upperType === "SEMESTER" ? "SEMESTER" : upperType === "YEAR" ? "YEAR" : "MONTH";

  const rawYear = Number(raw.year);
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear();

  const defaultPeriod =
    periodType === "MONTH"
      ? now.getMonth() + 1
      : periodType === "QUARTER"
        ? Math.floor(now.getMonth() / 3) + 1
        : periodType === "SEMESTER"
          ? Math.floor(now.getMonth() / 6) + 1
          : 0;

  if (periodType === "YEAR") return { periodType, year, period: 0 };

  const rawPeriod = Number(raw.period);
  const max = periodType === "QUARTER" ? 4 : periodType === "SEMESTER" ? 2 : 12;
  const period = Number.isInteger(rawPeriod) && rawPeriod >= 1 && rawPeriod <= max ? rawPeriod : defaultPeriod;

  return { periodType, year, period };
}

export type AnalyticsPeriodType = "ALL" | DateRangePeriodType;

// Parses `?range=&year=&period=` for the analytics dashboard filter. Unlike report
// queries (which always need a concrete saved period), "ALL" — no date filter — is a
// valid and default choice here.
export function parseAnalyticsQuery(
  raw: { range?: string; year?: string; period?: string },
  now: Date = new Date(),
): { periodType: AnalyticsPeriodType; year: number; period: number } {
  const upper = raw.range?.toUpperCase();
  if (upper === "MONTH" || upper === "QUARTER" || upper === "SEMESTER" || upper === "YEAR") {
    return parseReportQuery({ type: upper, year: raw.year, period: raw.period }, now);
  }

  const rawYear = Number(raw.year);

  if (upper === "WEEK") {
    const nowDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const currentWeek = getWeekNumberForDate(nowDate);
    const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : currentWeek.year;
    const maxWeek = getWeeksInYear(year);
    const defaultPeriod = year === currentWeek.year ? Math.min(currentWeek.week, maxWeek) : 1;
    const rawPeriod = Number(raw.period);
    const period = Number.isInteger(rawPeriod) && rawPeriod >= 1 && rawPeriod <= maxWeek ? rawPeriod : defaultPeriod;
    return { periodType: "WEEK", year, period };
  }

  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear();
  return { periodType: "ALL", year, period: 0 };
}
