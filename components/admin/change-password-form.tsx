"use client";

import { useActionState, useState } from "react";
import { CheckCircle, Warning } from "@phosphor-icons/react";
import { changeOwnPassword, type PasswordFormState } from "@/lib/auth/account-actions";
import { PASSWORD_RULE_TEXT } from "@/lib/auth/password-policy";
import { PasswordField } from "./password-field";

const INITIAL_STATE: PasswordFormState = { error: null, success: null, successCount: 0 };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPassword, INITIAL_STATE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {state.error && (
        <div className="alert alert-error" role="alert" style={{ margin: 0 }}>
          <Warning size={20} aria-hidden="true" />
          <p className="alert-summary">{state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="alert alert-success" role="status" style={{ margin: 0 }}>
          <CheckCircle size={20} aria-hidden="true" />
          <p className="alert-summary">{state.success}</p>
        </div>
      )}

      {/* Remounts on each success so the inputs clear; a failed attempt keeps
          the fields as typed so only the wrong one has to be corrected. */}
      <Fields key={state.successCount} formAction={formAction} pending={pending} />
    </div>
  );
}

function Fields({
  formAction,
  pending,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <PasswordField
        id="current-password"
        name="currentPassword"
        label="Current password"
        autoComplete="current-password"
        value={current}
        onChange={setCurrent}
      />

      <PasswordField
        id="new-password"
        name="newPassword"
        label="New password"
        autoComplete="new-password"
        value={next}
        onChange={setNext}
        help={PASSWORD_RULE_TEXT}
      />

      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label="Re-enter new password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        error={mismatch ? "The two new password entries don't match." : undefined}
        help="Other devices signed in as you will be signed out."
      />

      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || !current || !next || !confirm || mismatch}
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}
