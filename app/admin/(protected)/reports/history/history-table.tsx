"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { DownloadSimple, Trash } from "@phosphor-icons/react";
import { clearReportHistory, deleteReportDownload, type ReportDownloadRow } from "./actions";

export function HistoryTable({ rows }: { rows: ReportDownloadRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteReportDownload(id);
      router.refresh();
    });
  }

  function handleClear() {
    if (!confirm("Clear all download history? This can't be undone.")) return;
    startTransition(async () => {
      await clearReportHistory();
      router.refresh();
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={isPending || rows.length === 0}
        >
          <Trash size={16} /> Clear history
        </button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>File</th>
              <th>Downloaded by</th>
              <th>Downloaded at</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.periodLabel}</td>
                <td>{row.filename}</td>
                <td>{row.downloadedByName}</td>
                <td>{new Date(row.downloadedAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <a
                      className="btn btn-secondary"
                      href={row.href}
                      style={{ padding: "0.4rem" }}
                      aria-label={`Download ${row.filename} again`}
                    >
                      <DownloadSimple size={16} />
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem", color: "var(--danger-600)" }}
                      aria-label={`Remove ${row.filename} from history`}
                      disabled={isPending}
                      onClick={() => handleDelete(row.id)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-400)", padding: "1.5rem" }}>
                  No downloads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
