import { prisma } from "@/lib/db";
import { REGIONS, SERVICES } from "@/lib/constants/survey-options";
import { ResponsesTable, type ResponseRow } from "./responses-table";

const PAGE_SIZE = 20;
const CUSTOMER_TYPES = ["CITIZEN", "BUSINESS", "GOVERNMENT"] as const;

type SearchParams = {
  page?: string;
  region?: string;
  service?: string;
  customerType?: string;
  sort?: string;
};

export default async function AdminResponsesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sortDir = params.sort === "createdAt_asc" ? "asc" : "desc";

  const customerType = params.customerType?.toUpperCase();
  const isValidCustomerType = (v: string | undefined): v is (typeof CUSTOMER_TYPES)[number] =>
    (CUSTOMER_TYPES as readonly string[]).includes(v ?? "");

  const where = {
    ...(params.region && (REGIONS as readonly string[]).includes(params.region) ? { region: params.region } : {}),
    ...(params.service && (SERVICES as readonly string[]).includes(params.service) ? { service: params.service } : {}),
    ...(isValidCustomerType(customerType) ? { customerType } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.surveyResponse.findMany({
      where,
      orderBy: { createdAt: sortDir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.surveyResponse.count({ where }),
  ]);

  const data: ResponseRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    age: r.age,
    sex: r.sex,
    region: r.region,
    service: r.service,
    customerType: r.customerType,
    cc1: r.cc1,
    avgSqd: (r.sqd1 + r.sqd2 + r.sqd3 + r.sqd4 + r.sqd5 + r.sqd6 + r.sqd7 + r.sqd8) / 8,
    remarks: r.remarks,
  }));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
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
      />
    </div>
  );
}
