"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { DownloadSimple, FloppyDisk, Plus, Trash } from "@phosphor-icons/react";
import { saveReportMeta, type ImprovementPlanRow, type ServiceTransactionRow } from "./actions";
import {
  getPeriodLabel,
  getPeriodSlug,
  MONTH_NAMES,
  QUARTER_LABELS,
  SEMESTER_LABELS,
  type ReportPeriodType,
} from "@/lib/reports/constants";
import type { Division, DivisionMeta } from "@/lib/constants/divisions";

// The File System Access API (Chrome/Edge) isn't in TS's default DOM lib yet —
// declared narrowly here so we can feature-detect it without `any`.
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}
interface FileSystemWritableStream {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableStream>;
}
declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
  }
}

const PERIOD_TYPE_LABELS: Record<ReportPeriodType, string> = {
  MONTH: "Month",
  QUARTER: "Quarter",
  SEMESTER: "Semester",
  YEAR: "Year",
};

const RESPONSE_SCOPE_LABELS: Record<ReportPeriodType, string> = {
  MONTH: "this month",
  QUARTER: "this quarter",
  SEMESTER: "this semester",
  YEAR: "this year",
};

export function ReportForm({
  periodType,
  year,
  period,
  division,
  divisions,
  totalResponses,
  serviceTransactions: initialServiceTx,
  autoServiceTransactions,
  includedServices: initialIncludedServices,
  improvementPlan: initialPlan,
  summaryAnalysis: initialSummary,
  ccAnalysis: initialCc,
  sqdAnalysis: initialSqd,
  actionPlanResults: initialActionPlanResults,
  csmRecommendations: initialCsmRecommendations,
  preparedByName: initialPreparedName,
  preparedByTitle: initialPreparedTitle,
  approvedByName: initialApprovedName,
  approvedByTitle: initialApprovedTitle,
}: {
  periodType: ReportPeriodType;
  year: number;
  period: number;
  division: Division;
  divisions?: readonly DivisionMeta[];
  totalResponses: number;
  serviceTransactions: ServiceTransactionRow[];
  autoServiceTransactions: ServiceTransactionRow[];
  includedServices: string[];
  improvementPlan: ImprovementPlanRow[];
  summaryAnalysis: string;
  ccAnalysis: string;
  sqdAnalysis: string;
  actionPlanResults: string;
  csmRecommendations: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingDownload, setPendingDownload] = useState<{ filename: string; label: string } | null>(null);
  const isDownloadingRef = useRef(false);

  const [serviceTx, setServiceTx] = useState(initialServiceTx);
  const autoTxMap = new Map(autoServiceTransactions.map((r) => [r.service, r.totalTransactions]));
  const [includedServices, setIncludedServices] = useState<Set<string>>(new Set(initialIncludedServices));

  function toggleIncluded(service: string) {
    setIncludedServices((prev) => {
      // Keep at least one service checked — an empty selection isn't a valid report
      // and would be indistinguishable from "no selection saved yet" (see
      // resolveIncludedServices), which falls back to showing everything.
      if (prev.has(service) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });
  }

  function checkAllServices() {
    setIncludedServices(new Set(serviceTx.map((r) => r.service)));
  }

  function uncheckAllServices() {
    // Same "at least one" rule as toggleIncluded — leave the first catalog service
    // checked rather than allowing a fully empty selection.
    setIncludedServices(new Set(serviceTx.length ? [serviceTx[0].service] : []));
  }
  const [plan, setPlan] = useState<ImprovementPlanRow[]>(
    initialPlan.length ? initialPlan : [{ recommendation: "", actionPlan: "", timeline: "" }],
  );
  const [summaryAnalysis, setSummaryAnalysis] = useState(initialSummary);
  const [ccAnalysis, setCcAnalysis] = useState(initialCc);
  const [sqdAnalysis, setSqdAnalysis] = useState(initialSqd);
  const [actionPlanResults, setActionPlanResults] = useState(initialActionPlanResults);
  const [csmRecommendations, setCsmRecommendations] = useState(initialCsmRecommendations);
  const [preparedByName, setPreparedByName] = useState(initialPreparedName);
  const [preparedByTitle, setPreparedByTitle] = useState(initialPreparedTitle);
  const [approvedByName, setApprovedByName] = useState(initialApprovedName);
  const [approvedByTitle, setApprovedByTitle] = useState(initialApprovedTitle);

  function navigate(nextType: ReportPeriodType, nextYear: number, nextPeriod: number, nextDivision: Division) {
    router.push(
      `/admin/reports?type=${nextType.toLowerCase()}&year=${nextYear}&period=${nextPeriod}&division=${nextDivision.toLowerCase()}`,
    );
  }

  function changeType(nextType: ReportPeriodType) {
    if (nextType === periodType) return;
    const now = new Date();
    const defaultPeriod =
      nextType === "MONTH"
        ? now.getMonth() + 1
        : nextType === "QUARTER"
          ? Math.floor(now.getMonth() / 3) + 1
          : nextType === "SEMESTER"
            ? Math.floor(now.getMonth() / 6) + 1
            : 0;
    navigate(nextType, year, defaultPeriod, division);
  }

  const pdfHref = `/admin/reports/pdf?type=${periodType.toLowerCase()}&year=${year}&period=${period}&division=${division.toLowerCase()}`;

  function currentMeta() {
    return {
      periodType,
      year,
      period,
      division,
      // Only persist rows that actually diverge from the live-computed auto value —
      // an unedited field should keep tracking live response totals on every future
      // load instead of freezing at whatever number happened to be showing on save.
      serviceTransactions: serviceTx.filter((r) => r.totalTransactions !== autoTxMap.get(r.service)),
      includedServices: Array.from(includedServices),
      improvementPlan: plan.filter((r) => r.recommendation.trim() || r.actionPlan.trim() || r.timeline.trim()),
      summaryAnalysis,
      ccAnalysis,
      sqdAnalysis,
      actionPlanResults,
      csmRecommendations,
      preparedByName,
      preparedByTitle,
      approvedByName,
      approvedByTitle,
    };
  }

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveReportMeta(currentMeta());
      setSaved(true);
    });
  }

  function openDownloadConfirm() {
    setPendingDownload({
      filename: `CSM-Report-${getPeriodSlug(periodType, year, period)}.pdf`,
      label: getPeriodLabel(periodType, year, period),
    });
    confirmDialogRef.current?.showModal();
  }

  function closeDownloadConfirm() {
    confirmDialogRef.current?.close();
  }

  function confirmDownload() {
    if (!pendingDownload || isDownloadingRef.current) return;
    isDownloadingRef.current = true;
    const { filename } = pendingDownload;
    confirmDialogRef.current?.close();

    setSaved(false);
    startTransition(async () => {
      try {
        // The PDF route reads saved report data from the database, not from this
        // form's state, so unsaved edits (e.g. Description/Analysis text) would
        // silently be missing from the download unless we save first.
        await saveReportMeta(currentMeta());
        setSaved(true);

        const res = await fetch(pdfHref);
        if (!res.ok) {
          alert("Failed to generate the report. Please try again.");
          return;
        }
        const blob = await res.blob();

        // Chrome/Edge: let the admin pick the destination folder via the native
        // save dialog. Falls back to a normal browser download (Firefox/Safari,
        // or if the admin cancels the picker) since that API isn't universal.
        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: filename,
              types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        isDownloadingRef.current = false;
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "56rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        {divisions && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="report-division">Division</label>
            <select
              id="report-division"
              value={division}
              onChange={(e) => navigate(periodType, year, period, e.target.value as Division)}
            >
              {divisions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="report-type">Report type</label>
          <select
            id="report-type"
            value={periodType}
            onChange={(e) => changeType(e.target.value as ReportPeriodType)}
          >
            {(Object.keys(PERIOD_TYPE_LABELS) as ReportPeriodType[]).map((type) => (
              <option key={type} value={type}>
                {PERIOD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        {periodType === "MONTH" && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="report-month">Month</label>
            <select id="report-month" value={period} onChange={(e) => navigate(periodType, year, Number(e.target.value), division)}>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
        {periodType === "QUARTER" && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="report-quarter">Quarter</label>
            <select
              id="report-quarter"
              value={period}
              onChange={(e) => navigate(periodType, year, Number(e.target.value), division)}
            >
              {QUARTER_LABELS.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        {periodType === "SEMESTER" && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="report-semester">Semester</label>
            <select
              id="report-semester"
              value={period}
              onChange={(e) => navigate(periodType, year, Number(e.target.value), division)}
            >
              {SEMESTER_LABELS.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field" style={{ marginBottom: 0, maxWidth: "8rem" }}>
          <label htmlFor="report-year">Year</label>
          <input
            id="report-year"
            type="number"
            value={year}
            onChange={(e) => navigate(periodType, Number(e.target.value) || year, period, division)}
          />
        </div>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.6rem" }}>
          {totalResponses} response{totalResponses === 1 ? "" : "s"} recorded {RESPONSE_SCOPE_LABELS[periodType]}
        </p>
      </div>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>A. Summary</h2>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          Check the services to include in this report. Total transactions auto-fills from actual survey responses
          (or, for quarter/semester/year reports, the rolled-up monthly figures) and keeps updating automatically
          unless you edit a value.
        </p>
        {serviceTx.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
            <button
              type="button"
              onClick={checkAllServices}
              disabled={includedServices.size === serviceTx.length}
              style={{
                font: "inherit",
                fontSize: "0.82rem",
                color: includedServices.size === serviceTx.length ? "var(--ink-400)" : "var(--blue-600)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: includedServices.size === serviceTx.length ? "default" : "pointer",
              }}
            >
              Check all
            </button>
            <button
              type="button"
              onClick={uncheckAllServices}
              disabled={includedServices.size <= 1}
              style={{
                font: "inherit",
                fontSize: "0.82rem",
                color: includedServices.size <= 1 ? "var(--ink-400)" : "var(--blue-600)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: includedServices.size <= 1 ? "default" : "pointer",
              }}
            >
              Uncheck all
            </button>
          </div>
        )}
        {serviceTx.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: "0.9rem" }}>No survey responses for this service breakdown yet.</p>
        ) : (
          <div className="stat-tile" style={{ padding: "1rem" }}>
            {serviceTx.map((row, i) => {
              const checked = includedServices.has(row.service);
              return (
                <div
                  key={row.service}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5rem 1fr 9rem",
                    gap: "0.75rem",
                    alignItems: "center",
                    marginBottom: "0.6rem",
                  }}
                >
                  <input
                    type="checkbox"
                    id={`include-${i}`}
                    checked={checked}
                    onChange={() => toggleIncluded(row.service)}
                    aria-label={`Include ${row.service} in this report`}
                  />
                  <label htmlFor={`include-${i}`} style={{ fontSize: "0.9rem", color: checked ? "var(--ink-900)" : "var(--ink-400)" }}>
                    {row.service}
                  </label>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor={`tx-${i}`} className="field-help">
                      Total transactions
                    </label>
                    <input
                      id={`tx-${i}`}
                      type="number"
                      min={0}
                      value={row.totalTransactions}
                      onChange={(e) => {
                        const value = Number(e.target.value) || 0;
                        setServiceTx((prev) => prev.map((r, idx) => (idx === i ? { ...r, totalTransactions: value } : r)));
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="field" style={{ marginTop: "0.75rem" }}>
          <label htmlFor="summary-analysis">Description/Analysis</label>
          <textarea id="summary-analysis" value={summaryAnalysis} onChange={(e) => setSummaryAnalysis(e.target.value)} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>B. Citizen&apos;s Charter &amp; SQD analysis</h2>
        <div className="field">
          <label htmlFor="cc-analysis">Citizen&apos;s Charter description/analysis</label>
          <textarea id="cc-analysis" value={ccAnalysis} onChange={(e) => setCcAnalysis(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sqd-analysis">Service Quality Dimension description/analysis</label>
          <textarea id="sqd-analysis" value={sqdAnalysis} onChange={(e) => setSqdAnalysis(e.target.value)} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>E. Results of Action Plan Reported</h2>
        <div className="field">
          <label htmlFor="action-plan-results" className="field-help">
            Results of the B/S/Os action plan reported from previously submitted report/s
          </label>
          <textarea id="action-plan-results" value={actionPlanResults} onChange={(e) => setActionPlanResults(e.target.value)} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>F. Continuous Improvement Plan</h2>
        {plan.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 10rem 2.5rem", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              {i === 0 && <label htmlFor={`plan-recommendation-${i}`}>Recommendation</label>}
              <input
                id={`plan-recommendation-${i}`}
                type="text"
                value={row.recommendation}
                onChange={(e) =>
                  setPlan((prev) => prev.map((r, idx) => (idx === i ? { ...r, recommendation: e.target.value } : r)))
                }
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              {i === 0 && <label htmlFor={`plan-action-${i}`}>Action Plan</label>}
              <input
                id={`plan-action-${i}`}
                type="text"
                value={row.actionPlan}
                onChange={(e) => setPlan((prev) => prev.map((r, idx) => (idx === i ? { ...r, actionPlan: e.target.value } : r)))}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              {i === 0 && <label htmlFor={`plan-timeline-${i}`}>Timeline/Period</label>}
              <input
                id={`plan-timeline-${i}`}
                type="text"
                value={row.timeline}
                onChange={(e) => setPlan((prev) => prev.map((r, idx) => (idx === i ? { ...r, timeline: e.target.value } : r)))}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ alignSelf: i === 0 ? "end" : "center", padding: "0.4rem" }}
              aria-label="Remove row"
              onClick={() => setPlan((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPlan((prev) => [...prev, { recommendation: "", actionPlan: "", timeline: "" }])}
        >
          <Plus size={16} /> Add row
        </button>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>G. Recommendations for Improving DMW CSM Reporting</h2>
        <div className="field">
          <label htmlFor="csm-recommendations" className="field-help">
            E.g. best practices, process improvements
          </label>
          <textarea id="csm-recommendations" value={csmRecommendations} onChange={(e) => setCsmRecommendations(e.target.value)} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Signatories</h2>
        <div className="field-grid field-grid--two">
          <div className="field">
            <label htmlFor="prepared-name">Prepared by — name</label>
            <input id="prepared-name" type="text" value={preparedByName} onChange={(e) => setPreparedByName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="prepared-title">Prepared by — title/position</label>
            <input id="prepared-title" type="text" value={preparedByTitle} onChange={(e) => setPreparedByTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="approved-name">Approved by — name</label>
            <input id="approved-name" type="text" value={approvedByName} onChange={(e) => setApprovedByName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="approved-title">Approved by — title/position</label>
            <input id="approved-title" type="text" value={approvedByTitle} onChange={(e) => setApprovedByTitle(e.target.value)} />
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isPending}>
          <FloppyDisk size={16} /> {isPending ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={openDownloadConfirm} disabled={isPending}>
          <DownloadSimple size={16} /> {isPending ? "Saving…" : "Download PDF"}
        </button>
        {saved && !isPending && <span style={{ color: "var(--ink-500)", fontSize: "0.85rem" }}>Saved.</span>}
      </div>

      <dialog ref={confirmDialogRef} className="confirm-dialog" onCancel={() => setPendingDownload(null)}>
        <h2>Confirm</h2>
        {pendingDownload && (
          <p>
            Download the CSM report {pendingDownload.label} as &quot;{pendingDownload.filename}&quot;?
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <button type="button" className="btn btn-secondary" onClick={closeDownloadConfirm}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={confirmDownload} disabled={isPending}>
            Download
          </button>
        </div>
      </dialog>
    </div>
  );
}
