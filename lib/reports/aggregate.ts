import "server-only";
import { prisma } from "@/lib/db";
import { CC1_LABELS, CC2_LABELS, CC3_LABELS, SEX_LABELS } from "@/lib/constants/enum-labels";
import { SERVICES } from "@/lib/constants/survey-options";
import { AGE_BUCKETS, REPORT_REGION_ORDER } from "./constants";

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

export type MonthlyAggregate = Awaited<ReturnType<typeof getMonthlyAggregate>>;

export async function getMonthlyAggregate(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const where = { createdAt: { gte: start, lt: end } };

  const [
    totalResponses,
    serviceGroups,
    cc1Groups,
    cc2Groups,
    cc3Groups,
    sexGroups,
    customerTypeGroups,
    regionGroups,
    ageRows,
    ...sqdGroups
  ] = await Promise.all([
    prisma.surveyResponse.count({ where }),
    prisma.surveyResponse.groupBy({ where, by: ["service"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["cc1"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["cc2"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["cc3"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["sex"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["customerType"], _count: true }),
    prisma.surveyResponse.groupBy({ where, by: ["region"], _count: true }),
    prisma.surveyResponse.findMany({ where, select: { age: true } }),
    ...SQD_DIMENSIONS.map(({ key }) => prisma.surveyResponse.groupBy({ where, by: [key as "sqd1"], _count: true })),
  ]);

  const serviceCountMap = new Map(serviceGroups.map((g) => [g.service, g._count]));
  const serviceCounts = SERVICES.filter((s) => (serviceCountMap.get(s) ?? 0) > 0).map((service) => ({
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
    const responses = counts.reduce((a, b) => a + b, 0);
    const agree = counts[3] + counts[4];
    return { key, label, counts, responses, ratingPct: pct(agree, responses) };
  });

  const sex = (["FEMALE", "MALE"] as const).map((value) => ({
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

  return {
    year,
    month,
    totalResponses,
    serviceCounts,
    cc1,
    cc2,
    cc3,
    sqd,
    sex,
    customerType,
    age,
    region,
  };
}
