"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);

  return (
    <form action={formAction} className="form-shell" style={{ padding: "2rem", maxWidth: 420, marginInline: "auto" }}>
      <h1 style={{ fontSize: "1.3rem", marginBottom: "0.35rem" }}>Admin sign in</h1>
      <p style={{ color: "var(--ink-500)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Restricted to authorized DMW CSM staff.
      </p>

      {state.error && (
        <div className="alert alert-error" role="alert" style={{ margin: "0 0 1.25rem" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <p className="alert-summary">{state.error}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
