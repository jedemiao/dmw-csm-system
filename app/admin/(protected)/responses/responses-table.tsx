"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SEX_LABELS, CUSTOMER_TYPE_LABELS, CC1_LABELS } from "@/lib/constants/enum-labels";
import { getDivisionLabel, type Division, type DivisionMeta } from "@/lib/constants/divisions";

export type ResponseRow = {
  id: string;
  reference: string;
  createdAt: string;
  age: number;
  sex: string;
  region: string;
  division: Division;
  services: string[];
  customerType: string;
  cc1: string;
  avgSqd: number | null;
  remarks: string | null;
};

const columnHelper = createColumnHelper<ResponseRow>();

const columns = [
  columnHelper.accessor("reference", { header: "Reference" }),
  columnHelper.accessor("createdAt", {
    header: "Submitted",
    cell: (info) => new Date(info.getValue()).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
  }),
  columnHelper.accessor("age", { header: "Age" }),
  columnHelper.accessor("sex", { header: "Sex", cell: (info) => SEX_LABELS[info.getValue()] ?? info.getValue() }),
  columnHelper.accessor("region", { header: "Region" }),
  columnHelper.accessor("division", { header: "Division", cell: (info) => getDivisionLabel(info.getValue()) }),
  columnHelper.accessor("services", { header: "Service", cell: (info) => info.getValue().join(", ") }),
  columnHelper.accessor("customerType", {
    header: "Customer type",
    cell: (info) => CUSTOMER_TYPE_LABELS[info.getValue()] ?? info.getValue(),
  }),
  columnHelper.accessor("cc1", { header: "CC1", cell: (info) => CC1_LABELS[info.getValue()] ?? info.getValue() }),
  columnHelper.accessor("avgSqd", { header: "Avg. SQD", cell: (info) => info.getValue()?.toFixed(1) ?? "—" }),
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
  divisions,
  highlightId,
  referenceSearch,
}: {
  data: ResponseRow[];
  page: number;
  pageCount: number;
  sortDir: "asc" | "desc";
  filters: { region: string; service: string; customerType: string; division: string };
  regions: readonly string[];
  services: readonly string[];
  divisions?: readonly DivisionMeta[];
  highlightId?: string | null;
  referenceSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  const [referenceInput, setReferenceInput] = useState(referenceSearch);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  useEffect(() => {
    highlightRowRef.current?.scrollIntoView({ block: "center" });
  }, [highlightId]);

  useEffect(() => {
    if (referenceInput === referenceSearch) return;
    const timeout = setTimeout(() => updateParams({ reference: referenceInput.trim() || null }), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceInput]);

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
        <input
          type="search"
          aria-label="Search by reference"
          placeholder="Search by reference (e.g. CSM-FZ60RTLUTH)"
          value={referenceInput}
          onChange={(e) => setReferenceInput(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--ink-900)",
            fontSize: "0.85rem",
            minWidth: "220px",
          }}
        />
        {divisions && (
          <select
            aria-label="Division"
            value={filters.division}
            onChange={(e) => updateParams({ division: e.target.value || null })}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--ink-900)",
              fontSize: "0.85rem",
            }}
          >
            <option value="">Division: All</option>
            {divisions.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
        )}
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
            {table.getRowModel().rows.map((row) => {
              const isHighlighted = row.original.id === highlightId;
              return (
                <tr
                  key={row.id}
                  ref={isHighlighted ? highlightRowRef : undefined}
                  className={isHighlighted ? "data-table__row--highlighted" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              );
            })}
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
