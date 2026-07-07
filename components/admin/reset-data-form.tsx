"use client";

import { useState } from "react";
import { Eye, EyeSlash, LockKey, Warning } from "@phosphor-icons/react";

type DeletedCounts = {
  surveyResponses: number;
  reports: number;
  reportDownloads: number;
  submissionThrottles: number;
};

export function ResetDataForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeletedCounts | null>(null);

  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("The two password entries don't match.");
      return;
    }

    setPending(true);

    try {
      const res = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data.deleted);
      setPassword("");
      setPasswordConfirm("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className="alert alert-success" role="status" style={{ margin: 0 }}>
        <p className="alert-summary">
          All survey data has been deleted ({result.surveyResponses} responses, {result.reports} reports,{" "}
          {result.reportDownloads} report downloads, {result.submissionThrottles} throttle records).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && (
        <div className="alert alert-error" role="alert" style={{ margin: 0 }}>
          <Warning size={20} aria-hidden="true" />
          <p className="alert-summary">{error}</p>
        </div>
      )}

      <div className="field">
        <label htmlFor="reset-password">Confirm your password</label>
        <div className="input-icon">
          <LockKey size={18} aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            id="reset-password"
            name="password"
            autoComplete="current-password"
            required
            className="has-toggle"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="input-icon__toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className={`field${mismatch ? " has-error" : ""}`}>
        <label htmlFor="reset-password-confirm">Re-enter your password</label>
        <div className="input-icon">
          <LockKey size={18} aria-hidden="true" />
          <input
            type={showPasswordConfirm ? "text" : "password"}
            id="reset-password-confirm"
            name="passwordConfirm"
            autoComplete="current-password"
            required
            className="has-toggle"
            aria-describedby="reset-password-confirm-error"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          <button
            type="button"
            className="input-icon__toggle"
            onClick={() => setShowPasswordConfirm((v) => !v)}
            aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
            aria-pressed={showPasswordConfirm}
          >
            {showPasswordConfirm ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        <span className="field-error" id="reset-password-confirm-error" role="alert">
          {mismatch ? "Passwords don't match." : ""}
        </span>
        <p className="field-help">
          This permanently deletes all survey responses, reports, and report download history. This cannot be undone.
        </p>
      </div>

      <button
        type="submit"
        className="btn btn-danger"
        disabled={pending || !password || !passwordConfirm || password !== passwordConfirm}
      >
        {pending ? "Deleting..." : "Permanently delete all data"}
      </button>
    </form>
  );
}
