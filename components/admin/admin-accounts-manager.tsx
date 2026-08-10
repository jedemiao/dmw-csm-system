"use client";

import { useActionState, useState } from "react";
import { CheckCircle, Key, Prohibit, Warning, X } from "@phosphor-icons/react";
import {
  resetAdminPassword,
  setAccountActive,
  type ManagedAdmin,
  type PasswordFormState,
} from "@/lib/auth/account-actions";
import { PASSWORD_RULE_TEXT } from "@/lib/auth/password-policy";
import { PasswordField } from "./password-field";

const INITIAL_STATE: PasswordFormState = { error: null, success: null, successCount: 0 };

export function AdminAccountsManager({ accounts }: { accounts: ManagedAdmin[] }) {
  const [state, formAction, pending] = useActionState(resetAdminPassword, INITIAL_STATE);
  const [activeState, activeAction, activePending] = useActionState(setAccountActive, INITIAL_STATE);

  const error = state.error ?? activeState.error;
  const success = state.success ?? activeState.success;

  return (
    <div>
      {error && (
        <div className="alert alert-error" role="alert" style={{ margin: "0 0 1.25rem" }}>
          <Warning size={20} aria-hidden="true" />
          <p className="alert-summary">{error}</p>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status" style={{ margin: "0 0 1.25rem" }}>
          <CheckCircle size={20} aria-hidden="true" />
          <p className="alert-summary">{success}</p>
        </div>
      )}

      {/* Remounts on each success, which collapses the panel and clears the
          fields; a failed attempt leaves both as they were. */}
      <AccountList
        key={state.successCount}
        accounts={accounts}
        formAction={formAction}
        pending={pending || activePending}
        activeAction={activeAction}
      />
    </div>
  );
}

function AccountList({
  accounts,
  formAction,
  pending,
  activeAction,
}: {
  accounts: ManagedAdmin[];
  formAction: (formData: FormData) => void;
  pending: boolean;
  activeAction: (formData: FormData) => void;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const target = accounts.find((a) => a.id === targetId) ?? null;

  return (
    <div>
      <div className="data-table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">Accounts you can manage</caption>
          <thead>
            <tr>
              <th scope="col">Username</th>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Division</th>
              <th scope="col">Status</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td style={{ fontFamily: "var(--font-mono)" }}>{account.username}</td>
                <td>{account.name}</td>
                <td>{account.role === "ADMIN" ? "Administrator" : "Staff"}</td>
                <td>{account.divisionLabel}</td>
                <td style={{ color: account.isActive ? undefined : "var(--ink-400)" }}>
                  {account.isActive ? "Active" : "Deactivated"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.7rem", fontSize: "0.8rem" }}
                      aria-expanded={targetId === account.id}
                      onClick={() => setTargetId((id) => (id === account.id ? null : account.id))}
                    >
                      <Key size={15} aria-hidden="true" /> Reset password
                    </button>
                    <form action={activeAction} style={{ display: "inline" }}>
                      <input type="hidden" name="targetId" value={account.id} />
                      <input type="hidden" name="isActive" value={account.isActive ? "false" : "true"} />
                      <button
                        type="submit"
                        className="btn btn-secondary"
                        style={{
                          padding: "0.4rem 0.7rem",
                          fontSize: "0.8rem",
                          color: account.isActive ? "var(--danger-600)" : undefined,
                        }}
                        disabled={pending}
                      >
                        <Prohibit size={15} aria-hidden="true" />
                        {account.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-400)", padding: "1.5rem" }}>
                  No accounts to manage yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {target && (
        <ResetPanel
          key={target.id}
          target={target}
          formAction={formAction}
          pending={pending}
          onCancel={() => setTargetId(null)}
        />
      )}
    </div>
  );
}

function ResetPanel({
  target,
  formAction,
  pending,
  onCancel,
}: {
  target: ManagedAdmin;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  const [actorPassword, setActorPassword] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;

  return (
    <form action={formAction} className="account-reset-panel">
      <input type="hidden" name="targetId" value={target.id} />

      <div className="account-reset-panel__head">
        <div>
          <h4>Reset password for {target.name}</h4>
          <p>
            Username <strong>{target.username}</strong> · {target.divisionLabel}
          </p>
        </div>
        <button type="button" className="account-reset-panel__close" onClick={onCancel} aria-label="Cancel reset">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="account-reset-panel__fields">
        <PasswordField
          id={`reset-new-${target.id}`}
          name="newPassword"
          label="New password for this account"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
          help={PASSWORD_RULE_TEXT}
        />

        <PasswordField
          id={`reset-confirm-${target.id}`}
          name="confirmPassword"
          label="Re-enter new password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          error={mismatch ? "The two new password entries don't match." : undefined}
        />

        <PasswordField
          id={`reset-actor-${target.id}`}
          name="actorPassword"
          label="Your own password"
          autoComplete="current-password"
          value={actorPassword}
          onChange={setActorPassword}
          help={`Confirms it's you. ${target.username} is signed out of all devices and must sign in with the new password — give it to them directly.`}
        />
      </div>

      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || !actorPassword || !next || !confirm || mismatch}
        >
          {pending ? "Resetting..." : `Reset password for ${target.username}`}
        </button>
      </div>
    </form>
  );
}
