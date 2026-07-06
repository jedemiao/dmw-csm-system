export const BUREAU_NAME = "DEPARTMENT OF MIGRANT WORKERS";
export const OFFICE_NAME = "REGIONAL OFFICE XIII";
export const DIVISION_NAME = "MIGRANT WORKERS PROTECTION DIVISION";
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

const QUARTER_ORDINALS = ["1st", "2nd", "3rd", "4th"] as const;
const SEMESTER_ORDINALS = ["1st", "2nd"] as const;

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

// period: MONTH -> 1-12, QUARTER -> 1-4, SEMESTER -> 1-2, YEAR -> ignored (always the full year).
export function getPeriodRange(periodType: ReportPeriodType, year: number, period: number): { start: Date; end: Date } {
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

// period: MONTH -> 1-12, QUARTER -> 1-4, SEMESTER -> 1-2, YEAR -> ignored (always the full year).
export function getPeriodLabel(periodType: ReportPeriodType, year: number, period: number): string {
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

export type AnalyticsPeriodType = "ALL" | ReportPeriodType;

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
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear();
  return { periodType: "ALL", year, period: 0 };
}
