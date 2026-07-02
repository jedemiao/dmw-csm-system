"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DownloadSimple, FloppyDisk, Plus, Trash } from "@phosphor-icons/react";
import { saveReportMeta, type ImprovementPlanRow, type ServiceTransactionRow } from "./actions";
import { MONTH_NAMES } from "@/lib/reports/constants";

export function ReportForm({
  year,
  month,
  totalResponses,
  serviceTransactions: initialServiceTx,
  improvementPlan: initialPlan,
  summaryAnalysis: initialSummary,
  ccAnalysis: initialCc,
  sqdAnalysis: initialSqd,
  preparedByName: initialPreparedName,
  preparedByTitle: initialPreparedTitle,
  approvedByName: initialApprovedName,
  approvedByTitle: initialApprovedTitle,
}: {
  year: number;
  month: number;
  totalResponses: number;
  serviceTransactions: ServiceTransactionRow[];
  improvementPlan: ImprovementPlanRow[];
  summaryAnalysis: string;
  ccAnalysis: string;
  sqdAnalysis: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [serviceTx, setServiceTx] = useState(initialServiceTx);
  const [plan, setPlan] = useState<ImprovementPlanRow[]>(initialPlan.length ? initialPlan : [{ details: "", when: "" }]);
  const [summaryAnalysis, setSummaryAnalysis] = useState(initialSummary);
  const [ccAnalysis, setCcAnalysis] = useState(initialCc);
  const [sqdAnalysis, setSqdAnalysis] = useState(initialSqd);
  const [preparedByName, setPreparedByName] = useState(initialPreparedName);
  const [preparedByTitle, setPreparedByTitle] = useState(initialPreparedTitle);
  const [approvedByName, setApprovedByName] = useState(initialApprovedName);
  const [approvedByTitle, setApprovedByTitle] = useState(initialApprovedTitle);

  function changeMonth(nextYear: number, nextMonth: number) {
    router.push(`/admin/reports?year=${nextYear}&month=${nextMonth}`);
  }

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveReportMeta({
        year,
        month,
        serviceTransactions: serviceTx,
        improvementPlan: plan.filter((r) => r.details.trim() || r.when.trim()),
        summaryAnalysis,
        ccAnalysis,
        sqdAnalysis,
        preparedByName,
        preparedByTitle,
        approvedByName,
        approvedByTitle,
      });
      setSaved(true);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "56rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="report-month">Month</label>
          <select id="report-month" value={month} onChange={(e) => changeMonth(year, Number(e.target.value))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0, maxWidth: "8rem" }}>
          <label htmlFor="report-year">Year</label>
          <input
            id="report-year"
            type="number"
            value={year}
            onChange={(e) => changeMonth(Number(e.target.value) || year, month)}
          />
        </div>
        <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", marginBottom: "0.6rem" }}>
          {totalResponses} response{totalResponses === 1 ? "" : "s"} recorded this month
        </p>
      </div>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>A. Summary</h2>
        {serviceTx.length === 0 ? (
          <p style={{ color: "var(--ink-500)", fontSize: "0.9rem" }}>No survey responses for this service breakdown yet.</p>
        ) : (
          <div className="stat-tile" style={{ padding: "1rem" }}>
            {serviceTx.map((row, i) => (
              <div
                key={row.service}
                style={{ display: "grid", gridTemplateColumns: "1fr 9rem", gap: "0.75rem", alignItems: "center", marginBottom: "0.6rem" }}
              >
                <span style={{ fontSize: "0.9rem" }}>{row.service}</span>
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
            ))}
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
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Continuous Improvement Plan</h2>
        {plan.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 12rem 2.5rem", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              {i === 0 && <label htmlFor={`plan-details-${i}`}>Details</label>}
              <input
                id={`plan-details-${i}`}
                type="text"
                value={row.details}
                onChange={(e) => setPlan((prev) => prev.map((r, idx) => (idx === i ? { ...r, details: e.target.value } : r)))}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              {i === 0 && <label htmlFor={`plan-when-${i}`}>When</label>}
              <input
                id={`plan-when-${i}`}
                type="text"
                value={row.when}
                onChange={(e) => setPlan((prev) => prev.map((r, idx) => (idx === i ? { ...r, when: e.target.value } : r)))}
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
        <button type="button" className="btn btn-secondary" onClick={() => setPlan((prev) => [...prev, { details: "", when: "" }])}>
          <Plus size={16} /> Add row
        </button>
      </section>

      <section>
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>Signatories</h2>
        <div className="field-grid field-grid--two">
          <div className="field">
            <label htmlFor="prepared-name">Prepared by — name</label>
            <input id="prepared-name" type="text" value={preparedByName} onChange={(e) => setPreparedByName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="prepared-title">Prepared by — title</label>
            <input id="prepared-title" type="text" value={preparedByTitle} onChange={(e) => setPreparedByTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="approved-name">Approved by — name</label>
            <input id="approved-name" type="text" value={approvedByName} onChange={(e) => setApprovedByName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="approved-title">Approved by — title</label>
            <input id="approved-title" type="text" value={approvedByTitle} onChange={(e) => setApprovedByTitle(e.target.value)} />
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isPending}>
          <FloppyDisk size={16} /> {isPending ? "Saving…" : "Save"}
        </button>
        <a className="btn btn-secondary" href={`/admin/reports/${year}/${month}/pdf`}>
          <DownloadSimple size={16} /> Download PDF
        </a>
        {saved && !isPending && <span style={{ color: "var(--ink-500)", fontSize: "0.85rem" }}>Saved.</span>}
      </div>
    </div>
  );
}
