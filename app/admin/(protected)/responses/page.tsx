import { prisma } from "@/lib/db";
import { REGIONS, SERVICES } from "@/lib/constants/survey-options";
import { toReferenceCode } from "@/lib/reference";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { ResponsesTable, type ResponseRow } from "./responses-table";

const PAGE_SIZE = 20;
const CUSTOMER_TYPES = ["CITIZEN", "BUSINESS", "GOVERNMENT"] as const;

type SearchParams = {
  page?: string;
  region?: string;
  service?: string;
  customerType?: string;
  sort?: string;
  highlight?: string;
  reference?: string;
};

// A reference code is CSM-<last 10 chars of the id, uppercased> — recover that
// suffix from user input (with or without the "CSM-" prefix) to filter by id.
function referenceToIdSuffix(reference: string): string {
  return reference.replace(/^CSM-/i, "").trim().toLowerCase();
}

export default async function AdminResponsesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let page = Math.max(1, Number(params.page) || 1);
  const sortDir = params.sort === "createdAt_asc" ? "asc" : "desc";

  const customerType = params.customerType?.toUpperCase();
  const isValidCustomerType = (v: string | undefined): v is (typeof CUSTOMER_TYPES)[number] =>
    (CUSTOMER_TYPES as readonly string[]).includes(v ?? "");

  const referenceSuffix = params.reference ? referenceToIdSuffix(params.reference) : "";

  const where = {
    ...(params.region && (REGIONS as readonly string[]).includes(params.region) ? { region: params.region } : {}),
    ...(params.service && (SERVICES as readonly string[]).includes(params.service) ? { service: params.service } : {}),
    ...(isValidCustomerType(customerType) ? { customerType } : {}),
    ...(referenceSuffix ? { id: { endsWith: referenceSuffix } } : {}),
  };

  // A notification link points at a response by id, not a page number — jump to
  // whichever page that response actually falls on under the current sort/filters
  // instead of trusting a `page` param the link never set.
  let highlightId: string | null = null;
  if (params.highlight) {
    const target = await prisma.surveyResponse.findFirst({
      where: { ...where, id: params.highlight },
      select: { id: true, createdAt: true },
    });
    if (target) {
      highlightId = target.id;
      const precedingCount = await prisma.surveyResponse.count({
        where: { ...where, createdAt: sortDir === "desc" ? { gt: target.createdAt } : { lt: target.createdAt } },
      });
      page = Math.floor(precedingCount / PAGE_SIZE) + 1;
    }
  }

  const [rows, total] = await Promise.all([
    prisma.surveyResponse.findMany({
      where,
      orderBy: { createdAt: sortDir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.surveyResponse.count({ where }),
  ]);

  const data: ResponseRow[] = rows.map((r) => {
    // Null sqd values are N/A answers — exclude them so a dimension marked N/A doesn't
    // drag the average down like a low score would.
    const answered = [r.sqd1, r.sqd2, r.sqd3, r.sqd4, r.sqd5, r.sqd6, r.sqd7, r.sqd8].filter(
      (v): v is number => v !== null,
    );
    return {
      id: r.id,
      reference: toReferenceCode(r.id),
      createdAt: r.createdAt.toISOString(),
      age: r.age,
      sex: r.sex,
      region: r.region,
      service: r.service,
      customerType: r.customerType,
      cc1: r.cc1,
      avgSqd: answered.length > 0 ? answered.reduce((a, b) => a + b, 0) / answered.length : null,
      remarks: r.remarks,
    };
  });

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AutoRefresh />
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Responses</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem" }}>{total.toLocaleString()} total responses.</p>

      <ResponsesTable
        data={data}
        page={page}
        pageCount={pageCount}
        sortDir={sortDir}
        filters={{ region: params.region ?? "", service: params.service ?? "", customerType: params.customerType ?? "" }}
        regions={REGIONS}
        services={SERVICES}
        highlightId={highlightId}
        referenceSearch={params.reference ?? ""}
      />
    </div>
  );
}
