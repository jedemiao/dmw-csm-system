import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { getReportHistory } from "./actions";
import { HistoryTable } from "./history-table";

export default async function ReportHistoryPage() {
  const rows = await getReportHistory();

  return (
    <div>
      <Link
        href="/admin/reports"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--ink-500)", marginBottom: "0.75rem" }}
      >
        <ArrowLeft size={14} /> Back to reports
      </Link>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Download history</h1>
      <p style={{ color: "var(--ink-500)", marginBottom: "1.5rem" }}>
        Recently downloaded CSM report PDFs. Download a copy again or remove entries you no longer need.
      </p>

      <HistoryTable rows={rows} />
    </div>
  );
}
