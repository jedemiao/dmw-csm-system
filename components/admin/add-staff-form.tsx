"use client";

import { useActionState, useState } from "react";
import { CheckCircle, UserPlus, Warning, X } from "@phosphor-icons/react";
import { createStaffAccount, type PasswordFormState } from "@/lib/auth/account-actions";
import { PASSWORD_RULE_TEXT } from "@/lib/auth/password-policy";
import type { DivisionMeta } from "@/lib/constants/divisions";
import { PasswordField } from "./password-field";

const INITIAL_STATE: PasswordFormState = { error: null, success: null, successCount: 0 };

export function AddStaffForm({
  divisionLabel,
  divisions,
}: {
  // Set for a division admin — their staff are pinned to this division.
  divisionLabel: string | null;
  // Set only for oversight, who must pick which division the staff belong to.
  divisions?: readonly DivisionMeta[];
}) {
  const [state, formAction, pending] = useActionState(createStaffAccount, INITIAL_STATE);
  const [open, setOpen] = useState(false);

  return (
    <div>
      {state.error && (
        <div className="alert alert-error" role="alert" style={{ margin: "0 0 1.25rem" }}>
          <Warning size={20} aria-hidden="true" />
          <p className="alert-summary">{state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="alert alert-success" role="status" style={{ margin: "0 0 1.25rem" }}>
          <CheckCircle size={20} aria-hidden="true" />
          <p className="alert-summary">{state.success}</p>
        </div>
      )}

      {!open ? (
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
          <UserPlus size={16} aria-hidden="true" /> Add staff account
        </button>
      ) : (
        // Remounts after each success so every field clears; a failed attempt
        // keeps what was typed so only the bad field needs fixing.
        <StaffFields
          key={state.successCount}
          formAction={formAction}
          pending={pending}
          divisionLabel={divisionLabel}
          divisions={divisions}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function StaffFields({
  formAction,
  pending,
  divisionLabel,
  divisions,
  onCancel,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  divisionLabel: string | null;
  divisions?: readonly DivisionMeta[];
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [division, setDivision] = useState(divisions?.[0]?.slug ?? "");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [actorPassword, setActorPassword] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    !pending && name.trim() && username.trim() && next && confirm && actorPassword && !mismatch;

  return (
    <form action={formAction} className="account-reset-panel">
      <div className="account-reset-panel__head">
        <div>
          <h4>New staff account</h4>
          <p>
            {divisionLabel
              ? `Signs in with their own credentials, scoped to ${divisionLabel}.`
              : "Signs in with their own credentials, scoped to the division you choose."}
          </p>
        </div>
        <button type="button" className="account-reset-panel__close" onClick={onCancel} aria-label="Cancel">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="account-reset-panel__fields">
        <div className="field">
          <label htmlFor="staff-name">Full name</label>
          <input id="staff-name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="staff-username">Username</label>
          <input
            id="staff-username"
            name="username"
            type="text"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-describedby="staff-username-help"
          />
          <p className="field-help" id="staff-username-help">
            Lowercase letters, numbers, dot, underscore or hyphen. This is what they type to sign in.
          </p>
        </div>

        {divisions ? (
          <div className="field">
            <label htmlFor="staff-division">Division</label>
            <select id="staff-division" name="division" value={division} onChange={(e) => setDivision(e.target.value)}>
              {divisions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="staff-division-fixed">Division</label>
            <input id="staff-division-fixed" type="text" value={divisionLabel ?? ""} readOnly />
          </div>
        )}

        <PasswordField
          id="staff-password"
          name="newPassword"
          label="Temporary password"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
          help={PASSWORD_RULE_TEXT}
        />

        <PasswordField
          id="staff-password-confirm"
          name="confirmPassword"
          label="Re-enter password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          error={mismatch ? "The two password entries don't match." : undefined}
        />

        <PasswordField
          id="staff-actor-password"
          name="actorPassword"
          label="Your own password"
          autoComplete="current-password"
          value={actorPassword}
          onChange={setActorPassword}
          help="Confirms it's you creating this account. Give the new password to the staff member directly — it is not emailed and can't be shown again."
        />
      </div>

      <div>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {pending ? "Creating..." : "Create staff account"}
        </button>
      </div>
    </form>
  );
}
