import "server-only";
import { prisma } from "@/lib/db";
import { CC1_LABELS, CC2_LABELS, CC3_LABELS, SEX_LABELS } from "@/lib/constants/enum-labels";
import { getFlatServices, type Division } from "@/lib/constants/divisions";
import {
  AGE_BUCKETS,
  REPORT_REGION_ORDER,
  getPeriodRange,
  getQuarterMonths,
  getSemesterMonths,
  type ReportPeriodType,
} from "./constants";
import type { ServiceTransactionRow } from "@/app/admin/(protected)/reports/actions";

const SQD_DIMENSIONS = [
  { key: "sqd1", label: "SQD1: Responsiveness" },
  { key: "sqd2", label: "SQD2: Reliability" },
  { key: "sqd3", label: "SQD3: Access and Facilities" },
  { key: "sqd4", label: "SQD4: Communication" },
  { key: "sqd5", label: "SQD5: Costs" },
  { key: "sqd6", label: "SQD6: Integrity" },
  { key: "sqd7", label: "SQD7: Assurance" },
  { key: "sqd8", label: "SQD8: Outcome" },
] as const;

const CC1_ORDER = ["AWARE_BEFORE", "AWARE_ON_SITE", "NOT_AWARE"] as const;
const CC2_ORDER = ["EASY_TO_FIND", "HARD_TO_FIND", "NOT_SEEN"] as const;
const CC3_ORDER = ["USED_CC", "NOT_USED_CC"] as const;
const CLIENT_TYPE_LABELS: Record<string, string> = {
  CITIZEN: "G to C (Government to Client)",
  BUSINESS: "G to B (Government to Business)",
  GOVERNMENT: "G to G (Government to Government)",
};

function pct(count: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((count / total) * 1000) / 10;
}

export type ReportAggregate = Awaited<ReturnType<typeof getAggregateForRange>>;
// Kept for call sites that only ever dealt with the monthly shape.
export type MonthlyAggregate = ReportAggregate;

async function getAggregateForRange(start: Date, end: Date, division: Division) {
  const where = { createdAt: { gte: start, lt: end }, division };
  const services = getFlatServices(division);

  const [
    totalResponses,
    serviceRows,
    cc1Groups,
    cc2Groups,
    cc3Groups,
    sexGroups,
    customerTypeGroups,
    regionGroups,
    ageRows,
    remarkRows,
    sqd0Groups,
    ...sqdGroups
  ] = await Promise.all([
    prisma.surveyResponse.count({ where }),
    // Prisma's groupBy can't group by array element, and a response can list more
    // than one service — tally each response's services client-side instead.
    prisma.surveyResponse.findMany({ where, select: { services: true } }),
    prisma.surveyResponse.groupBy({ where, by: ["cc1"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["cc2"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["cc3"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["sex"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["customerType"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["region"], _count: true }),
    prisma.surveyResponse.findMany({ where, select: { age: true } }),
    prisma.surveyResponse.findMany({
      where: { ...where, remarks: { not: null } },
      select: { remarks: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.surveyResponse.groupBy({ where, by: ["sqd0"], _count: true }),
    ...SQD_DIMENSIONS.map(({ key }) => prisma.surveyResponse.groupBy({ where, by: [key as "sqd1"], _count: true })),
  ]);

  const serviceCountMap = new Map<string, number>();
  for (const row of serviceRows) {
    for (const service of row.services) {
      serviceCountMap.set(service, (serviceCountMap.get(service) ?? 0) + 1);
    }
  }
  const serviceCounts = services.filter((s) => (serviceCountMap.get(s) ?? 0) > 0).map((service) => ({
    service,
    responses: serviceCountMap.get(service) ?? 0,
  }));

  const cc2Total = cc2Groups.filter((g) => g.cc2 !== null).reduce((sum, g) => sum + g._count, 0);
  const cc3Total = cc3Groups.filter((g) => g.cc3 !== null).reduce((sum, g) => sum + g._count, 0);

  const cc1 = CC1_ORDER.map((value) => {
    const count = cc1Groups.find((g) => g.cc1 === value)?._count ?? 0;
    return { label: CC1_LABELS[value], count, pct: pct(count, totalResponses) };
  });
  const cc2 = CC2_ORDER.map((value) => {
    const count = cc2Groups.find((g) => g.cc2 === value)?._count ?? 0;
    return { label: CC2_LABELS[value], count, pct: pct(count, cc2Total) };
  });
  const cc3 = CC3_ORDER.map((value) => {
    const count = cc3Groups.find((g) => g.cc3 === value)?._count ?? 0;
    return { label: CC3_LABELS[value], count, pct: pct(count, cc3Total) };
  });

  const sqd = SQD_DIMENSIONS.map(({ key, label }, i) => {
    const groups = sqdGroups[i] as Array<{ [k: string]: unknown; _count: number }>;
    const counts = [1, 2, 3, 4, 5].map(
      (value) => groups.find((g) => g[key] === value)?._count ?? 0,
    );
    const naCount = groups.find((g) => g[key] === null)?._count ?? 0;
    // Responses/rating % exclude N/A per ARTA CSM methodology — N/A isn't a low score,
    // it means the dimension didn't apply to that transaction.
    const responses = counts.reduce((a, b) => a + b, 0);
    const agree = counts[3] + counts[4];
    return { key, label, counts: [...counts, naCount], responses, ratingPct: pct(agree, responses) };
  });

  // SQD0 is a standalone overall-satisfaction question, not part of the SQD1-8 composite
  // ARTA's methodology is defined over — aggregated the same way but kept separate below.
  const sqd0Counts = [1, 2, 3, 4, 5].map((value) => sqd0Groups.find((g) => g.sqd0 === value)?._count ?? 0);
  const sqd0NaCount = sqd0Groups.find((g) => g.sqd0 === null)?._count ?? 0;
  const sqd0Responses = sqd0Counts.reduce((a, b) => a + b, 0);
  const sqd0Agree = sqd0Counts[3] + sqd0Counts[4];
  const sqd0 = {
    counts: [...sqd0Counts, sqd0NaCount],
    responses: sqd0Responses,
    ratingPct: pct(sqd0Agree, sqd0Responses),
  };

  // Every Sex enum value must be listed here — the report's C.1 Gender table renders
  // exactly these rows, so a value omitted from this array would be stored in the DB
  // but silently missing from (and unaccounted for in) the printed report.
  const sex = (["MALE", "FEMALE", "NON_BINARY", "DID_NOT_SPECIFY"] as const).map((value) => ({
    label: SEX_LABELS[value],
    count: sexGroups.find((g) => g.sex === value)?._count ?? 0,
  }));

  const customerType = (["CITIZEN", "BUSINESS", "GOVERNMENT"] as const).map((value) => ({
    label: CLIENT_TYPE_LABELS[value],
    count: customerTypeGroups.find((g) => g.customerType === value)?._count ?? 0,
  }));

  const age = AGE_BUCKETS.map(({ label, min, max }) => ({
    label,
    count: ageRows.filter((r) => r.age >= min && r.age <= max).length,
  }));

  const regionCountMap = new Map(regionGroups.map((g) => [g.region, g._count]));
  const region = REPORT_REGION_ORDER.map((label) => ({ label, count: regionCountMap.get(label) ?? 0 }));

  const remarks = remarkRows.map((r) => r.remarks!).filter((text) => text.trim() !== "");

  // Overall row: every SQD1-8 dimension summed together, same shape as one `sqd` entry.
  const sqdOverall = sqd.reduce(
    (acc, row) => {
      row.counts.forEach((c, i) => (acc.counts[i] += c));
      acc.responses += row.responses;
      return acc;
    },
    { counts: [0, 0, 0, 0, 0, 0], responses: 0 },
  );
  const sqdOverallAgree = sqdOverall.counts[3] + sqdOverall.counts[4];

  return {
    totalResponses,
    serviceCounts,
    cc1,
    cc2,
    cc3,
    sqd0,
    sqd,
    sqdOverall: { ...sqdOverall, ratingPct: pct(sqdOverallAgree, sqdOverall.responses) },
    sex,
    customerType,
    age,
    region,
    remarks,
  };
}

export async function getMonthlyAggregate(year: number, month: number, division: Division) {
  const { start, end } = getPeriodRange("MONTH", year, month);
  return { periodType: "MONTH" as const, year, period: month, division, ...(await getAggregateForRange(start, end, division)) };
}

export async function getQuarterlyAggregate(year: number, quarter: number, division: Division) {
  const { start, end } = getPeriodRange("QUARTER", year, quarter);
  return { periodType: "QUARTER" as const, year, period: quarter, division, ...(await getAggregateForRange(start, end, division)) };
}

export async function getSemesterAggregate(year: number, semester: number, division: Division) {
  const { start, end } = getPeriodRange("SEMESTER", year, semester);
  return { periodType: "SEMESTER" as const, year, period: semester, division, ...(await getAggregateForRange(start, end, division)) };
}

export async function getAnnualAggregate(year: number, division: Division) {
  const { start, end } = getPeriodRange("YEAR", year, 0);
  return { periodType: "YEAR" as const, year, period: 0, division, ...(await getAggregateForRange(start, end, division)) };
}

export async function getReportAggregate(periodType: ReportPeriodType, year: number, period: number, division: Division) {
  if (periodType === "MONTH") return getMonthlyAggregate(year, period, division);
  if (periodType === "QUARTER") return getQuarterlyAggregate(year, period, division);
  if (periodType === "SEMESTER") return getSemesterAggregate(year, period, division);
  return getAnnualAggregate(year, division);
}

// Suggests "Total Transactions" defaults for a quarterly/annual report by summing the
// already-saved monthly reports covering that period, falling back to a month's actual
// response counts (per service) when no monthly report was saved for it. Staff can still
// edit any number before saving the quarterly/annual report itself.
export async function getRolledUpServiceTransactions(
  periodType: ReportPeriodType,
  year: number,
  period: number,
  division: Division,
): Promise<ServiceTransactionRow[]> {
  const months =
    periodType === "QUARTER"
      ? getQuarterMonths(period)
      : periodType === "SEMESTER"
        ? getSemesterMonths(period)
        : Array.from({ length: 12 }, (_, i) => i + 1);

  const savedReports = await prisma.report.findMany({
    where: { periodType: "MONTH", year, period: { in: months }, division },
  });
  const savedByMonth = new Map(savedReports.map((r) => [r.period, r.serviceTransactions as ServiceTransactionRow[]]));

  const totals = new Map<string, number>();
  for (const month of months) {
    const saved = savedByMonth.get(month);
    if (saved) {
      for (const row of saved) totals.set(row.service, (totals.get(row.service) ?? 0) + row.totalTransactions);
    } else {
      const monthData = await getMonthlyAggregate(year, month, division);
      for (const row of monthData.serviceCounts) totals.set(row.service, (totals.get(row.service) ?? 0) + row.responses);
    }
  }

  const services = getFlatServices(division);
  return services.filter((s) => totals.has(s)).map((service) => ({ service, totalTransactions: totals.get(service)! }));
}
