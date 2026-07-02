"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SEX_LABELS, CUSTOMER_TYPE_LABELS, CC1_LABELS } from "@/lib/constants/enum-labels";

export type ResponseRow = {
  id: string;
  createdAt: string;
  age: number;
  sex: string;
  region: string;
  service: string;
  customerType: string;
  cc1: string;
  avgSqd: number;
  remarks: string | null;
};

const columnHelper = createColumnHelper<ResponseRow>();

const columns = [
  columnHelper.accessor("createdAt", {
    header: "Submitted",
    cell: (info) => new Date(info.getValue()).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
  }),
  columnHelper.accessor("age", { header: "Age" }),
  columnHelper.accessor("sex", { header: "Sex", cell: (info) => SEX_LABELS[info.getValue()] ?? info.getValue() }),
  columnHelper.accessor("region", { header: "Region" }),
  columnHelper.accessor("service", { header: "Service" }),
  columnHelper.accessor("customerType", {
    header: "Customer type",
    cell: (info) => CUSTOMER_TYPE_LABELS[info.getValue()] ?? info.getValue(),
  }),
  columnHelper.accessor("cc1", { header: "CC1", cell: (info) => CC1_LABELS[info.getValue()] ?? info.getValue() }),
  columnHelper.accessor("avgSqd", { header: "Avg. SQD", cell: (info) => info.getValue().toFixed(1) }),
  columnHelper.accessor("remarks", {
    header: "Remarks",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "—";
      return value.length > 60 ? `${value.slice(0, 60)}…` : value;
    },
  }),
];

export function ResponsesTable({
  data,
  page,
  pageCount,
  sortDir,
  filters,
  regions,
  services,
}: {
  data: ResponseRow[];
  page: number;
  pageCount: number;
  sortDir: "asc" | "desc";
  filters: { region: string; service: string; customerType: string };
  regions: readonly string[];
  services: readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (!("page" in next)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const filterFields = useMemo(
    () => [
      { key: "region", label: "Region", options: regions },
      { key: "service", label: "Service", options: services },
      { key: "customerType", label: "Customer type", options: ["citizen", "business", "government"] },
    ] as const,
    [regions, services],
  );

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {filterFields.map((field) => (
          <select
            key={field.key}
            aria-label={field.label}
            value={filters[field.key as keyof typeof filters]}
            onChange={(e) => updateParams({ [field.key]: e.target.value || null })}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--ink-900)",
              fontSize: "0.85rem",
            }}
          >
            <option value="">{field.label}: All</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
          onClick={() => updateParams({ sort: sortDir === "desc" ? "createdAt_asc" : "createdAt_desc" })}
        >
          Sort: {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--ink-400)", padding: "1.5rem" }}>
                  No responses match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--ink-500)" }}>
          Page {page} of {pageCount}
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
            disabled={page >= pageCount}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
